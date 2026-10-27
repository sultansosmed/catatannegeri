export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageIntegrations } from "@/lib/rbac";
import { validateSafeUrl } from "@/lib/network-safety";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const source = await db.ingestionSource.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });

  if (!source) {
    return NextResponse.json({ error: "Sumber tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ source });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canManageIntegrations(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
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

    if (url) {
      const safeCheck = await validateSafeUrl(url);
      if (!safeCheck.isSafe) {
        return NextResponse.json({ error: `URL ditolak oleh sistem keamanan SSRF: ${safeCheck.reason}` }, { status: 400 });
      }
    }

    const updated = await db.ingestionSource.update({
      where: { id },
      data: {
        name,
        websiteUrl,
        type,
        url,
        authType,
        authSecretEnvKey,
        pollingInterval: typeof pollingInterval === "number" ? pollingInterval : parseInt(pollingInterval || "30", 10),
        allowedCategories,
        licenseNotes,
        isActive,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "NEWS_SOURCE_UPDATED",
      entityType: "IngestionSource",
      entityId: id,
      details: { name: updated.name, isActive: updated.isActive },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return NextResponse.json({ success: true, source: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memperbarui sumber." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canManageIntegrations(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await db.ingestionSource.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "NEWS_SOURCE_DELETED",
      entityType: "IngestionSource",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghapus sumber." }, { status: 500 });
  }
}


export async function generateStaticParams() {
  return [];
}
