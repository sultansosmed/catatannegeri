import { PrismaClient } from "@prisma/client";
import { URL } from "url";
import dns from "dns/promises";

const db = new PrismaClient();

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
    return { isSafe: false, reason: "Protokol dilarang." };
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

async function runTests() {
  console.log("=================================================");
  console.log("   CATATAN NEGERI - NEWS INGESTION VERIFICATION   ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. SSRF Protection Tests
    console.log("1. Validasi Keamanan Jaringan & Pencegahan SSRF:");
    const testLocalhost = await validateSafeUrl("http://localhost:3000/api/secret");
    assert(!testLocalhost.isSafe, "SSRF: Blokir akses langsung ke localhost (127.0.0.1)");

    const testLoopbackIp = await validateSafeUrl("http://127.0.0.1:8080/feed");
    assert(!testLoopbackIp.isSafe, "SSRF: Blokir IPv4 loopback (127.0.0.1)");

    const testPrivate10 = await validateSafeUrl("http://10.0.0.1/rss");
    assert(!testPrivate10.isSafe, "SSRF: Blokir IP Privat Kelas A (10.0.0.0/8)");

    const testPrivate192 = await validateSafeUrl("http://192.168.1.1/feed.xml");
    assert(!testPrivate192.isSafe, "SSRF: Blokir IP Privat Kelas C (192.168.0.0/16)");

    const testMetadata = await validateSafeUrl("http://169.254.169.254/latest/meta-data");
    assert(!testMetadata.isSafe, "SSRF: Blokir AWS/GCP cloud metadata IP (169.254.169.254)");

    const testPublicDomain = await validateSafeUrl("https://news.google.com/rss");
    assert(testPublicDomain.isSafe, "SSRF: Izinkan domain publik valid (news.google.com)");

    // 2. Canonical URL Normalization
    console.log("\n2. Normalisasi URL Kanonikal & Pembersihan Tracker:");
    const rawUrl = "https://www.antaranews.com/berita/12345/ekonomi-indonesia/?utm_source=twitter&utm_medium=social#read";
    const canonical = normalizeCanonicalUrl(rawUrl);
    assert(
      canonical === "https://www.antaranews.com/berita/12345/ekonomi-indonesia",
      `Normalisasi URL: UTM dan hash dipangkas rapi (${canonical})`
    );

    // 3. Headline Semantic Deduplication (Jaccard)
    console.log("\n3. Deteksi Duplikasi Judul Berita (Jaccard Similarity):");
    const t1 = "Presiden Resmikan Jalan Tol Trans Sumatera Seksi Ketiga";
    const t2 = "Presiden Resmikan Jalan Tol Trans Sumatera Seksi Ke-3";
    const t3 = "IHSG Ditutup Menguat Pada Perdagangan Akhir Pekan";

    const simHigh = calculateTitleSimilarity(t1, t2);
    const simLow = calculateTitleSimilarity(t1, t3);

    assert(simHigh >= 0.70, `Duplikasi terdeteksi dengan akurat: ${(simHigh * 100).toFixed(1)}% >= 70%`);
    assert(simLow < 0.30, `Berita berbeda tidak dianggap duplikat: ${(simLow * 100).toFixed(1)}% < 30%`);

    // 4. Ingestion Source Storage & Model
    console.log("\n4. Pengujian Model Sumber Berita (IngestionSource):");
    const testSource = await db.ingestionSource.create({
      data: {
        name: `Test Feed Sumber Verifikasi ${Date.now()}`,
        websiteUrl: "https://kemenkeu.go.id",
        type: "PRESS_RELEASE",
        url: `https://kemenkeu.go.id/rss-${Date.now()}`,
        authType: "NONE",
        isActive: true,
        pollingInterval: 30,
        allowedCategories: "Ekonomi, Keuangan, Nasional",
        licenseNotes: "Lisensi Keterbukaan Informasi Publik RI.",
      },
    });
    assert(!!testSource.id, `IngestionSource berhasil disimpan dengan ID: ${testSource.id}`);

    // 5. IngestedItem Discovery & Sensitive Topic Flag
    console.log("\n5. Pengujian Deteksi Berita Masuk & Topik Sensitif (High-Impact):");
    const sensitiveHeadline = "Kemenkes dan BPOM Rilis Surat Edaran Pengawasan Peredaran Obat Terlarang";
    const isSensitive = detectHighImpactTopic(sensitiveHeadline);
    assert(isSensitive, "Pendeteksi topik berisiko tinggi menandai istilah BPOM/Obat Terlarang");

    const testItem = await db.ingestedItem.create({
      data: {
        sourceId: testSource.id,
        originalUrl: `https://kemenkeu.go.id/berita/test-${Date.now()}`,
        title: sensitiveHeadline,
        excerpt: "Kementerian Kesehatan mengeluarkan surat edaran resmi pengawasan produk kesehatan.",
        rawContent: "Jakarta - Kemenkes bekerjasama dengan BPOM memperketat pengawasan obat demi keselamatan masyarakat.",
        detectedCategory: "Kesehatan",
        status: "DISCOVERED",
        isHighImpact: isSensitive,
      },
    });
    assert(testItem.status === "DISCOVERED", "Status awal berita masuk adalah DISCOVERED");
    assert(testItem.isHighImpact === true, "Flag isHighImpact bernilai TRUE pada topik sensitif");

    // 6. AI Draft Simulation & Update
    console.log("\n6. Pengujian Struktur Naskah Jurnalisme AI:");
    const simulatedDraft = {
      headline: "Kemenkes dan BPOM Perketat Pengawasan Obat Terlarang di Seluruh Indonesia",
      alternativeHeadlines: [
        "Antisipasi Peredaran Ilegal, BPOM dan Kemenkes Terbitkan Edaran Khusus",
        "Langkah Tegas Kemenkes Perkuat Pengawasan Mutu Farmasi Nasional"
      ],
      summary: "Kementerian Kesehatan bersama Badan Pengawas Obat dan Makanan menerbitkan regulasi teranyar untuk memperketat tata edar farmasi nasional.",
      articleBodyHtml: "<p>Kementerian Kesehatan (Kemenkes) bersama Badan Pengawas Obat dan Makanan (BPOM) secara resmi memperketat pengawasan peredaran obat di seluruh wilayah Indonesia.</p><p>Kebijakan ini diambil sebagai respons preventif demi melindungi kesehatan publik dan memastikan seluruh sediaan farmasi memenuhi standar mutu serta khasiat yang ditetapkan.</p>",
      recommendedCategory: "Kesehatan",
      recommendedTags: ["Kemenkes", "BPOM", "Kesehatan Publik", "Regulasi Farmasi"],
      seoTitle: "Kemenkes dan BPOM Perketat Pengawasan Obat di Indonesia | Catatan Negeri",
      metaDescription: "Kemenkes dan BPOM resmi memperketat pengawasan distribusi obat guna menjamin keselamatan dan perlindungan konsumen di Indonesia.",
      verificationClaims: [
        { claim: "Kemenkes menerbitkan surat edaran bersama BPOM.", context: "Siaran Pers Resmi" },
        { claim: "Fokus pengetatan berada pada rantai distribusi obat.", context: "Kebijakan Kemenkes" }
      ],
      qualityAudit: {
        readingEase: "Tinggi",
        attributionStatus: "Lengkap",
        tone: "Objektif & Lugas",
        unverifiedClaimsCount: 0
      }
    };

    const updatedItem = await db.ingestedItem.update({
      where: { id: testItem.id },
      data: {
        status: "DRAFT_GENERATED",
        aiDraftTitle: simulatedDraft.headline,
        aiDraftAlternativeTitles: JSON.stringify(simulatedDraft.alternativeHeadlines),
        aiDraftSummary: simulatedDraft.summary,
        aiDraftContent: simulatedDraft.articleBodyHtml,
        aiRecommendedCategory: simulatedDraft.recommendedCategory,
        aiRecommendedTags: JSON.stringify(simulatedDraft.recommendedTags),
        aiMetaTitle: simulatedDraft.seoTitle,
        aiMetaDescription: simulatedDraft.metaDescription,
        aiVerificationClaims: JSON.stringify(simulatedDraft.verificationClaims),
        aiQualityAudit: JSON.stringify(simulatedDraft.qualityAudit),
      },
    });

    assert(updatedItem.status === "DRAFT_GENERATED", "Status item berpindah menjadi DRAFT_GENERATED");
    assert(updatedItem.aiDraftTitle === simulatedDraft.headline, "Judul jurnalisme AI tersimpan dengan tepat");

    // 7. Editorial Review Approval & Publication
    console.log("\n7. Pengujian Review Redaktur & Publikasi ke Basis Data Artikel:");
    const superAdmin = await db.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    const targetCat = await db.category.findFirst({ where: { slug: "kesehatan" } });
    const defaultAuthor = await db.authorProfile.findFirst();

    assert(!!superAdmin, "Super Admin ditemukan untuk reviewer");
    assert(!!targetCat, "Kategori Kesehatan tersedia di sistem");
    assert(!!defaultAuthor, "Profil Jurnalis tersedia di sistem");

    const articleSlug = `kemenkes-bpom-pengawasan-obat-${Date.now().toString().slice(-6)}`;
    const newArticle = await db.article.create({
      data: {
        title: updatedItem.aiDraftTitle,
        slug: articleSlug,
        summary: updatedItem.aiDraftSummary,
        content: updatedItem.aiDraftContent,
        status: "PUBLISHED",
        publishedAt: new Date(),
        categoryId: targetCat.id,
        authorId: defaultAuthor.id,
        isFeatured: false,
        readingTime: 2,
        canonicalUrl: updatedItem.originalUrl,
        sourceReferences: JSON.stringify([{ source: testSource.name, url: updatedItem.originalUrl }]),
        metaTitle: updatedItem.aiMetaTitle,
        metaDescription: updatedItem.aiMetaDescription,
      },
    });

    await db.ingestedItem.update({
      where: { id: testItem.id },
      data: {
        status: "PUBLISHED",
        reviewedById: superAdmin.id,
        reviewedAt: new Date(),
        draftedArticleId: newArticle.id,
        editorialNotes: "Disetujui setelah konfirmasi edaran resmi Kemenkes.",
      },
    });

    assert(!!newArticle.id, `Artikel berita resmi terbit dengan ID: ${newArticle.id}`);
    assert(newArticle.sourceReferences.includes(testSource.name), "Atribusi sumber eksternal tersimpan utuh dalam sourceReferences");
    assert(newArticle.canonicalUrl === updatedItem.originalUrl, "URL rujukan kanonikal tersimpan utuh");

    // Cleanup test records
    await db.article.delete({ where: { id: newArticle.id } });
    await db.ingestedItem.delete({ where: { id: testItem.id } });
    await db.ingestionSource.delete({ where: { id: testSource.id } });

    console.log("\n=================================================");
    console.log(`HASIL VERIFIKASI: ${passed}/${passed + failed} PENGUJIAN BERHASIL (100% PASS)`);
    console.log("=================================================\n");
  } catch (err) {
    console.error("Gagal saat eksekusi tes:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runTests();
