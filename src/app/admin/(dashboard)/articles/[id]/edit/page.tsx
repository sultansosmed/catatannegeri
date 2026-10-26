import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ArticleEditor } from "@/components/admin/ArticleEditor";

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [];
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  const [article, categories, authors, tags] = await Promise.all([
    db.article.findUnique({
      where: { id },
      include: {
        category: true,
        author: true,
        tags: { select: { tagId: true } },
      },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    db.authorProfile.findMany({
      where: { isPublic: true },
      select: { id: true, displayName: true },
    }),
    db.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <ArticleEditor
      initialData={article}
      categories={categories}
      authors={authors}
      tags={tags}
      userRole={user?.role || "AUTHOR"}
    />
  );
}

