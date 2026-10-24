import React from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ArticleEditor } from "@/components/admin/ArticleEditor";

export default async function NewArticlePage() {
  const user = await getCurrentUser();

  const [categories, authors, tags] = await Promise.all([
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

  return (
    <ArticleEditor
      categories={categories}
      authors={authors}
      tags={tags}
      userRole={user?.role || "AUTHOR"}
    />
  );
}

