import Parser from "rss-parser";
import { URL } from "url";
import { db } from "./db";
import { safeFetchText } from "./network-safety";
import { logAuditEvent } from "./audit";

const rssParser = new Parser({
  customFields: {
    item: ["description", "content:encoded", "category", "dc:creator", "pubDate"],
  },
});

/**
 * Normalizes an incoming URL into its canonical form
 * by removing tracking parameters and standardizing slashes.
 */
export function normalizeCanonicalUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Remove query params used for tracking
    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "fbclid", "gclid", "msclkid", "ref", "source", "origin", "platform"
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    // Sort remaining params for consistency
    parsed.searchParams.sort();

    // Standardize pathname (remove trailing slash except root)
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Normalizes headline text for fuzzy comparison
 */
export function normalizeHeadline(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates Jaccard similarity between two titles using word tokens (min length 2)
 */
export function calculateTitleSimilarity(titleA: string, titleB: string): number {
  const wordsA = new Set(normalizeHeadline(titleA).split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(normalizeHeadline(titleB).split(" ").filter((w) => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Flags high-impact topics (health, finance, legal, emergency) that require specialist review
 */
export function detectHighImpactTopic(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  const highImpactKeywords = [
    // Kesehatan (Health)
    "kemenkes", "vaksin", "wabah", "pandemi", "obat keras", "resep dokter", "bpom", "uji klinis",
    // Keuangan (Finance)
    "ojk", "investasi bodong", "skema ponzi", "bunga pinjol", "suku bunga bi", "ihsg", "dividen", "pailit",
    // Hukum (Legal)
    "kpk", "tersangka", "kejaksaan agung", "vonis hakim", "praperadilan", "dakwaan", "kasasi", "tipikor",
    // Bencana / Darurat (Emergency)
    "gempa bumi", "tsunami", "gunung meletus", "evakuasi darurat", "banjir bandang", "basarnas", "bmkg peringatan dini"
  ];

  return highImpactKeywords.some((keyword) => text.includes(keyword));
}

export interface IngestionOptions {
  sourceId: string;
  userId?: string;
  maxItems?: number;
}

export interface IngestionStats {
  sourceId: string;
  sourceName: string;
  fetchedCount: number;
  newDiscoveredCount: number;
  duplicateCount: number;
  errors: string[];
}

/**
 * Executes feed ingestion for a single source with retry and duplicate protection
 */
export async function executeSourceIngestion(options: IngestionOptions): Promise<IngestionStats> {
  const source = await db.ingestionSource.findUnique({
    where: { id: options.sourceId },
  });

  if (!source) {
    throw new Error(`Sumber dengan ID '${options.sourceId}' tidak ditemukan.`);
  }

  const stats: IngestionStats = {
    sourceId: source.id,
    sourceName: source.name,
    fetchedCount: 0,
    newDiscoveredCount: 0,
    duplicateCount: 0,
    errors: [],
  };

  if (!source.isActive) {
    stats.errors.push(`Sumber '${source.name}' saat ini berstatus nonaktif.`);
    return stats;
  }

  // Fetch with exponential backoff (up to 2 retries)
  let rawFeedXml = "";
  let lastFetchError: Error | null = null;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      rawFeedXml = await safeFetchText(source.url, { timeoutMs: 15000 });
      break;
    } catch (err: any) {
      lastFetchError = err;
      if (attempt < maxRetries) {
        // Wait exponential delay (1s, 2s)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  if (!rawFeedXml) {
    const errorMsg = `Gagal mengunduh feed setelah ${maxRetries + 1} percobaan: ${lastFetchError?.message}`;
    await db.ingestionSource.update({
      where: { id: source.id },
      data: { lastError: errorMsg },
    });
    stats.errors.push(errorMsg);
    return stats;
  }

  // Parse feed
  let parsedFeed: Parser.Output<{ [key: string]: any }>;
  try {
    parsedFeed = await rssParser.parseString(rawFeedXml);
  } catch (parseErr: any) {
    const errorMsg = `Gagal mem-parsing XML feed RSS: ${parseErr.message}`;
    await db.ingestionSource.update({
      where: { id: source.id },
      data: { lastError: errorMsg },
    });
    stats.errors.push(errorMsg);
    return stats;
  }

  const items = parsedFeed.items || [];
  stats.fetchedCount = items.length;
  const maxLimit = options.maxItems || 40;
  const itemsToProcess = items.slice(0, maxLimit);

  // Fetch recent items from the past 7 days for duplicate checking
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const existingRecentItems = await db.ingestedItem.findMany({
    where: { discoveredAt: { gte: sevenDaysAgo } },
    select: { id: true, title: true, canonicalUrl: true, originalUrl: true },
    take: 300,
  });

  const existingRecentArticles = await db.article.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { id: true, title: true, slug: true },
    take: 200,
  });

  for (const item of itemsToProcess) {
    const originalLink = item.link || item.guid;
    const title = item.title?.trim();

    if (!originalLink || !title) continue;

    const canonicalUrl = normalizeCanonicalUrl(originalLink);

    // 1. Check exact URL in database
    const exactUrlItem = await db.ingestedItem.findFirst({
      where: {
        OR: [
          { originalUrl: originalLink },
          { canonicalUrl: canonicalUrl },
        ],
      },
    });

    if (exactUrlItem) {
      stats.duplicateCount++;
      continue;
    }

    // 2. Check title similarity against existing ingested items & articles
    let isDuplicate = false;
    let duplicateOfId: string | null = null;
    let duplicateScore: number = 0;
    let duplicateReason: string | null = null;

    for (const existing of existingRecentItems) {
      const score = calculateTitleSimilarity(title, existing.title);
      if (score >= 0.70) {
        isDuplicate = true;
        duplicateOfId = existing.id;
        duplicateScore = score;
        duplicateReason = `Mirip ${(score * 100).toFixed(0)}% dengan item '${existing.title}' (${existing.id})`;
        break;
      }
    }

    if (!isDuplicate) {
      for (const art of existingRecentArticles) {
        const score = calculateTitleSimilarity(title, art.title);
        if (score >= 0.70) {
          isDuplicate = true;
          duplicateScore = score;
          duplicateReason = `Mirip ${(score * 100).toFixed(0)}% dengan artikel terbit '${art.title}'`;
          break;
        }
      }
    }

    const rawContent = item["content:encoded"] || item.content || item.summary || item.description || "";
    const excerpt = item.description || (rawContent ? rawContent.replace(/<[^>]*>/g, " ").slice(0, 300) : "");
    const author = item["dc:creator"] || item.author || null;
    const isHighImpact = detectHighImpactTopic(title, rawContent);

    const initialStatus = isDuplicate ? "DUPLICATE" : "READY_FOR_AI_DRAFT";

    try {
      await db.ingestedItem.create({
        data: {
          sourceId: source.id,
          originalUrl: originalLink,
          canonicalUrl: canonicalUrl,
          title: title,
          originalPublishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          discoveredAt: new Date(),
          rawContent: rawContent,
          excerpt: excerpt,
          author: author,
          detectedCategory: item.category || source.allowedCategories || "Nasional",
          status: initialStatus,
          duplicateOfId: duplicateOfId,
          duplicateScore: duplicateScore > 0 ? duplicateScore : null,
          duplicateReason: duplicateReason,
          isHighImpact: isHighImpact,
        },
      });

      if (isDuplicate) {
        stats.duplicateCount++;
      } else {
        stats.newDiscoveredCount++;
      }
    } catch (saveErr: any) {
      // Ignore unique constraint race conditions
      if (!saveErr.message.includes("Unique constraint")) {
        stats.errors.push(`Gagal menyimpan '${title}': ${saveErr.message}`);
      }
    }
  }

  // Update source health
  await db.ingestionSource.update({
    where: { id: source.id },
    data: {
      lastFetchedAt: new Date(),
      lastError: null,
      itemCount: { increment: stats.newDiscoveredCount },
    },
  });

  // Log audit event
  await logAuditEvent({
    userId: options.userId || null,
    action: "NEWS_SOURCE_SYNC",
    entityType: "IngestionSource",
    entityId: source.id,
    details: stats,
  });

  return stats;
}

