import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const sourceId = searchParams.get("sourceId");
  const isHighImpact = searchParams.get("isHighImpact");
  const query = searchParams.get("q");

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (sourceId && sourceId !== "ALL") {
    where.sourceId = sourceId;
  }
  if (isHighImpact === "true") {
    where.isHighImpact = true;
  }
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { rawContent: { contains: query, mode: "insensitive" } },
      { excerpt: { contains: query, mode: "insensitive" } },
    ];
  }

  const items = await db.ingestedItem.findMany({
    where,
    orderBy: { discoveredAt: "desc" },
    include: {
      source: { select: { id: true, name: true, type: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
    take: 100,
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  // Batch operations: dismiss duplicates or change status
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, itemIds } = await req.json();
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal 1 item." }, { status: 400 });
    }

    if (action === "DISMISS_DUPLICATES") {
      await db.ingestedItem.updateMany({
        where: { id: { in: itemIds } },
        data: { status: "REJECTED", editorialNotes: "Ditolak: Duplikasi terkonfirmasi redaksi." },
      });
      return NextResponse.json({ success: true, count: itemIds.length });
    }

    if (action === "MARK_READY_AI") {
      await db.ingestedItem.updateMany({
        where: { id: { in: itemIds } },
        data: { status: "READY_FOR_AI_DRAFT" },
      });
      return NextResponse.json({ success: true, count: itemIds.length });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

