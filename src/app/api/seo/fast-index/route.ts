import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/seo";
import {
  pingGoogleSitemap,
  pingWebSubHub,
  pingIndexNow,
  notifySearchEnginesOfNewArticle,
} from "@/lib/indexing-service";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { articleId, articleUrl, action } = body;

    let targetUrl = articleUrl;

    if (articleId) {
      const article = await db.article.findUnique({
        where: { id: articleId },
        include: { category: true },
      });
      if (article) {
        targetUrl = `${SITE_URL}/${article.category.slug}/${article.slug}`;
      }
    }

    if (action === "PING_ALL_RECENT") {
      // Fetch latest 20 published articles
      const recentArticles = await db.article.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, category: { select: { slug: true } } },
        orderBy: { publishedAt: "desc" },
        take: 20,
      });

      const urlList = recentArticles.map((a) => `${SITE_URL}/${a.category.slug}/${a.slug}`);

      const [googleNewsPing, googleMainPing, webSubPing, indexNowPing] = await Promise.all([
        pingGoogleSitemap(`${SITE_URL}/news-sitemap.xml`),
        pingGoogleSitemap(`${SITE_URL}/sitemap.xml`),
        pingWebSubHub(`${SITE_URL}/rss.xml`),
        pingIndexNow(urlList),
      ]);

      await logAuditEvent({
        userId: user.id,
        action: "SEO_FAST_INDEX_ALL",
        entityType: "Article",
        details: { count: urlList.length },
      });

      return NextResponse.json({
        success: true,
        message: `Berhasil mengirim ${urlList.length} artikel ke Google Search Console & IndexNow.`,
        results: [googleNewsPing, googleMainPing, webSubPing, indexNowPing],
      });
    }

    if (!targetUrl) {
      return NextResponse.json({ error: "URL artikel tidak valid atau artikel tidak ditemukan." }, { status: 400 });
    }

    const results = await notifySearchEnginesOfNewArticle(targetUrl);

    await logAuditEvent({
      userId: user.id,
      action: "SEO_FAST_INDEX_SINGLE",
      entityType: "Article",
      entityId: articleId,
      details: { url: targetUrl },
    });

    return NextResponse.json({
      success: true,
      url: targetUrl,
      results,
    });
  } catch (err: any) {
    console.error("Fast index error:", err);
    return NextResponse.json({ error: err.message || "Gagal memproses fast index ping." }, { status: 500 });
  }
}

