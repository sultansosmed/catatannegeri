export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = newsletterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Format email tidak valid" },
        { status: 400 }
      );
    }

    const { email } = result.data;

    await db.newsletterSubscriber.upsert({
      where: { email: email.toLowerCase() },
      update: { isActive: true, unsubscribedAt: null },
      create: { email: email.toLowerCase() },
    });

    return NextResponse.json({ success: true, message: "Berhasil berlangganan buletin Catatan Negeri" });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Terjadi gangguan saat mendaftar" }, { status: 500 });
  }
}

