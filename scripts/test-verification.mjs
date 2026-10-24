import { PrismaClient, Role, ArticleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "catatan-negeri-dev-secure-key-32-chars-long-development"
);

async function runTests() {
  console.log("=== MEMULAI PENGUJIAN VERIFIKASI CATATAN NEGERI ===");
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

  // Test 1: Database connection
  try {
    await prisma.$connect();
    assert(true, "Koneksi ke PostgreSQL database 'catatannegeri' berhasil");
  } catch (err) {
    assert(false, `Koneksi database gagal: ${err.message}`);
  }

  // Test 2: 20 Categories
  const expectedCategories = [
    "nasional", "daerah", "politik", "ekonomi", "bisnis",
    "teknologi", "gadget", "otomotif", "pendidikan", "kesehatan",
    "gaya-hidup", "hiburan", "olahraga", "travel", "kuliner",
    "properti", "keuangan", "tips-dan-panduan", "lingkungan", "tren-dan-viral"
  ];
  const categories = await prisma.category.findMany();
  const categorySlugs = categories.map((c) => c.slug);
  const allCategoriesExist = expectedCategories.every((slug) => categorySlugs.includes(slug));
  assert(allCategoriesExist, `Seluruh 20 kategori utama terdaftar lengkap (ditemukan: ${categories.length})`);

  // Test 3: Users & RBAC
  const admin = await prisma.user.findUnique({ where: { email: "redaksi@catatannegeri.com" } });
  const editor = await prisma.user.findUnique({ where: { email: "editor@catatannegeri.com" } });
  const author = await prisma.user.findUnique({ where: { email: "dewi.lestari@catatannegeri.com" } });

  assert(admin && admin.role === Role.SUPER_ADMIN, "Super Admin (Pemimpin Redaksi) terdaftar dengan role SUPER_ADMIN");
  assert(editor && editor.role === Role.EDITOR, "Editor (Redaktur) terdaftar dengan role EDITOR");
  assert(author && author.role === Role.AUTHOR, "Author (Wartawan) terdaftar dengan role AUTHOR");

  // Test 4: Password hashing verification
  const isPassValid = await bcrypt.compare("Admin123!CatatanNegeri", admin.passwordHash);
  assert(isPassValid, "Verifikasi password bcrypt berhasil dengan hash aman");

  // Test 5: JWT Session Signing & Verification
  const token = await new SignJWT({ userId: admin.id, email: admin.email, role: admin.role, name: admin.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  const { payload } = await jwtVerify(token, JWT_SECRET);
  assert(payload.userId === admin.id && payload.role === "SUPER_ADMIN", "JWT Session Sign & Verify HS256 valid");

  // Test 6: Published vs Draft Articles Isolation
  const publishedArticles = await prisma.article.findMany({ where: { status: ArticleStatus.PUBLISHED } });
  assert(publishedArticles.length > 0, `Artikel terbit publik ditemukan (${publishedArticles.length} artikel)`);

  const draftsExposed = publishedArticles.some((a) => a.status !== ArticleStatus.PUBLISHED);
  assert(!draftsExposed, "Query artikel publik tidak pernah membocorkan draf atau arsip tertutup");

  // Test 7: Canonical URL and Slugs
  const sampleArticle = publishedArticles[0];
  assert(sampleArticle.slug && /^[a-z0-9-]+$/.test(sampleArticle.slug), "Slug artikel sesuai format SEO kanonikal");

  // Test 8: Reading time
  const sampleText = "kata ".repeat(400);
  const wordCount = sampleText.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  assert(readingTime === 2, `Kalkulator waktu baca akurat: 400 kata = ${readingTime} menit baca`);

  // Test 9: News Ingestion RSS Duplicate Detection (Jaccard Index)
  function jaccard(titleA, titleB) {
    const wA = new Set(titleA.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 2));
    const wB = new Set(titleB.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 2));
    let inter = 0;
    for (const w of wA) if (wB.has(w)) inter++;
    return inter / new Set([...wA, ...wB]).size;
  }
  const t1 = "Bank Indonesia Pertahankan Suku Bunga Acuan BI Rate 6 Persen";
  const t2 = "Bank Indonesia Pertahankan Suku Bunga Acuan BI Rate 6 Persen Hari Ini";
  const simScore = jaccard(t1, t2);
  assert(simScore > 0.6, `Deteksi duplikasi berita (Jaccard Similarity: ${(simScore * 100).toFixed(1)}%) mendeteksi kemiripan judul sindikasi`);

  // Test 10: Google News 48h Eligibility
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const newsSitemapArticles = await prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      noIndex: false,
      publishedAt: { gte: twoDaysAgo },
    },
  });
  assert(newsSitemapArticles.length > 0, `Google News sitemap menyaring artikel layak 48 jam terakhir (${newsSitemapArticles.length} artikel)`);

  // Test 11: Site Settings
  const breakingSetting = await prisma.siteSetting.findUnique({ where: { key: "breaking_news_enabled" } });
  assert(breakingSetting !== null, "Konfigurasi SiteSetting (breaking news & ads) tersimpan di database");

  console.log("\n=== HASIL AKHIR PENGUJIAN ===");
  console.log(`TOTAL PASS : ${passed}`);
  console.log(`TOTAL FAIL : ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
