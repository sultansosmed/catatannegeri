import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export async function GET() {
  try {
    // 1. Fetch active categories
    const categories = await db.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    // 2. Fetch published, indexable articles
    const articles = await db.article.findMany({
      where: {
        status: "PUBLISHED",
        noIndex: false,
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
        category: { select: { slug: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 1000,
    });

    // 3. Static institutional pages
    const staticPages = [
      { path: "", changefreq: "daily", priority: "1.0", lastmod: new Date().toISOString() },
      { path: "pedoman-media-siber", changefreq: "monthly", priority: "0.6", lastmod: new Date().toISOString() },
      { path: "kebijakan-koreksi", changefreq: "monthly", priority: "0.6", lastmod: new Date().toISOString() },
      { path: "tentang-kami", changefreq: "monthly", priority: "0.7", lastmod: new Date().toISOString() },
      { path: "kontak", changefreq: "monthly", priority: "0.7", lastmod: new Date().toISOString() },
      { path: "kebijakan-privasi", changefreq: "yearly", priority: "0.4", lastmod: new Date().toISOString() },
      { path: "syarat-ketentuan", changefreq: "yearly", priority: "0.4", lastmod: new Date().toISOString() },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of staticPages) {
      const url = page.path ? `${SITE_URL}/${page.path}` : SITE_URL;
      xml += `  <url>\n`;
      xml += `    <loc>${url}</loc>\n`;
      xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Category pages
    for (const cat of categories) {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/${cat.slug}</loc>\n`;
      xml += `    <lastmod>${cat.updatedAt.toISOString()}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Article pages
    for (const art of articles) {
      const lastModDate = art.updatedAt || art.publishedAt || new Date();
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/${art.category.slug}/${art.slug}</loc>\n`;
      xml += `    <lastmod>${lastModDate.toISOString()}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error generating sitemap.xml:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}

