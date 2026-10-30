export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canPublish } from "@/lib/rbac";
import { executeAllSourcesIngestion } from "@/lib/ingestion-service";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canPublish(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const autoDraft = searchParams.get("autoDraft") !== "false";

    const results = await executeAllSourcesIngestion({
      userId: user.id,
      maxItemsPerSource: limit,
      autoDraft,
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses ${results.totalSources} sumber media nasional. Ditemukan ${results.totalNewDiscovered} berita baru, ${results.totalDraftsGenerated} draft AI tersusun.`,
      ...results,
    });
  } catch (err: any) {
    console.error("Sync all national news error:", err);
    return NextResponse.json({ error: err.message || "Gagal sinkronisasi berita nasional." }, { status: 500 });
  }
}
