import React from "react";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NewsReviewStudio } from "@/components/admin/NewsReviewStudio";

export const metadata = {
  title: "Studio Tinjauan & Kurasi Berita | Catatan Negeri Admin",
};

interface NewsInboxDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminNewsInboxDetailPage({ params }: NewsInboxDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const [item, categories, authors] = await Promise.all([
    db.ingestedItem.findUnique({
      where: { id },
      include: {
        source: true,
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
    }),
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    db.authorProfile.findMany({
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true },
    }),
  ]);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <NewsReviewStudio
        item={item as any}
        categories={categories}
        authors={authors}
        currentUserId={user.id}
      />
    </div>
  );
}
