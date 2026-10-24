import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageSettings } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const settings = await db.siteSetting.findMany({
    where: {
      key: {
        in: [
          "seo_meta_title_template",
          "seo_default_description",
          "seo_google_site_verification",
          "seo_google_analytics_id",
          "seo_default_og_image",
          "seo_bing_site_verification",
        ],
      },
    },
  });

  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return NextResponse.json({ seo: map });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageSettings(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
      action: "SEO_CONFIG_UPDATED",
      entityType: "SiteSetting",
      details: { updatedKeys: Object.keys(body) },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return NextResponse.json({ success: true, message: "Konfigurasi SEO berhasil disimpan." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menyimpan SEO." }, { status: 500 });
  }
}

