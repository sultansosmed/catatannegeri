export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canPublish } from "@/lib/rbac";
import { executeAllSourcesIngestion } from "@/lib/ingestion-service";

async function handleSync(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  const isCronAuthorized = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!isCronAuthorized) {
    const user = await getCurrentUser();
    if (!user || !canPublish(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const autoDraft = searchParams.get("autoDraft") !== "false";
    const autoPublish = searchParams.get("autoPublish") !== "false"; // Defaults to true (100% full autopilot)

    const results = await executeAllSourcesIngestion({
      maxItemsPerSource: limit,
      autoDraft,
      autoPublish,
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses ${results.totalSources} sumber media nasional. Ditemukan ${results.totalNewDiscovered} berita baru, ${results.totalAutoPublished} artikel langsung diterbitkan secara otomatis.`,
      ...results,
    });
  } catch (err: any) {
    console.error("Auto-pilot sync error:", err);
    return NextResponse.json({ error: err.message || "Gagal menjalankan auto-pilot berita nasional." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}
