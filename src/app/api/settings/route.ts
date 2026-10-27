export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageSettings } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const settings = await db.siteSetting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return NextResponse.json({ settings: map });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageSettings(user.role)) {
    return NextResponse.json({ error: "Hanya Super Admin yang berhak mengubah pengaturan situs." }, { status: 403 });
  }

  try {
    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        await db.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }

    await logAuditEvent({
      userId: user.id,
      action: "SITE_SETTINGS_UPDATED",
      entityType: "SiteSetting",
      details: { keysUpdated: Object.keys(body) },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return NextResponse.json({ success: true, message: "Pengaturan berhasil diperbarui." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menyimpan pengaturan." }, { status: 500 });
  }
}

