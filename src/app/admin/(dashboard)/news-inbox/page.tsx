import React from "react";
import { db } from "@/lib/db";
import { NewsInboxManager } from "@/components/admin/NewsInboxManager";
import Link from "next/link";
import { Radio, Plus } from "lucide-react";

export const metadata = {
  title: "Kotak Masuk Berita & Antrean Review | Catatan Negeri Admin",
};

export default async function AdminNewsInboxPage() {
  const [items, sources] = await Promise.all([
    db.ingestedItem.findMany({
      orderBy: { discoveredAt: "desc" },
      include: {
        source: {
          select: { id: true, name: true, type: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
      take: 100,
    }),
    db.ingestionSource.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Pusat Peninjauan Redaksi (Newsroom Inbox)
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Kotak Masuk & Kurasi Berita
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau informasi masuk, jalankan deteksi duplikasi otomatis, susun draf berita berbasis AI beretika, dan tinjau fakta sebelum publikasi resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/news-sources"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Radio className="w-4 h-4 text-brand-navy" />
            <span>Kelola Sumber Berita</span>
          </Link>
        </div>
      </div>

      <NewsInboxManager initialItems={items as any} sources={sources} />
    </div>
  );
}

