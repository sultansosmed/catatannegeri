import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canPublish } from "@/lib/rbac";
import { CommentStatus } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canPublish(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const { status } = await req.json();
    if (!Object.values(CommentStatus).includes(status)) {
      return NextResponse.json({ error: "Status komentar tidak valid." }, { status: 400 });
    }

    const updated = await db.comment.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, comment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengubah status komentar." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canPublish(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await db.comment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghapus komentar." }, { status: 500 });
  }
}

