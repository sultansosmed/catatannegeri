export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { userSchema } from "@/lib/validations";
import { canManageUsers } from "@/lib/rbac";
import { generateSlug } from "@/lib/slug";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageUsers(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { authorProfile: true },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      authorProfile: u.authorProfile,
      createdAt: u.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageUsers(user.role)) {
    return NextResponse.json({ error: "Hanya Super Admin yang dapat membuat pengguna baru." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = userSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Data pengguna tidak valid." },
        { status: 400 }
      );
    }

    const { name, email, password, role, isActive, authorTitle, authorBio } = result.data;

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Surel ini sudah terdaftar." }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Kata sandi wajib minimal 8 karakter." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const authorSlug = generateSlug(name) + "-" + Date.now().toString().slice(-4);

    const newUser = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        isActive,
        authorProfile: {
          create: {
            displayName: name,
            slug: authorSlug,
            title: authorTitle || (role === "EDITOR" ? "Editor" : "Jurnalis"),
            bio: authorBio || null,
          },
        },
      },
      include: { authorProfile: true },
    });

    await logAuditEvent({
      userId: user.id,
      action: "USER_CREATED",
      entityType: "User",
      entityId: newUser.id,
      details: { email: newUser.email, role: newUser.role },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membuat pengguna." }, { status: 500 });
  }
}

