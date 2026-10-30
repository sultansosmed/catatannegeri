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
    const results = await executeAllSourcesIngestion({
      userId: user.id,
      maxItemsPerSource: 10,
      autoDraft: true,
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses ${results.totalSources} sumber media nasional.`,
      ...results,
    });
  } catch (err: any) {
    console.error("Ingestion fetch error:", err);
    return NextResponse.json({ error: err.message || "Gagal mengambil data dari feed." }, { status: 500 });
  }
}
