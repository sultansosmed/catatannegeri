import React from "react";
import { db } from "@/lib/db";
import { NewsSourceManager } from "@/components/admin/NewsSourceManager";

export const metadata = {
  title: "Sumber Berita & Feed Eksternal | Catatan Negeri Admin",
};

export default async function AdminNewsSourcesPage() {
  const sources = await db.ingestionSource.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Pipeline Agregasi & Integrasi Data
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Manajemen Sumber Berita Eksternal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi feed resmi, siaran pers kementerian, dan API berlisensi. Dilindungi validasi keamanan SSRF dan kebijakan deduplikasi otomatis.
          </p>
        </div>
      </div>

      <NewsSourceManager initialSources={sources as any} />
    </div>
  );
}

