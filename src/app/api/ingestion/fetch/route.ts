export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canPublish } from "@/lib/rbac";
import { db } from "@/lib/db";
import { ingestFromRssSource } from "@/lib/news-pipeline";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canPublish(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const sources = await db.ingestionSource.findMany({
      where: { isActive: true },
    });

    const results = [];
    for (const source of sources) {
      const res = await ingestFromRssSource(source.id);
      results.push(res);
    }

    await logAuditEvent({
      userId: user.id,
      action: "NEWS_INGESTION_RUN",
      entityType: "IngestionSource",
      details: results,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("Ingestion fetch error:", err);
    return NextResponse.json({ error: err.message || "Gagal mengambil data dari feed." }, { status: 500 });
  }
}

