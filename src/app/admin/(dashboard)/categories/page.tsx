import React from "react";
import { db } from "@/lib/db";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { articles: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Struktur Taksonomi
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Manajemen Kategori Berita
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            20 Kanal utama editorial Catatan Negeri yang terindeks secara kanonikal dengan kemampuan tambah dan sunting.
          </p>
        </div>
      </div>

      <CategoryManager initialCategories={categories} />
    </div>
  );
}
