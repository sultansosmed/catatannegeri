import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { articleSchema } from "@/lib/validations";
import { canEditArticle, canDeleteArticle, canPublish } from "@/lib/rbac";
import { calculateReadingTime, SITE_URL } from "@/lib/seo";
import { logAuditEvent } from "@/lib/audit";
import { notifySearchEnginesOfNewArticle } from "@/lib/indexing-service";
import { ArticleStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const article = await db.article.findUnique({
    where: { id },
    include: {
      category: true,
      author: true,
      tags: { include: { tag: true } },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Artikel tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ article });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.article.findUnique({
    where: { id },
    include: { author: true, category: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Artikel tidak ditemukan." }, { status: 404 });
  }

  if (!canEditArticle(user.role, existing.author.userId, user.id)) {
    return NextResponse.json({ error: "Anda tidak memiliki wewenang untuk menyunting artikel ini." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = articleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Data artikel tidak valid." },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check slug collision with another article
    if (data.slug !== existing.slug) {
      const slugCollision = await db.article.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (slugCollision) {
        return NextResponse.json(
          { error: "Slug URL baru telah digunakan oleh artikel lain." },
          { status: 400 }
        );
      }

      // Create permanent 301 redirect if existing article was already published
      if (existing.status === ArticleStatus.PUBLISHED) {
        const oldPath = `/${existing.category.slug}/${existing.slug}`;
        const newPath = `/${existing.category.slug}/${data.slug}`;

        await db.redirect.upsert({
          where: { sourcePath: oldPath },
          update: { destinationPath: newPath, statusCode: 301, isActive: true },
          create: { sourcePath: oldPath, destinationPath: newPath, statusCode: 301, isActive: true },
        });
      }
    }

    let targetStatus = data.status;
    if (targetStatus === ArticleStatus.PUBLISHED && !canPublish(user.role)) {
      targetStatus = ArticleStatus.PENDING_REVIEW;
    }

    // Determine publishedAt date
    let publishedAt = existing.publishedAt;
    if (targetStatus === ArticleStatus.PUBLISHED && !existing.publishedAt) {
      publishedAt = new Date();
    }

    const readingTime = calculateReadingTime(data.content);

    // Update tags in transaction
    const updated = await db.$transaction(async (tx) => {
      // Clear old tags
      await tx.articleTag.deleteMany({ where: { articleId: id } });

      // Create new tag links
      if (data.tags.length > 0) {
        await tx.articleTag.createMany({
          data: data.tags.map((tagId) => ({
            articleId: id,
            tagId,
          })),
        });
      }

      // Update article record
      const art = await tx.article.update({
        where: { id },
        data: {
          title: data.title,
          slug: data.slug,
          summary: data.summary,
          content: data.content,
          categoryId: data.categoryId,
          authorId: data.authorId || existing.authorId,
          featuredImage: data.featuredImage || null,
          imageAlt: data.imageAlt || null,
          imageCaption: data.imageCaption || null,
          imageCredit: data.imageCredit || null,
          readingTime,
          status: targetStatus,
          publishedAt,
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
          isBreaking: data.isBreaking,
          isFeatured: data.isFeatured,
          isEditorPick: data.isEditorPick,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
          canonicalUrl: data.canonicalUrl || null,
          noIndex: data.noIndex,
          factCheckNotes: data.factCheckNotes || null,
          correctionNotes: data.correctionNotes || null,
          sourceReferences: data.sourceReferences || null,
        },
        include: { category: true, author: true },
      });

      // Save revision record
      await tx.articleRevision.create({
        data: {
          articleId: id,
          title: data.title,
          summary: data.summary,
          content: data.content,
          revisionNote: `Diperbarui oleh ${user.name} (${user.role})`,
          createdById: user.id,
        },
      });

      return art;
    });

    // Log audit
    await logAuditEvent({
      userId: user.id,
      action: "ARTICLE_UPDATED",
      entityType: "Article",
      entityId: id,
      details: { title: updated.title, status: updated.status },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    // Auto fast-index ping if published
    if (updated.status === ArticleStatus.PUBLISHED) {
      const fullArticleUrl = `${SITE_URL}/${updated.category.slug}/${updated.slug}`;
      notifySearchEnginesOfNewArticle(fullArticleUrl).catch((err) => console.error("Auto index ping error:", err));
    }

    return NextResponse.json({ success: true, article: updated });
  } catch (err: any) {
    console.error("Update article error:", err);
    return NextResponse.json({ error: err.message || "Gagal memperbarui artikel." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canDeleteArticle(user.role)) {
    return NextResponse.json({ error: "Hanya Pemimpin Redaksi atau Redaktur yang dapat menghapus berita." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await db.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Artikel tidak ditemukan." }, { status: 404 });
    }

    await db.article.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "ARTICLE_DELETED",
      entityType: "Article",
      entityId: id,
      details: { title: existing.title, slug: existing.slug },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return NextResponse.json({ success: true, message: "Artikel berhasil dihapus." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghapus artikel." }, { status: 500 });
  }
}

