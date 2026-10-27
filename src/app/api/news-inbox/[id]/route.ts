export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await db.ingestedItem.findUnique({
    where: { id },
    include: {
      source: true,
      reviewedBy: { select: { id: true, name: true, role: true } },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item berita tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ item });
}


export async function generateStaticParams() {
  return [];
}
