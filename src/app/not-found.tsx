import React from "react";
import Link from "next/link";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { db } from "@/lib/db";
import { FileQuestion, Home, Search } from "lucide-react";

export default async function NotFound() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Header categories={categories} />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mb-6">
          <FileQuestion className="w-10 h-10" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-brand-red mb-2">
          Kesalahan 404 — Halaman Tidak Ditemukan
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-navy mb-4">
          Halaman yang Anda Cari Tidak Tersedia
        </h1>

        <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed mb-8">
          Tautan yang Anda ikuti mungkin telah kedaluwarsa, dipindahkan, atau artikel telah diperbarui ke tautan kanonikal yang baru oleh tim redaksi Catatan Negeri.
        </p>

        {/* Search Bar inside 404 */}
        <form action="/search" method="GET" className="w-full max-w-md flex gap-2 mb-8">
          <input
            type="text"
            name="q"
            placeholder="Cari topik atau judul berita..."
            className="flex-1 px-4 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-brand-red"
          />
          <button
            type="submit"
            className="bg-brand-navy hover:bg-brand-red text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Cari
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <Link
            href="/nasional"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-lg transition-colors"
          >
            Lihat Berita Nasional
          </Link>
        </div>
      </main>

      <Footer categories={categories} />
    </div>
  );
}

