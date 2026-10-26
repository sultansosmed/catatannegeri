import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Sidebar } from "@/components/public/Sidebar";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ChevronLeft, ChevronRight, Folder } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await db.category.findUnique({
    where: { slug: categorySlug, isActive: true },
  });

  if (!category) return {};

  const title = category.metaTitle || `Berita ${category.name} Terkini — Catatan Negeri`;
  const description = category.metaDescription || category.description || `Kumpulan berita, analisis mendalam, dan informasi seputar ${category.name} di Catatan Negeri.`;
  const canonicalUrl = `${SITE_URL}/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const { page } = await searchParams;

  const category = await db.category.findUnique({
    where: { slug: categorySlug, isActive: true },
  });

  if (!category) {
    notFound();
  }

  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  const [articles, totalArticles] = await Promise.all([
    db.article.findMany({
      where: {
        categoryId: category.id,
        status: "PUBLISHED",
      },
      skip,
      take: pageSize,
      orderBy: { publishedAt: "desc" },
      include: { category: true, author: true },
    }),
    db.article.count({
      where: {
        categoryId: category.id,
        status: "PUBLISHED",
      },
    }),
  ]);

  const totalPages = Math.ceil(totalArticles / pageSize);

  // Fetch sidebar data
  const popularArticles = await db.article.findMany({
    where: { status: "PUBLISHED" },
    take: 5,
    orderBy: { viewCount: "desc" },
    include: { category: true },
  });

  const editorPicks = await db.article.findMany({
    where: { status: "PUBLISHED", isEditorPick: true },
    take: 4,
    orderBy: { publishedAt: "desc" },
    include: { category: true, author: true },
  });

  const tags = await db.tag.findMany({
    take: 8,
    orderBy: { articles: { _count: "desc" } },
  });

  const adSidebarSetting = await db.siteSetting.findUnique({ where: { key: "ad_sidebar_html" } });
  const adSidebarEnabled = (await db.siteSetting.findUnique({ where: { key: "ad_sidebar_enabled" } }))?.value === "true";

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={[{ name: category.name, url: `/${category.slug}` }]} />

      {/* Category Header */}
      <div className="border-b-2 border-brand-navy pb-4 mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-red flex items-center gap-1.5 mb-1">
          <Folder className="w-3.5 h-3.5" />
          Kanal Redaksi
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-navy">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Category Feed */}
        <div className="lg:col-span-8">
          {articles.length > 0 ? (
            <div className="space-y-4">
              {articles.map((art: any) => (
                <ArticleCard key={art.id} article={art} variant="horizontal" />
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
              <Folder className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-serif text-lg font-bold text-slate-700 mb-1">
                Belum Ada Artikel di Kanal {category.name}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tim redaksi sedang mempersiapkan liputan dan laporan terverifikasi untuk kategori ini. Silakan periksa kembali beberapa saat lagi.
              </p>
            </div>
          )}

          {/* Crawlable Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Navigasi Halaman"
              className="flex items-center justify-between border-t border-slate-200 pt-6 mt-8 text-xs font-medium"
            >
              <div>
                {currentPage > 1 ? (
                  <Link
                    href={`/${category.slug}?page=${currentPage - 1}`}
                    className="flex items-center gap-1 px-3 py-2 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-2 rounded border border-slate-200 text-slate-300 cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </span>
                )}
              </div>

              <div className="text-slate-600">
                Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari{" "}
                <span className="font-bold text-slate-900">{totalPages}</span>
              </div>

              <div>
                {currentPage < totalPages ? (
                  <Link
                    href={`/${category.slug}?page=${currentPage + 1}`}
                    className="flex items-center gap-1 px-3 py-2 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-2 rounded border border-slate-200 text-slate-300 cursor-not-allowed">
                    Selanjutnya
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </div>
            </nav>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <Sidebar
            popularArticles={popularArticles}
            editorPicks={editorPicks}
            tags={tags}
            adHtml={adSidebarSetting?.value}
            adEnabled={adSidebarEnabled}
          />
        </div>
      </div>
    </main>
  );
}

