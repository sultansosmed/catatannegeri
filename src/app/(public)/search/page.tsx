import React from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { Search as SearchIcon, AlertCircle } from "lucide-react";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  return {
    title: query ? `Hasil Pencarian: "${query}" — Catatan Negeri` : "Pencarian Berita — Catatan Negeri",
    description: "Cari arsip berita, analisis investigasi, dan laporan terkini di Catatan Negeri.",
    robots: {
      index: false, // Disallow search engine indexing of internal query results
      follow: true,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  let articles: any[] = [];
  if (query) {
    articles = await db.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { summary: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          {
            tags: {
              some: {
                tag: {
                  name: { contains: query, mode: "insensitive" },
                },
              },
            },
          },
        ],
      },
      take: 20,
      orderBy: { publishedAt: "desc" },
      include: { category: true, author: true },
    });
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={[{ name: "Pencarian", url: "/search" }]} />

      <div className="max-w-3xl mx-auto py-6">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-extrabold text-brand-navy mb-2">
            Pencarian Arsip Berita
          </h1>
          <p className="text-sm text-slate-600">
            Temukan berita, topik kebijakan, regulasi, dan arsip liputan Catatan Negeri.
          </p>
        </div>

        {/* Search Bar Form */}
        <form action="/search" method="GET" className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Masukkan kata kunci pencarian..."
              required
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red shadow-sm"
            />
            <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          </div>
          <button
            type="submit"
            className="bg-brand-navy hover:bg-brand-red text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors shadow-sm"
          >
            Cari
          </button>
        </form>

        {query && (
          <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center text-xs text-slate-500">
            <span>
              Menampilkan hasil untuk: <strong className="text-slate-900 font-semibold">"{query}"</strong>
            </span>
            <span>{articles.length} artikel ditemukan</span>
          </div>
        )}

        {query && articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((art) => (
              <ArticleCard key={art.id} article={art} variant="horizontal" />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="font-serif font-bold text-base text-slate-700 mb-1">
              Tidak Ada Berita Ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada artikel yang cocok dengan kata kunci "{query}". Coba gunakan kata kunci umum seperti "ekonomi", "teknologi", atau nama tokoh.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

