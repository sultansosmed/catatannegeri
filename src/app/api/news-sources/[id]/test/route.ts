export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageIntegrations } from "@/lib/rbac";
import { safeFetchText } from "@/lib/network-safety";
import Parser from "rss-parser";

const parser = new Parser();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canManageIntegrations(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const source = await db.ingestionSource.findUnique({ where: { id } });

  if (!source) {
    return NextResponse.json({ error: "Sumber tidak ditemukan." }, { status: 404 });
  }

  const startTime = Date.now();

  try {
    const rawXml = await safeFetchText(source.url, { timeoutMs: 10000 });
    const parsed = await parser.parseString(rawXml);
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Koneksi berhasil! Ditemukan ${parsed.items?.length || 0} entri feed dalam ${durationMs}ms.`,
      feedTitle: parsed.title || "Tanpa Judul",
      itemCount: parsed.items?.length || 0,
      durationMs,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Uji koneksi gagal: ${err.message}`,
      },
      { status: 400 }
    );
  }
}


export async function generateStaticParams() {
  return [];
}
