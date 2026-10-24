import React from "react";
import { db } from "@/lib/db";
import { AuthorManager } from "@/components/admin/AuthorManager";

export default async function AdminAuthorsPage() {
  const authors = await db.authorProfile.findMany({
    orderBy: { displayName: "asc" },
    include: {
      user: { select: { email: true, role: true } },
      _count: { select: { articles: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Integritas Jurnalisme (E-E-A-T)
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Manajemen Profil Penulis & Jurnalis
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Data biografi jurnalis asli, spesialisasi desk, dan tautan portofolio artikel publik dengan kemampuan sunting profil.
          </p>
        </div>
      </div>

      <AuthorManager initialAuthors={authors} />
    </div>
  );
}
