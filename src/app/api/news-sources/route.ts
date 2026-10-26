export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageIntegrations } from "@/lib/rbac";
import { validateSafeUrl } from "@/lib/network-safety";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await db.ingestionSource.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({ sources });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageIntegrations(user.role)) {
    return NextResponse.json({ error: "Hanya Super Admin yang berhak menambah sumber berita eksternal." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      websiteUrl,
      type,
      url,
      authType,
      authSecretEnvKey,
      pollingInterval,
      allowedCategories,
      licenseNotes,
      isActive,
    } = body;

    if (!name || !url) {
      return NextResponse.json({ error: "Nama sumber dan URL feed wajib diisi." }, { status: 400 });
    }

    // SSRF verification
    const safeCheck = await validateSafeUrl(url);
    if (!safeCheck.isSafe) {
      return NextResponse.json({ error: `URL ditolak oleh sistem keamanan SSRF: ${safeCheck.reason}` }, { status: 400 });
    }

    const source = await db.ingestionSource.create({
      data: {
        name,
        websiteUrl: websiteUrl || null,
        type: type || "RSS",
        url,
        authType: authType || "NONE",
        authSecretEnvKey: authSecretEnvKey || null,
        pollingInterval: parseInt(pollingInterval || "30", 10),
        allowedCategories: allowedCategories || null,
        licenseNotes: licenseNotes || null,
        isActive: isActive !== false,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "NEWS_SOURCE_CREATED",
      entityType: "IngestionSource",
      entityId: source.id,
      details: { name: source.name, url: source.url },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return NextResponse.json({ success: true, source });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membuat sumber berita." }, { status: 500 });
  }
}

