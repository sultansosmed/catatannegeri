export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/rbac";
import { generateSlug } from "@/lib/slug";

export async function GET() {
  const authors = await db.authorProfile.findMany({
    orderBy: { displayName: "asc" },
    include: {
      user: { select: { email: true, role: true } },
      _count: { select: { articles: true } },
    },
  });
  return NextResponse.json({ authors });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageUsers(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { userId, displayName, slug, title, bio, avatar, socialTwitter, socialLinkedin } = await req.json();

    if (!userId || !displayName) {
      return NextResponse.json({ error: "Akun pengguna dan Nama Tampilan wajib diisi." }, { status: 400 });
    }

    const finalSlug = slug ? generateSlug(slug) : generateSlug(displayName);

    const existing = await db.authorProfile.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return NextResponse.json({ error: "Slug jurnalis ini sudah digunakan." }, { status: 400 });
    }

    const profile = await db.authorProfile.create({
      data: {
        userId,
        displayName,
        slug: finalSlug,
        title: title || "Jurnalis Catatan Negeri",
        bio: bio || null,
        avatar: avatar || null,
        socialTwitter: socialTwitter || null,
        socialLinkedin: socialLinkedin || null,
        isPublic: true,
      },
    });

    return NextResponse.json({ success: true, author: profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

