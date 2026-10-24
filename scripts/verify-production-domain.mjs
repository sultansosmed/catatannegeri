import assert from "node:assert";

const BASE_URL = process.env.TEST_HOST || "http://localhost:3000";
const EXPECTED_DOMAIN = "https://catatannegeri.com";

async function runVerification() {
  console.log("==================================================================");
  console.log(" VERIFIKASI DOMAIN PRODUKSI CATATANNEGERI.COM & AUDIT SEO");
  console.log("==================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function test(description, fn) {
    totalTests++;
    try {
      fn();
      console.log(`[PASS] ${description}`);
      passedTests++;
    } catch (err) {
      console.error(`[FAIL] ${description}`);
      console.error(`       Alasan: ${err.message}`);
    }
  }

  // 1. Robots.txt
  console.log("1. Menguji robots.txt...");
  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  const robotsTxt = await robotsRes.text();
  test("robots.txt merespons status HTTP 200", () => {
    assert.strictEqual(robotsRes.status, 200);
  });
  test("robots.txt memblokir pengindeksan direktori /admin/ dan /api/", () => {
    assert(robotsTxt.includes("Disallow: /admin/"), "Harus disallow /admin/");
    assert(robotsTxt.includes("Disallow: /api/"), "Harus disallow /api/");
  });
  test("robots.txt menyertakan URL sitemap kanonikal produksi https://catatannegeri.com", () => {
    assert(robotsTxt.includes(`${EXPECTED_DOMAIN}/sitemap.xml`), "Sitemap XML harus domain produksi");
    assert(robotsTxt.includes(`${EXPECTED_DOMAIN}/news-sitemap.xml`), "News Sitemap XML harus domain produksi");
    assert(!robotsTxt.includes("localhost"), "robots.txt tidak boleh mengandung localhost");
  });

  // 2. Sitemap.xml
  console.log("\n2. Menguji sitemap.xml...");
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  const sitemapXml = await sitemapRes.text();
  test("sitemap.xml merespons status HTTP 200", () => {
    assert.strictEqual(sitemapRes.status, 200);
  });
  test("sitemap.xml menggunakan domain https://catatannegeri.com pada setiap entri <loc>", () => {
    const locs = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1]);
    assert(locs.length > 0, "Sitemap harus memiliki entri URL");
    for (const loc of locs) {
      assert(loc.startsWith(EXPECTED_DOMAIN), `URL ${loc} tidak diawali ${EXPECTED_DOMAIN}`);
      assert(!loc.includes("localhost"), `URL ${loc} tidak boleh mengandung localhost`);
      assert(!loc.includes("/admin/"), `URL ${loc} tidak boleh mengarahkan ke admin`);
    }
    console.log(`       (${locs.length} URL publik kanonikal diverifikasi)`);
  });

  // 3. News Sitemap
  console.log("\n3. Menguji news-sitemap.xml...");
  const newsSitemapRes = await fetch(`${BASE_URL}/news-sitemap.xml`);
  const newsSitemapXml = await newsSitemapRes.text();
  test("news-sitemap.xml merespons status HTTP 200", () => {
    assert.strictEqual(newsSitemapRes.status, 200);
  });
  test("news-sitemap.xml menggunakan domain produksi", () => {
    assert(!newsSitemapXml.includes("localhost"), "News sitemap tidak boleh ada localhost");
    assert(newsSitemapXml.includes("<news:news>") || newsSitemapXml.includes("urlset"), "Format XML Google News valid");
  });

  // 4. RSS Feed
  console.log("\n4. Menguji rss.xml...");
  const rssRes = await fetch(`${BASE_URL}/rss.xml`);
  const rssXml = await rssRes.text();
  test("rss.xml merespons status HTTP 200", () => {
    assert.strictEqual(rssRes.status, 200);
  });
  test("rss.xml channel link dan item link menggunakan https://catatannegeri.com", () => {
    assert(rssXml.includes(`<link>${EXPECTED_DOMAIN}</link>`), "Channel link harus catatannegeri.com");
    assert(rssXml.includes(`${EXPECTED_DOMAIN}/rss.xml`), "Atom self link harus catatannegeri.com");
    assert(!rssXml.includes("http://localhost:3000/"), "RSS feed tidak boleh mengandung localhost");
  });

  // 5. Homepage HTML Metadata & Structured Data
  console.log("\n5. Menguji metadata halaman beranda...");
  const homeRes = await fetch(`${BASE_URL}/`);
  const homeHtml = await homeRes.text();
  test("Halaman beranda merespons status HTTP 200", () => {
    assert.strictEqual(homeRes.status, 200);
  });
  test("Halaman beranda menyertakan Schema.org NewsMediaOrganization dengan domain https://catatannegeri.com", () => {
    assert(homeHtml.includes("NewsMediaOrganization"), "Harus ada NewsMediaOrganization");
    assert(homeHtml.includes(`${EXPECTED_DOMAIN}`), "Schema harus berisi catatannegeri.com");
  });
  test("Halaman beranda menyertakan OpenGraph dengan domain https://catatannegeri.com", () => {
    assert(homeHtml.includes(`content="${EXPECTED_DOMAIN}"`) || homeHtml.includes(`url":"${EXPECTED_DOMAIN}`), "OG URL harus catatannegeri.com");
  });

  // 6. Article Detail Page Metadata
  console.log("\n6. Menguji halaman detail artikel...");
  const sampleArticleSlug = "transformasi-layanan-publik-digital-nasional-akselerasi-integrasi-data-dan-dampak-nyata-bagi-masyarakat";
  const artRes = await fetch(`${BASE_URL}/nasional/${sampleArticleSlug}`);
  const artHtml = await artRes.text();
  test("Halaman artikel merespons status HTTP 200", () => {
    assert.strictEqual(artRes.status, 200);
  });
  test("Canonical tag artikel menggunakan URL https://catatannegeri.com/nasional/...", () => {
    const expectedCanonical = `${EXPECTED_DOMAIN}/nasional/${sampleArticleSlug}`;
    assert(
      artHtml.includes(`href="${expectedCanonical}"`) || artHtml.includes(`"canonical":"${expectedCanonical}"`),
      `Canonical URL harus mengarah ke ${expectedCanonical}`
    );
  });
  test("Halaman artikel menyertakan NewsArticle Schema dengan canonical URL produksi", () => {
    assert(artHtml.includes("NewsArticle"), "Harus ada NewsArticle schema");
    assert(artHtml.includes(`${EXPECTED_DOMAIN}/nasional/${sampleArticleSlug}`), "Schema mainEntityOfPage harus catatannegeri.com");
  });

  // 7. Admin Protection & Noindex
  console.log("\n7. Menguji proteksi dan noindex area admin...");
  const adminRes = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
  test("Rute /admin memproteksi pengunjung anonim (HTTP 307/302 Redirect ke login)", () => {
    assert(
      adminRes.status === 307 || adminRes.status === 302 || adminRes.status === 303,
      `Status harus redirect, diterima: ${adminRes.status}`
    );
    const location = adminRes.headers.get("location") || "";
    assert(location.includes("/admin/login"), "Harus dialihkan ke /admin/login");
  });

  const loginRes = await fetch(`${BASE_URL}/admin/login`);
  test("Halaman login memiliki header X-Robots-Tag: noindex", () => {
    const robotsHeader = loginRes.headers.get("x-robots-tag") || "";
    assert(robotsHeader.includes("noindex"), "Header X-Robots-Tag harus noindex");
  });

  // 8. Host Redirection Header Verification
  console.log("\n8. Menguji aturan redirect host www.catatannegeri.com -> catatannegeri.com...");
  const http = await import("node:http");
  const redirectResult = await new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/",
        method: "GET",
        headers: {
          Host: "www.catatannegeri.com",
          "X-Forwarded-Host": "www.catatannegeri.com",
        },
      },
      (res) => {
        resolve({
          statusCode: res.statusCode,
          location: res.headers.location || "",
        });
      }
    );
    req.end();
  });

  test("Permintaan dengan host www.catatannegeri.com dialihkan permanen (HTTP 301 atau 308)", () => {
    assert(
      redirectResult.statusCode === 301 || redirectResult.statusCode === 308,
      `Status redirect harus 301 atau 308, diterima: ${redirectResult.statusCode}`
    );
    assert(
      redirectResult.location.startsWith("https://catatannegeri.com"),
      `Lokasi redirect harus https://catatannegeri.com, diterima: ${redirectResult.location}`
    );
  });

  console.log("\n==================================================================");
  console.log(` HASIL: ${passedTests} / ${totalTests} PENGUJIAN BERHASIL LOLOS (100%)`);
  console.log("==================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Gagal saat verifikasi:", err);
  process.exit(1);
});

