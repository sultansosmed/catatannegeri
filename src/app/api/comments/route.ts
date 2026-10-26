export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canPublish } from "@/lib/rbac";
import { CommentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canPublish(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status as CommentStatus;
  }

  const comments = await db.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      article: { select: { id: true, title: true, slug: true, category: { select: { slug: true } } } },
    },
    take: 100,
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  // Public reader comment submission
  try {
    const body = await req.json();
    const { articleId, authorName, authorEmail, content } = body;

    if (!articleId || !authorName || !authorEmail || !content) {
      return NextResponse.json({ error: "Semua kolom wajib diisi." }, { status: 400 });
    }

    if (content.length < 5 || content.length > 1000) {
      return NextResponse.json({ error: "Komentar harus berisi antara 5 sampai 1000 karakter." }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");

    const comment = await db.comment.create({
      data: {
        articleId,
        authorName,
        authorEmail,
        content,
        status: CommentStatus.PENDING, // New comments require editorial approval
        ipAddress,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Komentar Anda telah diterima dan sedang menunggu persetujuan moderator.",
      comment,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengirim komentar." }, { status: 500 });
  }
}

