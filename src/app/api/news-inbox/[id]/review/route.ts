export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canPublish } from "@/lib/rbac";
import { generateSlug } from "@/lib/slug";
import { calculateReadingTime, SITE_URL } from "@/lib/seo";
import { logAuditEvent } from "@/lib/audit";
import { notifySearchEnginesOfNewArticle } from "@/lib/indexing-service";
import { ArticleStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canPublish(user.role)) {
    return NextResponse.json({ error: "Hanya Redaktur atau Pemimpin Redaksi yang berwenang meninjau dan menerbitkan berita." }, { status: 403 });
  }

  const { id } = await params;
  const item = await db.ingestedItem.findUnique({
    where: { id },
    include: { source: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Item berita tidak ditemukan." }, { status: 404 });
  }

  try {
    const body = await req.json();
    const {
      action, // "APPROVE_AND_PUBLISH" | "APPROVE_AS_DRAFT" | "RESEARCH_NEEDED" | "REJECT"
      editorialNotes,
      title,
      summary,
      content,
      categoryId,
      authorId,
      featuredImage,
      imageAlt,
      imageCaption,
      imageCredit,
      tags,
      metaTitle,
      metaDescription,
    } = body;

    // Handle Reject
    if (action === "REJECT") {
      const updated = await db.ingestedItem.update({
        where: { id },
        data: {
          status: "REJECTED",
          editorialNotes: editorialNotes || "Ditolak oleh dewan redaksi.",
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, item: updated });
    }

    // Handle Research Needed
    if (action === "RESEARCH_NEEDED") {
      const updated = await db.ingestedItem.update({
        where: { id },
        data: {
          status: "RESEARCH_NEEDED",
          editorialNotes: editorialNotes || "Membutuhkan konfirmasi fakta tambahan dan liputan lapangan.",
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, item: updated });
    }

    // Handle Approve and Convert to Article (Publish or Draft)
    if (action === "APPROVE_AND_PUBLISH" || action === "APPROVE_AS_DRAFT") {
      const finalTitle = title || item.aiDraftTitle || item.title;
      const finalSummary = summary || item.aiDraftSummary || item.excerpt || finalTitle;
      const finalContent = content || item.aiDraftContent || item.rawContent;

      if (!finalContent || finalContent.length < 50) {
        return NextResponse.json({ error: "Naskah artikel belum lengkap (minimal 50 karakter)." }, { status: 400 });
      }

      // Determine category
      let targetCategoryId = categoryId;
      if (!targetCategoryId) {
        const catName = item.aiRecommendedCategory || item.detectedCategory || "Nasional";
        const cat = await db.category.findFirst({
          where: { name: { contains: catName, mode: "insensitive" } },
        });
        targetCategoryId = cat?.id || (await db.category.findFirst())?.id;
      }

      // Determine author
      let targetAuthorId = authorId;
      if (!targetAuthorId) {
        targetAuthorId = user.authorProfile?.id || (await db.authorProfile.findFirst())?.id;
      }

      // Generate unique slug
      let baseSlug = generateSlug(finalTitle);
      if (!baseSlug) baseSlug = `berita-${Date.now()}`;
      let finalSlug = baseSlug;

      const existingSlug = await db.article.findUnique({ where: { slug: finalSlug } });
      if (existingSlug) {
        finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }

      const readingTime = calculateReadingTime(finalContent);
      const isPublish = action === "APPROVE_AND_PUBLISH";
      const targetArticleStatus = isPublish ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT;

      const sourcesMetadata = JSON.stringify([
        {
          source: item.source.name,
          url: item.canonicalUrl || item.originalUrl,
          date: item.originalPublishedAt,
          type: item.source.type,
        },
      ]);

      const factCheckNotes = item.isHighImpact
        ? `Laporan melalui verifikasi ketat redaksi khusus topik berdampak tinggi. Sumber primer: ${item.source.name}.`
        : `Diverifikasi berdasarkan siaran pers resmi ${item.source.name}.`;

      // Create Article in transaction
      const article = await db.article.create({
        data: {
          title: finalTitle,
          slug: finalSlug,
          summary: finalSummary,
          content: finalContent,
          categoryId: targetCategoryId!,
          authorId: targetAuthorId!,
          featuredImage: featuredImage || null,
          imageAlt: imageAlt || finalTitle,
          imageCaption: imageCaption || `Ilustrasi siaran berita ${item.source.name}`,
          imageCredit: imageCredit || item.source.name,
          readingTime,
          status: targetArticleStatus,
          publishedAt: isPublish ? new Date() : null,
          metaTitle: metaTitle || `${finalTitle.slice(0, 60)} — Catatan Negeri`,
          metaDescription: metaDescription || finalSummary.slice(0, 155),
          canonicalUrl: `https://catatannegeri.com/${item.detectedCategory?.toLowerCase() || "nasional"}/${finalSlug}`,
          factCheckNotes,
          sourceReferences: sourcesMetadata,
        },
        include: { category: true, author: true },
      });

      // Connect tags if any
      const tagList = Array.isArray(tags) ? tags : [];
      for (const tName of tagList) {
        if (!tName) continue;
        const tagSlug = generateSlug(tName);
        const tagRecord = await db.tag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: { name: tName, slug: tagSlug },
        });

        await db.articleTag.upsert({
          where: {
            articleId_tagId: { articleId: article.id, tagId: tagRecord.id },
          },
          update: {},
          create: { articleId: article.id, tagId: tagRecord.id },
        });
      }

      // Save initial revision record
      await db.articleRevision.create({
        data: {
          articleId: article.id,
          title: article.title,
          summary: article.summary,
          content: article.content,
          revisionNote: `Disetujui dari pipeline agregasi sumber '${item.source.name}' oleh ${user.name}`,
          createdById: user.id,
        },
      });

      // Update IngestedItem status
      await db.ingestedItem.update({
        where: { id },
        data: {
          status: isPublish ? "PUBLISHED" : "APPROVED",
          draftedArticleId: article.id,
          reviewedById: user.id,
          reviewedAt: new Date(),
          editorialNotes: `Disetujui menjadi artikel publik: /${article.category.slug}/${article.slug}`,
        },
      });

      await logAuditEvent({
        userId: user.id,
        action: isPublish ? "INBOX_ARTICLE_PUBLISHED" : "INBOX_ARTICLE_APPROVED_AS_DRAFT",
        entityType: "Article",
        entityId: article.id,
        details: {
          ingestedItemId: id,
          source: item.source.name,
          title: article.title,
          slug: article.slug,
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      });

      // Auto fast-index ping if published
      if (isPublish) {
        const fullArticleUrl = `${SITE_URL}/${article.category.slug}/${article.slug}`;
        notifySearchEnginesOfNewArticle(fullArticleUrl).catch((err) => console.error("Auto index ping error:", err));
      }

      return NextResponse.json({
        success: true,
        article,
        articleUrl: `/${article.category.slug}/${article.slug}`,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err: any) {
    console.error("Review action error:", err);
    return NextResponse.json({ error: err.message || "Gagal memproses telaah." }, { status: 500 });
  }
}


export async function generateStaticParams() {
  return [];
}
