import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { canManageUsers } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";
import { Role } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canManageUsers(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const { name, role, isActive, password } = await req.json();

    const data: any = { name, role: role as Role, isActive };
    if (password && password.length >= 8) {
      data.passwordHash = await hashPassword(password);
    }

    const updated = await db.user.update({
      where: { id },
      data,
      include: { authorProfile: true },
    });

    await logAuditEvent({
      userId: user.id,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: id,
      details: { role: updated.role, isActive: updated.isActive },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canManageUsers(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: "Anda tidak dapat menghapus akun Anda sendiri." }, { status: 400 });
  }

  try {
    await db.user.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "USER_DELETED",
      entityType: "User",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

