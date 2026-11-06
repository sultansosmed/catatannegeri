const fs = require('fs');
const path = require('path');
const portalData = require('../src/data/portal-data.json');

const outDir = path.join(__dirname, '..', 'out');
const publicDir = path.join(__dirname, '..', 'public');
const SITE_URL = 'https://catatannegeri.com';

// 1. Remove conflicting directories if they exist
['sitemap.xml', 'sitemap_index.xml', 'news-sitemap.xml', 'robots.txt', 'rss.xml', '(public)', 'api'].forEach((item) => {
  const p = path.join(outDir, item);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
    fs.rmSync(p, { recursive: true, force: true });
  }
});

// 2. Generate sitemap.xml
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
sitemap += `  <url><loc>${SITE_URL}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
sitemap += `  <url><loc>${SITE_URL}/tentang-kami</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
sitemap += `  <url><loc>${SITE_URL}/kontak</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
sitemap += `  <url><loc>${SITE_URL}/pedoman-media-siber</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
sitemap += `  <url><loc>${SITE_URL}/kebijakan-koreksi</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
sitemap += `  <url><loc>${SITE_URL}/kebijakan-privasi</loc><changefreq>yearly</changefreq><priority>0.4</priority></url>\n`;
sitemap += `  <url><loc>${SITE_URL}/syarat-ketentuan</loc><changefreq>yearly</changefreq><priority>0.4</priority></url>\n`;

for (const cat of portalData.categories) {
  sitemap += `  <url><loc>${SITE_URL}/${cat.slug}</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>\n`;
}
for (const art of portalData.articles) {
  const cat = portalData.categories.find((c) => c.id === art.categoryId);
  const catSlug = cat ? cat.slug : 'berita';
  sitemap += `  <url><loc>${SITE_URL}/${catSlug}/${art.slug}</loc><lastmod>${new Date(art.publishedAt || art.createdAt).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
}
sitemap += `</urlset>`;
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
console.log('✔ Generated out/sitemap.xml and public/sitemap.xml');

// 2b. Generate sitemap_index.xml (Master Index for Google Search Console)
const nowIso = new Date().toISOString();
let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
sitemapIndex += `  <sitemap>\n    <loc>${SITE_URL}/sitemap.xml</loc>\n    <lastmod>${nowIso}</lastmod>\n  </sitemap>\n`;
sitemapIndex += `  <sitemap>\n    <loc>${SITE_URL}/news-sitemap.xml</loc>\n    <lastmod>${nowIso}</lastmod>\n  </sitemap>\n`;
sitemapIndex += `</sitemapindex>`;
fs.writeFileSync(path.join(outDir, 'sitemap_index.xml'), sitemapIndex);
fs.writeFileSync(path.join(publicDir, 'sitemap_index.xml'), sitemapIndex);
console.log('✔ Generated out/sitemap_index.xml and public/sitemap_index.xml');

// 3. Generate news-sitemap.xml
let newsSitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;
for (const art of portalData.articles.slice(0, 20)) {
  const cat = portalData.categories.find((c) => c.id === art.categoryId);
  const catSlug = cat ? cat.slug : 'berita';
  newsSitemap += `  <url>\n    <loc>${SITE_URL}/${catSlug}/${art.slug}</loc>\n    <news:news>\n      <news:publication>\n        <news:name>Catatan Negeri</news:name>\n        <news:language>id</news:language>\n      </news:publication>\n      <news:publication_date>${new Date(art.publishedAt || art.createdAt).toISOString()}</news:publication_date>\n      <news:title><![CDATA[${art.title}]]></news:title>\n    </news:news>\n  </url>\n`;
}
newsSitemap += `</urlset>`;
fs.writeFileSync(path.join(outDir, 'news-sitemap.xml'), newsSitemap);
fs.writeFileSync(path.join(publicDir, 'news-sitemap.xml'), newsSitemap);
console.log('✔ Generated out/news-sitemap.xml and public/news-sitemap.xml');

// 4. Generate rss.xml
let rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>Catatan Negeri</title>\n  <link>${SITE_URL}</link>\n  <description>Portal Berita &amp; Informasi Digital Terpercaya Indonesia</description>\n  <language>id</language>\n`;
for (const art of portalData.articles.slice(0, 20)) {
  const cat = portalData.categories.find((c) => c.id === art.categoryId);
  const catSlug = cat ? cat.slug : 'berita';
  rss += `  <item>\n    <title><![CDATA[${art.title}]]></title>\n    <link>${SITE_URL}/${catSlug}/${art.slug}</link>\n    <guid>${SITE_URL}/${catSlug}/${art.slug}</guid>\n    <pubDate>${new Date(art.publishedAt || art.createdAt).toUTCString()}</pubDate>\n    <description><![CDATA[${art.summary}]]></description>\n  </item>\n`;
}
rss += `</channel>\n</rss>`;
fs.writeFileSync(path.join(outDir, 'rss.xml'), rss);
fs.writeFileSync(path.join(publicDir, 'rss.xml'), rss);
console.log('✔ Generated out/rss.xml and public/rss.xml');

// 5. Generate robots.txt
const robots = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap_index.xml\nSitemap: ${SITE_URL}/sitemap.xml\nSitemap: ${SITE_URL}/news-sitemap.xml\nHost: ${SITE_URL}\n`;
fs.writeFileSync(path.join(outDir, 'robots.txt'), robots);
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);
console.log('✔ Generated out/robots.txt and public/robots.txt');

// 5b. Generate ads.txt for Google AdSense
const ADSENSE_PUB_ID = 'pub-4265487663797458';
const adsTxtContent = `google.com, ${ADSENSE_PUB_ID}, DIRECT, f08c47fec0942fa0\n`;
fs.writeFileSync(path.join(outDir, 'ads.txt'), adsTxtContent);
fs.writeFileSync(path.join(publicDir, 'ads.txt'), adsTxtContent);
console.log('✔ Generated out/ads.txt and public/ads.txt');

// 5c. Inject Google AdSense script and meta verification tag into pre-rendered HTML files
const adsenseScriptTag = `<meta name="google-adsense-account" content="ca-${ADSENSE_PUB_ID}"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${ADSENSE_PUB_ID}" crossorigin="anonymous"></script>`;
function injectAdsense(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes(`ca-${ADSENSE_PUB_ID}`)) {
    html = html.replace('</head>', `${adsenseScriptTag}</head>`);
    fs.writeFileSync(filePath, html, 'utf8');
  }
}
injectAdsense(path.join(outDir, 'index.html'));

// 6. Ensure Clean Category Routing for Static Hosting (both /kategori.html and /kategori/index.html)
for (const cat of portalData.categories) {
  const catHtml = path.join(outDir, `${cat.slug}.html`);
  const catDir = path.join(outDir, cat.slug);
  const catIndexHtml = path.join(catDir, 'index.html');
  if (fs.existsSync(catHtml)) {
    if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
    fs.copyFileSync(catHtml, catIndexHtml);
  }
}

// 7. Ensure Clean Article Routing (/kategori/slug/index.html)
for (const art of portalData.articles) {
  const cat = portalData.categories.find((c) => c.id === art.categoryId);
  const catSlug = cat ? cat.slug : 'berita';
  const artHtml = path.join(outDir, catSlug, `${art.slug}.html`);
  const artDir = path.join(outDir, catSlug, art.slug);
  const artIndexHtml = path.join(artDir, 'index.html');
  if (fs.existsSync(artHtml)) {
    if (!fs.existsSync(artDir)) fs.mkdirSync(artDir, { recursive: true });
    fs.copyFileSync(artHtml, artIndexHtml);
  }
}

// 8. Ensure Clean Admin Routing
require('./generate-static-admin.cjs');

console.log('✔ Clean URL index.html routing ensured for all categories and articles!');

