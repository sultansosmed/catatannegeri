async function checkHtml() {
  const res = await fetch("http://localhost:3000/");
  const html = await res.text();
  console.log("Status:", res.status);
  
  // Extract all <link> and <style>
  const links = html.match(/<link[^>]*>/gi) || [];
  console.log("Links found:", links);

  const styles = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  console.log("Styles count:", styles.length);

  // Check if any link is stylesheet
  const cssLinks = links.filter(l => l.includes("stylesheet"));
  console.log("CSS Links:", cssLinks);

  for (const l of cssLinks) {
    const hrefMatch = l.match(/href="([^"]+)"/);
    if (hrefMatch) {
      const cssUrl = hrefMatch[1].startsWith("http") ? hrefMatch[1] : `http://localhost:3000${hrefMatch[1]}`;
      console.log("Fetching CSS:", cssUrl);
      const cssRes = await fetch(cssUrl);
      const cssText = await cssRes.text();
      console.log(`CSS Status: ${cssRes.status}, Size: ${cssText.length} bytes`);
      console.log("CSS sample:", cssText.slice(0, 150));
    }
  }
}

checkHtml().catch(console.error);

