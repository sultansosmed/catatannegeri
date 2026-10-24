import React from "react";
import { db } from "@/lib/db";
import { RedirectManager } from "@/components/admin/RedirectManager";

export default async function AdminRedirectsPage() {
  const redirects = await db.redirect.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Kesehatan Teknis SEO & Tautan
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Manajemen Pengalihan URL (Redirects)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mencegah tautan rusak (404), mempertahankan otoritas link (PageRank), dan mengelola redirect 301 otomatis.
          </p>
        </div>
      </div>

      <RedirectManager initialRedirects={redirects} />
    </div>
  );
}
