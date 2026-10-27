export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { canManageCategories } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canManageCategories(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message || "Invalid" }, { status: 400 });
    }

    const { name, slug, description, sortOrder, isActive, metaTitle, metaDescription } = result.data;

    const existing = await db.category.findFirst({
      where: { slug, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug kategori telah digunakan." }, { status: 400 });
    }

    const category = await db.category.update({
      where: { id },
      data: { name, slug, description, sortOrder, isActive, metaTitle, metaDescription },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CATEGORY_UPDATED",
      entityType: "Category",
      entityId: id,
      details: { name, slug },
    });

    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canManageCategories(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  try {
    // Check if category has articles
    const articleCount = await db.article.count({ where: { categoryId: id } });
    if (articleCount > 0) {
      return NextResponse.json(
        { error: `Kategori ini masih memiliki ${articleCount} artikel. Pindahkan atau hapus artikel terlebih dahulu.` },
        { status: 400 }
      );
    }

    await db.category.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "CATEGORY_DELETED",
      entityType: "Category",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}


export async function generateStaticParams() {
  return [];
}
