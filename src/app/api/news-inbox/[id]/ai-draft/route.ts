export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canPublish } from "@/lib/rbac";
import { generateAiNewsDraft } from "@/lib/ai-news-draft";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canPublish(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const draftResult = await generateAiNewsDraft(id);

    // Update IngestedItem with the generated AI draft payload
    const updatedItem = await db.ingestedItem.update({
      where: { id },
      data: {
        status: "DRAFT_GENERATED",
        aiDraftTitle: draftResult.headline,
        aiDraftAlternativeTitles: JSON.stringify(draftResult.alternativeHeadlines),
        aiDraftSummary: draftResult.summary,
        aiDraftOutline: draftResult.outline,
        aiDraftContent: draftResult.articleBodyHtml,
        aiRecommendedCategory: draftResult.recommendedCategory,
        aiRecommendedTags: JSON.stringify(draftResult.recommendedTags),
        aiMetaTitle: draftResult.seoTitle,
        aiMetaDescription: draftResult.metaDescription,
        aiSuggestedInternalLinks: JSON.stringify(draftResult.internalLinkSuggestions),
        aiVerificationClaims: JSON.stringify(draftResult.verificationClaims),
        aiQualityAudit: JSON.stringify(draftResult.qualityAudit),
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "AI_DRAFT_GENERATED",
      entityType: "IngestedItem",
      entityId: id,
      details: { title: draftResult.headline },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return NextResponse.json({
      success: true,
      draft: draftResult,
      item: updatedItem,
    });
  } catch (err: any) {
    console.error("AI Draft error:", err);
    return NextResponse.json({ error: err.message || "Gagal membuat draf AI." }, { status: 500 });
  }
}


export async function generateStaticParams() {
  return [];
}
