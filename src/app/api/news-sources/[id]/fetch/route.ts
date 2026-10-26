export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canPublish } from "@/lib/rbac";
import { executeSourceIngestion } from "@/lib/ingestion-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canPublish(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const stats = await executeSourceIngestion({
      sourceId: id,
      userId: user.id,
      maxItems: 50,
    });

    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal melakukan penarikan berita." }, { status: 500 });
  }
}


export async function generateStaticParams() {
  return [];
}
