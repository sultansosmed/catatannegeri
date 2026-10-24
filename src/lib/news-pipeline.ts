import Parser from "rss-parser";
import { db } from "./db";
import { generateSlug } from "./slug";
import { ArticleStatus } from "@prisma/client";

const parser = new Parser({
  customFields: {
    item: ["description", "content:encoded"],
  },
});

export interface IngestResult {
  sourceName: string;
  itemsFetched: number;
  newItemsSaved: number;
  duplicatesSkipped: number;
  errors: string[];
}

/**
 * Calculates string similarity using word-level Jaccard index
 * to detect near-duplicate news items from different sources.
 */
export function calculateTitleSimilarity(titleA: string, titleB: string): number {
  const wordsA = new Set(titleA.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(titleB.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Ingest from an authorized RSS/Atom source feed
 */
export async function ingestFromRssSource(sourceId: string): Promise<IngestResult> {
  const source = await db.ingestionSource.findUnique({
    where: { id: sourceId },
  });

  if (!source || !source.isActive) {
    throw new Error("Sumber data tidak aktif atau tidak ditemukan.");
  }

  const result: IngestResult = {
    sourceName: source.name,
    itemsFetched: 0,
    newItemsSaved: 0,
    duplicatesSkipped: 0,
    errors: [],
  };

  try {
    const feed = await parser.parseURL(source.url);
    result.itemsFetched = feed.items.length;

    for (const item of feed.items) {
      if (!item.link || !item.title) continue;

      // 1. Check exact URL duplicate
      const existing = await db.ingestedItem.findUnique({
        where: { originalUrl: item.link },
      });

      if (existing) {
        result.duplicatesSkipped++;
        continue;
      }

      // 2. Check title similarity with existing articles or ingested items within 48h
      const recentIngested = await db.ingestedItem.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        select: { title: true },
      });

      const isNearDuplicate = recentIngested.some((r) => calculateTitleSimilarity(r.title, item.title!) > 0.7);

      if (isNearDuplicate) {
        result.duplicatesSkipped++;
        continue;
      }

      // 3. Save as raw ingested item for human review
      await db.ingestedItem.create({
        data: {
          sourceId: source.id,
          originalUrl: item.link,
          title: item.title,
          originalPublishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          rawContent: item["content:encoded"] || item.content || item.summary || item.description || "",
          excerpt: item.description || (item.content ? item.content.slice(0, 250) : ""),
          status: "PENDING",
        },
      });

      result.newItemsSaved++;
    }

    // Update last fetched timestamp
    await db.ingestionSource.update({
      where: { id: source.id },
      data: { lastFetchedAt: new Date() },
    });

  } catch (err: any) {
    result.errors.push(err.message || "Gagal mengambil RSS feed.");
  }

  return result;
}

/**
 * Converts an approved ingested item into an editorial draft for human journalist review
 */
export async function convertIngestedToDraft({
  ingestedItemId,
  categoryId,
  authorProfileId,
  userId,
}: {
  ingestedItemId: string;
  categoryId: string;
  authorProfileId: string;
  userId: string;
}) {
  const item = await db.ingestedItem.findUnique({
    where: { id: ingestedItemId },
    include: { source: true },
  });

  if (!item) throw new Error("Item tidak ditemukan");

  const slug = generateSlug(item.title) + "-" + Date.now().toString().slice(-4);

  // Generate an editorial outline draft with source citation and fact-check warning
  const draftContent = `
<p><strong>CATATAN REDAKSI:</strong> Draft berita ini bersumber dari siaran/arsip resmi ${item.source.name} dan sedang dalam proses verifikasi serta pengembangan oleh tim redaksi Catatan Negeri sebelum diterbitkan.</p>

<p>${item.excerpt || item.title}</p>

<h2>Fakta-Fakta Penting yang Terverifikasi</h2>
<ul>
  <li>Sumber Informasi: ${item.source.name}</li>
  <li>Tautan Rujukan Resmi: <a href="${item.originalUrl}" target="_blank" rel="noopener noreferrer">${item.originalUrl}</a></li>
  <li>Waktu Rilis Sumber: ${item.originalPublishedAt ? item.originalPublishedAt.toLocaleString("id-ID") : "-"}</li>
</ul>

<h2>Konfirmasi & Laporan Lanjutan</h2>
<p>[Tuliskan konteks tambahan, konfirmasi pihak terkait, latar belakang kebijakan, dan dampak bagi masyarakat di sini]</p>
  `.trim();

  const article = await db.article.create({
    data: {
      title: item.title,
      slug,
      summary: item.excerpt?.slice(0, 300) || `Laporan mengenai ${item.title} berdasarkan rilis resmi ${item.source.name}.`,
      content: draftContent,
      categoryId,
      authorId: authorProfileId,
      status: ArticleStatus.DRAFT,
      sourceReferences: JSON.stringify([
        {
          source: item.source.name,
          url: item.originalUrl,
          date: item.originalPublishedAt,
        },
      ]),
      factCheckNotes: `Bersumber dari ${item.source.name}. Perlu verifikasi kutipan dan konfirmasi pihak berwenang sebelum status diubah ke PUBLISHED.`,
    },
  });

  // Mark ingested item as drafted
  await db.ingestedItem.update({
    where: { id: item.id },
    data: {
      status: "DRAFTED",
      draftedArticleId: article.id,
    },
  });

  return article;
}

