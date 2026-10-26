export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signSessionToken, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase(), isActive: true },
      include: { authorProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Surel atau kata sandi tidak cocok." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Surel atau kata sandi tidak cocok." },
        { status: 401 }
      );
    }

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      authorProfileId: user.authorProfile?.id,
    });

    await setSessionCookie(token);

    // Audit log
    await logAuditEvent({
      userId: user.id,
      action: "USER_LOGIN_SUCCESS",
      entityType: "User",
      entityId: user.id,
      details: { email: user.email },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada sistem otentikasi." }, { status: 500 });
  }
}

