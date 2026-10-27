export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirectSchema } from "@/lib/validations";
import { canManageRedirects } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageRedirects(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const redirects = await db.redirect.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ redirects });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageRedirects(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = redirectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message || "Invalid" }, { status: 400 });
    }

    const { sourcePath, destinationPath, statusCode, isActive } = result.data;

    // Check loops
    if (sourcePath === destinationPath) {
      return NextResponse.json({ error: "Source path dan Destination path tidak boleh sama (menghindari redirect loop)." }, { status: 400 });
    }

    const rec = await db.redirect.upsert({
      where: { sourcePath },
      update: { destinationPath, statusCode, isActive },
      create: { sourcePath, destinationPath, statusCode, isActive },
    });

    await logAuditEvent({
      userId: user.id,
      action: "REDIRECT_CREATED",
      entityType: "Redirect",
      entityId: rec.id,
      details: { sourcePath, destinationPath, statusCode },
    });

    return NextResponse.json({ success: true, redirect: rec });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

