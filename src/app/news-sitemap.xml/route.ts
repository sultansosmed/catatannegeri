import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

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
    // Google News sitemap requires articles published in the last 48 hours (2 days)
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const articles = await db.article.findMany({
      where: {
        status: "PUBLISHED",
        noIndex: false,
        publishedAt: {
          gte: twoDaysAgo,
        },
      },
      select: {
        title: true,
        slug: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
      orderBy: { publishedAt: "desc" },
      take: 1000,
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;

    for (const art of articles) {
      const pubDate = art.publishedAt ? art.publishedAt.toISOString() : new Date().toISOString();
      const articleUrl = `${SITE_URL}/${art.category.slug}/${art.slug}`;
      const tagKeywords = art.tags.map((t) => t.tag.name).join(", ");
      const keywords = tagKeywords ? `${art.category.name}, ${tagKeywords}` : art.category.name;

      xml += `  <url>\n`;
      xml += `    <loc>${articleUrl}</loc>\n`;
      xml += `    <news:news>\n`;
      xml += `      <news:publication>\n`;
      xml += `        <news:name>Catatan Negeri</news:name>\n`;
      xml += `        <news:language>id</news:language>\n`;
      xml += `      </news:publication>\n`;
      xml += `      <news:publication_date>${pubDate}</news:publication_date>\n`;
      xml += `      <news:title>${escapeXml(art.title)}</news:title>\n`;
      xml += `      <news:keywords>${escapeXml(keywords)}</news:keywords>\n`;
      xml += `    </news:news>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    return new NextResponse(`Error generating News sitemap: ${err.message}`, { status: 500 });
  }
}
