export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { articleSchema } from "@/lib/validations";
import { canPublish } from "@/lib/rbac";
import { calculateReadingTime } from "@/lib/seo";
import { logAuditEvent } from "@/lib/audit";
import { notifySearchEnginesOfNewArticle } from "@/lib/indexing-service";
import { SITE_URL } from "@/lib/seo";
import { ArticleStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const query = searchParams.get("q");

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status as ArticleStatus;
  }
  if (categoryId && categoryId !== "ALL") {
    where.categoryId = categoryId;
  }
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
    ];
  }

  // If author role, only list their own unless editor/admin
  if (user.role === "AUTHOR" && user.authorProfile?.id) {
    where.authorId = user.authorProfile.id;
  }

  const articles = await db.article.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { name: true, slug: true } },
      author: { select: { displayName: true } },
    },
    take: 50,
  });

  return NextResponse.json({ articles });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sesi telah berakhir. Silakan login kembali." }, { status: 401 });
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

    // Check slug collision
    const existing = await db.article.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Slug URL ini sudah digunakan oleh artikel lain. Silakan ubah slug." },
        { status: 400 }
      );
    }

    // Role check for direct publishing
    let targetStatus = data.status;
    if (targetStatus === ArticleStatus.PUBLISHED && !canPublish(user.role)) {
      targetStatus = ArticleStatus.PENDING_REVIEW;
    }

    const readingTime = calculateReadingTime(data.content);
    const assignedAuthorId = data.authorId || user.authorProfile?.id;

    if (!assignedAuthorId) {
      return NextResponse.json(
        { error: "Penulis belum ditentukan atau akun ini belum memiliki profil jurnalis." },
        { status: 400 }
      );
    }

    const article = await db.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: data.content,
        categoryId: data.categoryId,
        authorId: assignedAuthorId,
        featuredImage: data.featuredImage || null,
        imageAlt: data.imageAlt || null,
        imageCaption: data.imageCaption || null,
        imageCredit: data.imageCredit || null,
        readingTime,
        status: targetStatus,
        publishedAt: targetStatus === ArticleStatus.PUBLISHED ? new Date() : null,
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
        tags: {
          create: data.tags.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
      include: { category: true, author: true },
    });

    // Create initial revision record
    await db.articleRevision.create({
      data: {
        articleId: article.id,
        title: article.title,
        summary: article.summary,
        content: article.content,
        revisionNote: "Versi awal artikel dibuat",
        createdById: user.id,
      },
    });

    // Log audit
    await logAuditEvent({
      userId: user.id,
      action: "ARTICLE_CREATED",
      entityType: "Article",
      entityId: article.id,
      details: { title: article.title, status: article.status },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    // Auto fast-index ping if published
    if (article.status === ArticleStatus.PUBLISHED) {
      const fullArticleUrl = `${SITE_URL}/${article.category.slug}/${article.slug}`;
      notifySearchEnginesOfNewArticle(fullArticleUrl).catch((err) => console.error("Auto index ping error:", err));
    }

    return NextResponse.json({ success: true, article });
  } catch (err: any) {
    console.error("Create article error:", err);
    return NextResponse.json({ error: err.message || "Gagal membuat artikel." }, { status: 500 });
  }
}

