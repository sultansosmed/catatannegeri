export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canPublish } from "@/lib/rbac";
import { db } from "@/lib/db";
import { convertIngestedToDraft } from "@/lib/news-pipeline";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canPublish(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { ingestedItemId, categoryId } = await req.json();

    if (!ingestedItemId || !categoryId) {
      return NextResponse.json({ error: "Item dan kategori wajib dipilih." }, { status: 400 });
    }

    const authorProfile = user.authorProfile || (await db.authorProfile.findFirst());
    if (!authorProfile) {
      return NextResponse.json({ error: "Profil jurnalis tidak ditemukan." }, { status: 400 });
    }

    const draft = await convertIngestedToDraft({
      ingestedItemId,
      categoryId,
      authorProfileId: authorProfile.id,
      userId: user.id,
    });

    return NextResponse.json({ success: true, articleId: draft.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengonversi ke draf." }, { status: 500 });
  }
}

