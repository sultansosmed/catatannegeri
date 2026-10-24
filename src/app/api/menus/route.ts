import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageSettings } from "@/lib/rbac";

export async function GET() {
  const menus = await db.navigationMenu.findMany({
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json({ menus });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageSettings(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { title, url, position, target, sortOrder, isActive } = await req.json();

    if (!title || !url) {
      return NextResponse.json({ error: "Judul menu dan tautan URL wajib diisi." }, { status: 400 });
    }

    const menu = await db.navigationMenu.create({
      data: {
        title,
        url,
        position: position || "HEADER",
        target: target || "_self",
        sortOrder: parseInt(sortOrder || "0", 10),
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ success: true, menu });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membuat menu." }, { status: 500 });
  }
}

