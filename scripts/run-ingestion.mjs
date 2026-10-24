import { PrismaClient } from "@prisma/client";
import Parser from "rss-parser";
import { URL } from "url";
import dns from "dns/promises";

const db = new PrismaClient();
const rssParser = new Parser({
  customFields: {
    item: ["description", "content:encoded", "category", "dc:creator", "pubDate"],
  },
});

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^localhost$/i,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

async function validateSafeUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { isSafe: false, reason: "Format URL tidak valid." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { isSafe: false, reason: "Protokol dilarang. Hanya http/https." };
  }

  const hostname = parsed.hostname.toLowerCase();
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { isSafe: false, reason: `Private host blocked: ${hostname}` };
    }
  }

  try {
    const addresses = await dns.resolve(hostname);
    for (const ip of addresses) {
      for (const pattern of PRIVATE_IP_PATTERNS) {
        if (pattern.test(ip)) {
          return { isSafe: false, reason: `Private IP resolved: ${ip}` };
        }
      }
    }
  } catch (err) {
    return { isSafe: false, reason: `DNS resolve error: ${err.message}` };
  }

  return { isSafe: true, parsedUrl: parsed };
}

function normalizeCanonicalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "fbclid", "gclid", "msclkid", "ref", "source", "origin", "platform"
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    parsed.searchParams.sort();

    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`;
  } catch {
    return rawUrl.trim();
  }
}

function calculateTitleSimilarity(titleA, titleB) {
  const normA = titleA.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const normB = titleB.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const wordsA = new Set(normA.split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(normB.split(" ").filter((w) => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function detectHighImpactTopic(text) {
  const lower = text.toLowerCase();
  const highImpactKeywords = [
    "vaksin", "pandemi", "wabah", "virus", "obat terlarang", "bpom", "kanker",
    "bunga pinjaman", "investasi bodong", "ojk", "krisis moneter", "kebangkrutan",
    "korupsi", "kpk", "vonis hakim", "tersangka", "kasasi", "kejaksaan agung",
    "tsunami", "gempa bumi", "erupsi", "banjir bandang", "evakuasi", "bnpb"
  ];
  return highImpactKeywords.some((kw) => lower.includes(kw));
}

async function runScheduledIngestion() {
  console.log("=== MEMULAI JADWAL PENARIKAN BERITA OTOMATIS (CATATAN NEGERI) ===");
  console.log(`Waktu eksekusi: ${new Date().toISOString()}`);

  const sources = await db.ingestionSource.findMany({
    where: { isActive: true },
  });

  console.log(`Ditemukan ${sources.length} sumber berita eksternal aktif.`);

  let totalDiscovered = 0;
  let totalDuplicates = 0;

  for (const source of sources) {
    console.log(`\n-> Memproses sumber: ${source.name} (${source.url})`);

    try {
      const urlSafety = await validateSafeUrl(source.url);
      if (!urlSafety.isSafe) {
        throw new Error(`SSRF Blocked: ${urlSafety.reason}`);
      }

      // Fetch RSS XML
      const res = await fetch(source.url, {
        headers: {
          "User-Agent": "CatatanNegeri-Bot/1.0 (+https://catatannegeri.com; redaksi@catatannegeri.com)",
          Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
      }

      const xmlText = await res.text();
      const feed = await rssParser.parseString(xmlText);
      const items = feed.items || [];
      console.log(`   Ditemukan ${items.length} item dalam feed.`);

      let newCount = 0;
      let dupCount = 0;

      for (const item of items.slice(0, 30)) {
        if (!item.link || !item.title) continue;

        const canonicalUrl = normalizeCanonicalUrl(item.link);

        // Check if exact URL already ingested
        const existingUrl = await db.ingestedItem.findFirst({
          where: {
            OR: [
              { originalUrl: item.link },
              { canonicalUrl: canonicalUrl },
            ],
          },
        });

        if (existingUrl) {
          dupCount++;
          continue;
        }

        // Check if title has high similarity to recent items (> 0.70)
        const recentItems = await db.ingestedItem.findMany({
          take: 50,
          orderBy: { discoveredAt: "desc" },
          select: { id: true, title: true },
        });

        let duplicateOfId = null;
        let maxSimilarity = 0;

        for (const recent of recentItems) {
          const sim = calculateTitleSimilarity(item.title, recent.title);
          if (sim > maxSimilarity) {
            maxSimilarity = sim;
            if (sim >= 0.70) {
              duplicateOfId = recent.id;
              break;
            }
          }
        }

        const isDuplicate = maxSimilarity >= 0.70;
        const rawContent = item["content:encoded"] || item.content || item.summary || item.description || "";
        const excerpt = item.description || (item.content ? item.content.slice(0, 300) : "");
        const isHighImpact = detectHighImpactTopic(item.title + " " + excerpt);

        await db.ingestedItem.create({
          data: {
            sourceId: source.id,
            originalUrl: item.link,
            canonicalUrl,
            title: item.title,
            originalPublishedAt: item.pubDate ? new Date(item.pubDate) : null,
            rawContent,
            excerpt,
            author: item["dc:creator"] || item.author || null,
            detectedCategory: item.category || source.allowedCategories?.split(",")[0]?.trim() || "Nasional",
            status: isDuplicate ? "DUPLICATE" : "DISCOVERED",
            duplicateOfId,
            duplicateScore: maxSimilarity > 0 ? maxSimilarity : null,
            duplicateReason: isDuplicate ? `Kemiripan semantik ${(maxSimilarity * 100).toFixed(0)}% dengan item sebelumnya.` : null,
            isHighImpact,
          },
        });

        if (isDuplicate) {
          dupCount++;
        } else {
          newCount++;
        }
      }

      await db.ingestionSource.update({
        where: { id: source.id },
        data: {
          lastFetchedAt: new Date(),
          lastError: null,
          itemCount: { increment: newCount },
        },
      });

      console.log(`   Berhasil: +${newCount} berita baru, ${dupCount} duplikat tersaring.`);
      totalDiscovered += newCount;
      totalDuplicates += dupCount;
    } catch (err) {
      console.error(`   Error pada sumber ${source.name}:`, err.message);
      await db.ingestionSource.update({
        where: { id: source.id },
        data: {
          lastFetchedAt: new Date(),
          lastError: err.message,
        },
      }).catch(() => {});
    }
  }

  console.log("\n=== SINKRONISASI SELESAI ===");
  console.log(`Total Berita Baru Masuk: ${totalDiscovered}`);
  console.log(`Total Duplikasi Tersaring: ${totalDuplicates}`);
}

runScheduledIngestion()
  .catch((err) => {
    console.error("Gagal menjalankan scheduler:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

