import Parser from "rss-parser";
import { URL } from "url";
import fs from "fs";
import path from "path";
import { ArticleStatus } from "@prisma/client";
import { db } from "./db";
import { safeFetchText } from "./network-safety";
import { logAuditEvent } from "./audit";
import { generateAiNewsDraft } from "./ai-news-draft";
import { generateSlug } from "./slug";
import { calculateReadingTime, SITE_URL } from "./seo";
import { getCategoryVisual } from "./category-images";
import { notifySearchEnginesOfNewArticle } from "./indexing-service";

const rssParser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure"],
      "description",
      "content:encoded",
      "category",
      "dc:creator",
      "pubDate",
    ],
  },
});

/**
 * Syncs published article directly to portal-data.json for edge / static serving
 */
function syncArticleToPortalData(article: any) {
  try {
    const portalDataPath = path.join(process.cwd(), "src", "data", "portal-data.json");
    if (fs.existsSync(portalDataPath)) {
      const data = JSON.parse(fs.readFileSync(portalDataPath, "utf8"));
      if (Array.isArray(data.articles)) {
        const idx = data.articles.findIndex((a: any) => a.id === article.id || a.slug === article.slug);
        const articleJson = {
          ...article,
          category: article.category ? { id: article.category.id, name: article.category.name, slug: article.category.slug } : undefined,
          author: article.author ? { id: article.author.id, displayName: article.author.displayName } : undefined,
        };
        if (idx >= 0) {
          data.articles[idx] = { ...data.articles[idx], ...articleJson };
        } else {
          data.articles.unshift(articleJson);
        }
        fs.writeFileSync(portalDataPath, JSON.stringify(data, null, 2), "utf8");
      }
    }
  } catch (err: any) {
    console.warn("Could not sync article to portal-data.json:", err.message);
  }
}

/**
 * Extracts news image from RSS item enclosure, media tag, or html body
 */
export function extractFeedItemImage(item: any): string | null {
  // 1. Enclosure tag check
  if (item.enclosure && item.enclosure.url) {
    let url = String(item.enclosure.url).trim();
    if (url.startsWith("http")) {
      // Upgrade Detik/CNN/CNBC thumbnail to higher resolution
      if (url.includes("detik.net.id") && url.includes("w=360")) {
        url = url.replace("w=360", "w=750");
      }
      return url;
    }
  }

  // 2. Media:content
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
    const url = String(item.mediaContent.$.url).trim();
    if (url.startsWith("http")) return url;
  }

  // 3. Media:thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
    const url = String(item.mediaThumbnail.$.url).trim();
    if (url.startsWith("http")) return url;
  }

  // 4. HTML img tag in content:encoded or description
  const htmlContent = (item["content:encoded"] || item.content || item.description || "") as string;
  const match = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1] && match[1].startsWith("http")) {
    return match[1];
  }

  return null;
}

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
  autoDraft?: boolean;
  autoPublish?: boolean; // TRUE: Automatically publish directly without waiting for click/approval
}

export interface IngestionStats {
  sourceId: string;
  sourceName: string;
  fetchedCount: number;
  newDiscoveredCount: number;
  draftsGeneratedCount: number;
  autoPublishedCount: number;
  duplicateCount: number;
  errors: string[];
}

/**
 * Executes feed ingestion for a single source with retry, duplicate protection, and optional full auto-publish
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
    draftsGeneratedCount: 0,
    autoPublishedCount: 0,
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
  const maxLimit = options.maxItems || 20;
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

  const defaultAuthor = await db.authorProfile.findFirst();
  const authorId = defaultAuthor?.id || null;

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
    const extractedImage = extractFeedItemImage(item);

    const initialStatus = isDuplicate ? "DUPLICATE" : "READY_FOR_AI_DRAFT";

    try {
      const createdItem = await db.ingestedItem.create({
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

        // Generate Journalistic AI Draft
        let draftResult: any = null;
        if (options.autoDraft !== false || options.autoPublish !== false) {
          try {
            draftResult = await generateAiNewsDraft(createdItem.id);
            await db.ingestedItem.update({
              where: { id: createdItem.id },
              data: {
                status: "DRAFT_GENERATED",
                aiDraftTitle: draftResult.headline,
                aiDraftAlternativeTitles: JSON.stringify(draftResult.alternativeHeadlines),
                aiDraftSummary: draftResult.summary,
                aiDraftOutline: draftResult.outline,
                aiDraftContent: draftResult.articleBodyHtml,
                aiRecommendedCategory: draftResult.recommendedCategory,
                aiRecommendedTags: JSON.stringify(draftResult.recommendedTags),
                aiMetaTitle: draftResult.seoTitle,
                aiMetaDescription: draftResult.metaDescription,
                aiSuggestedInternalLinks: JSON.stringify(draftResult.internalLinkSuggestions),
                aiVerificationClaims: JSON.stringify(draftResult.verificationClaims),
                aiQualityAudit: JSON.stringify({
                  ...draftResult.qualityAudit,
                  extractedImageUrl: extractedImage,
                }),
              },
            });
            stats.draftsGeneratedCount++;
          } catch (draftErr: any) {
            console.error(`Gagal menyusun draft AI untuk '${title}':`, draftErr.message);
          }
        }

        // FULL AUTO-PUBLISH (No click / approval needed)
        const shouldAutoPublish = options.autoPublish !== false && draftResult !== null;
        if (shouldAutoPublish && authorId) {
          try {
            const catName = draftResult.recommendedCategory || item.category || source.allowedCategories?.split(",")[0] || "Nasional";
            const foundCat = await db.category.findFirst({
              where: { name: { contains: catName, mode: "insensitive" } },
            });
            const targetCategoryId = foundCat?.id || (await db.category.findFirst())?.id;

            if (targetCategoryId) {
              let baseSlug = generateSlug(draftResult.headline);
              if (!baseSlug) baseSlug = `berita-${Date.now()}`;
              let finalSlug = baseSlug;
              const existingSlug = await db.article.findUnique({ where: { slug: finalSlug } });
              if (existingSlug) {
                finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
              }

              const visual = getCategoryVisual(foundCat?.slug || "nasional");
              const finalImage = extractedImage || visual.image;
              const readingTime = calculateReadingTime(draftResult.articleBodyHtml);

              const publishedArticle = await db.article.create({
                data: {
                  title: draftResult.headline,
                  slug: finalSlug,
                  summary: draftResult.summary,
                  content: draftResult.articleBodyHtml,
                  categoryId: targetCategoryId,
                  authorId: authorId,
                  featuredImage: finalImage,
                  imageAlt: draftResult.headline,
                  imageCaption: `Dokumentasi siaran resmi ${source.name}`,
                  imageCredit: source.name,
                  readingTime,
                  status: ArticleStatus.PUBLISHED,
                  publishedAt: new Date(),
                  metaTitle: draftResult.seoTitle,
                  metaDescription: draftResult.metaDescription,
                  canonicalUrl: `https://catatannegeri.com/${foundCat?.slug || "nasional"}/${finalSlug}`,
                  factCheckNotes: `Diterbitkan otomatis oleh pipeline agregator media nasional resmi: ${source.name}. Mematuhi Pedoman Media Siber dan Kode Etik Jurnalistik.`,
                  sourceReferences: JSON.stringify([
                    {
                      source: source.name,
                      url: originalLink,
                      date: item.pubDate ? new Date(item.pubDate) : new Date(),
                      type: source.type,
                    },
                  ]),
                },
                include: { category: true, author: true },
              });

              // Attach tags
              for (const tName of draftResult.recommendedTags || []) {
                if (!tName) continue;
                const tagSlug = generateSlug(tName);
                const tagRecord = await db.tag.upsert({
                  where: { slug: tagSlug },
                  update: {},
                  create: { name: tName, slug: tagSlug },
                });
                await db.articleTag.upsert({
                  where: {
                    articleId_tagId: { articleId: publishedArticle.id, tagId: tagRecord.id },
                  },
                  update: {},
                  create: { articleId: publishedArticle.id, tagId: tagRecord.id },
                });
              }

              // Update IngestedItem status to PUBLISHED
              await db.ingestedItem.update({
                where: { id: createdItem.id },
                data: {
                  status: "PUBLISHED",
                  draftedArticleId: publishedArticle.id,
                  editorialNotes: `Dipublikasikan otomatis secara langsung ke website: /${publishedArticle.category.slug}/${publishedArticle.slug}`,
                },
              });

              // Sync to portal-data.json for edge / static serving
              syncArticleToPortalData(publishedArticle);

              // Auto-ping search engines
              const fullArticleUrl = `${SITE_URL}/${publishedArticle.category.slug}/${publishedArticle.slug}`;
              notifySearchEnginesOfNewArticle(fullArticleUrl).catch(() => {});

              stats.autoPublishedCount++;
            }
          } catch (pubErr: any) {
            console.error(`Gagal auto-publish '${title}':`, pubErr.message);
            stats.errors.push(`Auto-publish error '${title}': ${pubErr.message}`);
          }
        }
      }
    } catch (saveErr: any) {
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
    action: "NEWS_SOURCE_SYNC_AUTOPUBLISH",
    entityType: "IngestionSource",
    entityId: source.id,
    details: stats,
  });

  return stats;
}

/**
 * Ingests all active national news sources concurrently or in controlled sequence with full auto-publish
 */
export async function executeAllSourcesIngestion(options?: {
  userId?: string;
  maxItemsPerSource?: number;
  autoDraft?: boolean;
  autoPublish?: boolean; // Defaults to true
}): Promise<{
  totalSources: number;
  totalFetched: number;
  totalNewDiscovered: number;
  totalDraftsGenerated: number;
  totalAutoPublished: number;
  totalDuplicates: number;
  sourceResults: IngestionStats[];
}> {
  const sources = await db.ingestionSource.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const sourceResults: IngestionStats[] = [];
  let totalFetched = 0;
  let totalNewDiscovered = 0;
  let totalDraftsGenerated = 0;
  let totalAutoPublished = 0;
  let totalDuplicates = 0;

  for (const source of sources) {
    try {
      const stats = await executeSourceIngestion({
        sourceId: source.id,
        userId: options?.userId,
        maxItems: options?.maxItemsPerSource || 15,
        autoDraft: options?.autoDraft !== false,
        autoPublish: options?.autoPublish !== false, // Defaults to TRUE for full auto-publish
      });

      sourceResults.push(stats);
      totalFetched += stats.fetchedCount;
      totalNewDiscovered += stats.newDiscoveredCount;
      totalDraftsGenerated += stats.draftsGeneratedCount;
      totalAutoPublished += stats.autoPublishedCount;
      totalDuplicates += stats.duplicateCount;
    } catch (err: any) {
      sourceResults.push({
        sourceId: source.id,
        sourceName: source.name,
        fetchedCount: 0,
        newDiscoveredCount: 0,
        draftsGeneratedCount: 0,
        autoPublishedCount: 0,
        duplicateCount: 0,
        errors: [err.message || "Gagal memproses sumber"],
      });
    }
  }

  return {
    totalSources: sources.length,
    totalFetched,
    totalNewDiscovered,
    totalDraftsGenerated,
    totalAutoPublished,
    totalDuplicates,
    sourceResults,
  };
}
