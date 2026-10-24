import React from "react";
import { db } from "@/lib/db";
import { TagManager } from "@/components/admin/TagManager";

export default async function AdminTagsPage() {
  const tags = await db.tag.findMany({
    orderBy: { articles: { _count: "desc" } },
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
            Topik Pembahasan
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Manajemen Topik & Tag Berita
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Label taksonomi dinamis untuk pengelompokan berita dan tautan internal (internal linking).
          </p>
        </div>
      </div>

      <TagManager initialTags={tags} />
    </div>
  );
}
