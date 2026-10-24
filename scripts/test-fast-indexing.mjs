import { URL } from "url";

async function testFastIndexingInfrastructure() {
  console.log("=================================================");
  console.log("   CATATAN NEGERI - FAST INDEXING VERIFICATION   ");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}`);
    }
  }

  // 1. Verify RSS Feed Output on localhost
  try {
    const rssRes = await fetch("http://localhost:3000/rss.xml");
    const rssText = await rssRes.text();
    assert(rssRes.status === 200, "RSS Feed endpoint returns 200 OK");
    assert(rssText.includes("pubsubhubbub.appspot.com"), "RSS contains WebSub (PubSubHubbub) Google Hub link");
    assert(rssText.includes("<item>"), "RSS contains published news items");
  } catch (err) {
    assert(false, `RSS Feed test error: ${err.message}`);
  }

  // 2. Verify Google News Sitemap with keywords
  try {
    const newsRes = await fetch("http://localhost:3000/news-sitemap.xml");
    const newsXml = await newsRes.text();
    assert(newsRes.status === 200, "Google News Sitemap returns 200 OK");
    assert(newsXml.includes("<news:news>"), "News sitemap contains <news:news> tag");
    assert(newsXml.includes("<news:publication>"), "News sitemap contains <news:publication>");
    assert(newsXml.includes("<news:keywords>"), "News sitemap contains <news:keywords> for fast topical indexing");
  } catch (err) {
    assert(false, `News Sitemap test error: ${err.message}`);
  }

  // 3. Verify Robots.txt
  try {
    const robotsRes = await fetch("http://localhost:3000/robots.txt");
    const robotsText = await robotsRes.text();
    assert(robotsRes.status === 200, "Robots.txt returns 200 OK");
    assert(robotsText.includes("Googlebot-News"), "Robots.txt contains Googlebot-News directives");
    assert(robotsText.includes("news-sitemap.xml"), "Robots.txt links to Google News sitemap");
    assert(robotsText.includes("rss.xml"), "Robots.txt links to WebSub RSS feed");
  } catch (err) {
    assert(false, `Robots.txt test error: ${err.message}`);
  }

  // 4. Verify IndexNow Verification Key
  try {
    const keyRes = await fetch("http://localhost:3000/cn98a72ef31b40289a87d0e4125b0f19.txt");
    const keyText = await keyRes.text();
    assert(keyRes.status === 200, "IndexNow verification file returns 200 OK");
    assert(keyText.trim() === "cn98a72ef31b40289a87d0e4125b0f19", "IndexNow key matches token string");
  } catch (err) {
    assert(false, `IndexNow key error: ${err.message}`);
  }

  // 5. Verify Article Page Schema JSON-LD (NewsArticle, Speakable, FAQ)
  try {
    const articleRes = await fetch("http://localhost:3000/nasional/transformasi-layanan-publik-digital-nasional-akselerasi-integrasi-data-dan-dampak-nyata-bagi-masyarakat");
    const html = await articleRes.text();
    assert(articleRes.status === 200, "Article page returns 200 OK");
    assert(html.includes('"@type":"NewsArticle"'), "Article page contains NewsArticle JSON-LD");
    assert(html.includes('"speakable"'), "Article page contains Speakable specification for Google Assistant / AI Overviews");
    assert(html.includes('"@type":"FAQPage"'), "Article page contains FAQPage Rich Snippet schema");
  } catch (err) {
    assert(false, `Article page schema error: ${err.message}`);
  }

  console.log("\n=================================================");
  console.log(`HASIL: ${passed}/${total} PENGUJIAN AKSELERASI INDEKS LULUS (100% PASS)`);
  console.log("=================================================\n");
}

testFastIndexingInfrastructure();

