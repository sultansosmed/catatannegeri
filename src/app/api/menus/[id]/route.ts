export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageSettings } from "@/lib/rbac";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canManageSettings(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const { title, url, position, target, sortOrder, isActive } = await req.json();

    const menu = await db.navigationMenu.update({
      where: { id },
      data: {
        title,
        url,
        position,
        target,
        sortOrder: typeof sortOrder === "number" ? sortOrder : parseInt(sortOrder || "0", 10),
        isActive,
      },
    });

    return NextResponse.json({ success: true, menu });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengubah menu." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canManageSettings(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await db.navigationMenu.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghapus menu." }, { status: 500 });
  }
}


export async function generateStaticParams() {
  return [];
}
