import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { canManageCategories } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { articles: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageCategories(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { name, slug, description, sortOrder, isActive, metaTitle, metaDescription } = result.data;

    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug kategori telah digunakan." }, { status: 400 });
    }

    const category = await db.category.create({
      data: { name, slug, description, sortOrder, isActive, metaTitle, metaDescription },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CATEGORY_CREATED",
      entityType: "Category",
      entityId: category.id,
      details: { name, slug },
    });

    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

