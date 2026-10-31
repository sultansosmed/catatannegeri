import { URL } from "url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const portalData = JSON.parse(fs.readFileSync(path.join(rootDir, "src", "data", "portal-data.json"), "utf8"));

const SITE_URL = "https://catatannegeri.com";
const INDEXNOW_KEY = "cn98a72ef31b40289a87d0e4125b0f19";
const WEBSUB_HUB_URL = "https://pubsubhubbub.appspot.com/";

async function pingSearchEngines() {
  console.log("==================================================================");
  console.log("⚡ FAST INDEXING SIGNAL BROADCASTER (GOOGLE & SEARCH ENGINES)");
  console.log("==================================================================\n");

  // 1. Ping Google WebSub Hub (PubSubHubbub)
  console.log("1. Mengirim sinyal cepat ke Google WebSub Hub (PubSubHubbub)...");
  try {
    const formData = new URLSearchParams({
      "hub.mode": "publish",
      "hub.url": `${SITE_URL}/rss.xml`,
    });
    const res = await fetch(WEBSUB_HUB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });
    if (res.status === 204 || res.ok) {
      console.log("   ✔ Sukses! Google WebSub Hub menerima sinyal (HTTP 204 No Content). Googlebot segera merayapi feed.");
    } else {
      console.log(`   ℹ Respons WebSub Hub: HTTP ${res.status}`);
    }
  } catch (err) {
    console.log(`   ❌ Gagal WebSub: ${err.message}`);
  }

  // 2. Ping IndexNow API
  console.log("\n2. Mengirim sinyal perayapan instan ke IndexNow API...");
  const sampleArticles = portalData.articles.slice(0, 10).map((a) => {
    const cat = portalData.categories.find((c) => c.id === a.categoryId);
    return `${SITE_URL}/${cat ? cat.slug : "berita"}/${a.slug}`;
  });
  const urlsToPing = [SITE_URL, ...sampleArticles];

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "catatannegeri.com",
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urlsToPing,
      }),
    });
    if (res.status === 200 || res.status === 202) {
      console.log(`   ✔ Sukses! ${urlsToPing.length} URL terkirim ke jaringan IndexNow (HTTP ${res.status} OK).`);
    } else {
      console.log(`   ℹ Respons IndexNow: HTTP ${res.status}`);
    }
  } catch (err) {
    console.log(`   ❌ Gagal IndexNow: ${err.message}`);
  }

  console.log("\n==================================================================");
  console.log("📋 PANDUAN SUBMIT GOOGLE SEARCH CONSOLE AGAR CEPAT TERINDEKS:");
  console.log("==================================================================");
  console.log("1. Buka Google Search Console: https://search.google.com/search-console");
  console.log("2. Masukkan Properti: https://catatannegeri.com");
  console.log("3. Masuk ke menu 'Peta Situs' (Sitemaps) di sebelah kiri, lalu masukkan:");
  console.log("   👉 sitemap.xml");
  console.log("   👉 news-sitemap.xml  (Prioritas Google News)");
  console.log("   👉 rss.xml           (Google Feed Crawler)");
  console.log("4. TRIK INDEKS SUPER CEPAT (HITUNGAN JAM):");
  console.log("   - Di kolom paling atas Search Console: 'Inspeksi URL'");
  console.log("   - Masukkan: https://catatannegeri.com lalu tekan Enter.");
  console.log("   - Klik tombol: 'MINTA PENGINDEKSAN' (Request Indexing).");
  console.log("   - Lakukan hal yang sama untuk 3 artikel berita terbaru.");
  console.log("==================================================================\n");
}

pingSearchEngines();
