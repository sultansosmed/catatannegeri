export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/rbac";
import { generateSlug } from "@/lib/slug";

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
    const { displayName, slug, title, bio, avatar, socialTwitter, socialLinkedin, isPublic } = await req.json();

    const finalSlug = slug ? generateSlug(slug) : undefined;

    const profile = await db.authorProfile.update({
      where: { id },
      data: {
        displayName,
        slug: finalSlug,
        title,
        bio,
        avatar,
        socialTwitter,
        socialLinkedin,
        isPublic,
      },
    });

    return NextResponse.json({ success: true, author: profile });
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
  try {
    const articleCount = await db.article.count({ where: { authorId: id } });
    if (articleCount > 0) {
      return NextResponse.json(
        { error: `Profil jurnalis ini masih terhubung dengan ${articleCount} artikel.` },
        { status: 400 }
      );
    }

    await db.authorProfile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}


export async function generateStaticParams() {
  return [];
}
