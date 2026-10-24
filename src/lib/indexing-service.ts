import { SITE_URL } from "./seo";

export interface FastIndexResult {
  engine: string;
  success: boolean;
  message: string;
  timestamp: string;
}

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "cn98a72ef31b40289a87d0e4125b0f19";
const WEBSUB_HUB_URL = "https://pubsubhubbub.appspot.com/";

/**
 * Pings Google Search Console sitemap endpoints
 */
export async function pingGoogleSitemap(sitemapUrl?: string): Promise<FastIndexResult> {
  const targetSitemap = sitemapUrl || `${SITE_URL}/news-sitemap.xml`;
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(targetSitemap)}`;

  try {
    const res = await fetch(pingUrl, {
      method: "GET",
      headers: {
        "User-Agent": "CatatanNegeri-Bot/1.0 (+https://catatannegeri.com)",
      },
      signal: AbortSignal.timeout(8000),
    });

    return {
      engine: "Google Search Console (Sitemap Ping)",
      success: res.ok,
      message: res.ok
        ? `Berhasil mengirim sinyal pembaruan sitemap (${targetSitemap}) ke Google Search Console.`
        : `Google merespons dengan status ${res.status}.`,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      engine: "Google Search Console (Sitemap Ping)",
      success: false,
      message: `Gagal menghubungi server ping Google: ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Pings WebSub (PubSubHubbub) Hub to alert Googlebot and feed aggregators immediately
 */
export async function pingWebSubHub(feedUrl?: string): Promise<FastIndexResult> {
  const targetFeed = feedUrl || `${SITE_URL}/rss.xml`;

  try {
    const formData = new URLSearchParams();
    formData.append("hub.mode", "publish");
    formData.append("hub.url", targetFeed);

    const res = await fetch(WEBSUB_HUB_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "CatatanNegeri-WebSub/1.0",
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(8000),
    });

    return {
      engine: "Google WebSub Hub (PubSubHubbub)",
      success: res.status === 204 || res.ok,
      message: res.status === 204 || res.ok
        ? `Notifikasi WebSub berhasil dikirim ke Google WebSub Hub (${WEBSUB_HUB_URL}). Googlebot akan segera merayapi feed.`
        : `WebSub merespons status: ${res.status}`,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      engine: "Google WebSub Hub (PubSubHubbub)",
      success: false,
      message: `Gagal mengirim sinyal WebSub: ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Pings IndexNow API (Supported by Bing, Yandex, Seznam, Naver, and global news crawlers)
 */
export async function pingIndexNow(urls: string[]): Promise<FastIndexResult> {
  if (urls.length === 0) {
    return {
      engine: "IndexNow (Bing/Yandex/Seznam)",
      success: false,
      message: "Tidak ada URL yang ditentukan untuk diping.",
      timestamp: new Date().toISOString(),
    };
  }

  const hostname = new URL(SITE_URL).hostname;

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        host: hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(8000),
    });

    return {
      engine: "IndexNow (Bing / Multi-Search Engines)",
      success: res.status === 200 || res.status === 202,
      message: res.status === 200 || res.status === 202
        ? `Berhasil mengirim ${urls.length} URL ke jaringan IndexNow. Perayapan mesin pencari diaktifkan seketika.`
        : `IndexNow merespons kode HTTP ${res.status}.`,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      engine: "IndexNow (Bing / Multi-Search Engines)",
      success: false,
      message: `Gagal menghubungi IndexNow: ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Orchestrates multi-engine instant indexing notifications when an article is published or updated
 */
export async function notifySearchEnginesOfNewArticle(articleUrl: string): Promise<FastIndexResult[]> {
  const results = await Promise.all([
    pingGoogleSitemap(`${SITE_URL}/news-sitemap.xml`),
    pingGoogleSitemap(`${SITE_URL}/sitemap.xml`),
    pingWebSubHub(`${SITE_URL}/rss.xml`),
    pingIndexNow([articleUrl]),
  ]);

  return results;
}

