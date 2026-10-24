import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE_URL, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

export async function GET() {
  try {
    const articles = await db.article.findMany({
      where: {
        status: "PUBLISHED",
        noIndex: false,
      },
      select: {
        title: true,
        slug: true,
        summary: true,
        content: true,
        publishedAt: true,
        updatedAt: true,
        category: { select: { name: true, slug: true } },
        author: { select: { displayName: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    const lastBuildDate = articles[0]?.publishedAt
      ? articles[0].publishedAt.toUTCString()
      : new Date().toUTCString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>${escapeXml(SITE_NAME)} - ${escapeXml(SITE_TAGLINE)}</title>\n`;
    xml += `    <link>${SITE_URL}</link>\n`;
    xml += `    <description>Kabar berita terkini, terpercaya, dan mendalam seputar Indonesia.</description>\n`;
    xml += `    <language>id</language>\n`;
    xml += `    <lastBuildDate>${lastBuildDate}</lastBuildDate>\n`;
    xml += `    <atom:link rel="hub" href="https://pubsubhubbub.appspot.com/"/>\n`;
    xml += `    <atom:link rel="self" href="${SITE_URL}/rss.xml" type="application/rss+xml"/>\n`;

    for (const art of articles) {
      const pubDate = art.publishedAt ? art.publishedAt.toUTCString() : new Date().toUTCString();
      const articleUrl = `${SITE_URL}/${art.category.slug}/${art.slug}`;

      xml += `    <item>\n`;
      xml += `      <title>${escapeXml(art.title)}</title>\n`;
      xml += `      <link>${articleUrl}</link>\n`;
      xml += `      <guid isPermaLink="true">${articleUrl}</guid>\n`;
      xml += `      <pubDate>${pubDate}</pubDate>\n`;
      xml += `      <dc:creator>${escapeXml(art.author.displayName)}</dc:creator>\n`;
      xml += `      <category>${escapeXml(art.category.name)}</category>\n`;
      xml += `      <description>${escapeXml(art.summary)}</description>\n`;
      xml += `      <content:encoded><![CDATA[${art.content}]]></content:encoded>\n`;
      xml += `    </item>\n`;
    }

    xml += `  </channel>\n`;
    xml += `</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (err: any) {
    return new NextResponse(`Error generating RSS: ${err.message}`, { status: 500 });
  }
}

