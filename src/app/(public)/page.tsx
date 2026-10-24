import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Sidebar } from "@/components/public/Sidebar";
import { AdBanner } from "@/components/public/AdBanner";
import { ArrowRight, Newspaper, Flame, Compass } from "lucide-react";

export const revalidate = 60; // On-demand revalidation ISR every 60s

export default async function HomePage() {
  // 1. Fetch Featured Hero Article
  const featuredArticle = await db.article.findFirst({
    where: { status: "PUBLISHED", isFeatured: true },
    orderBy: { publishedAt: "desc" },
    include: { category: true, author: true },
  });

  // 2. Fetch Top Stories (3 articles next to or below hero)
  const topStories = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      id: featuredArticle ? { not: featuredArticle.id } : undefined,
    },
    take: 4,
    orderBy: { publishedAt: "desc" },
    include: { category: true, author: true },
  });

  // 3. Fetch Latest News (stream of recent articles)
  const excludeIds = [
    ...(featuredArticle ? [featuredArticle.id] : []),
    ...topStories.map((a) => a.id),
  ];

  const latestNews = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: excludeIds },
    },
    take: 8,
    orderBy: { publishedAt: "desc" },
    include: { category: true, author: true },
  });

  // 4. Fetch Popular / Most Read (by viewCount)
  const popularArticles = await db.article.findMany({
    where: { status: "PUBLISHED" },
    take: 5,
    orderBy: { viewCount: "desc" },
    include: { category: true },
  });

  // 5. Fetch Editor's Picks
  const editorPicks = await db.article.findMany({
    where: { status: "PUBLISHED", isEditorPick: true },
    take: 4,
    orderBy: { publishedAt: "desc" },
    include: { category: true, author: true },
  });

  // 6. Fetch Trending Tags
  const tags = await db.tag.findMany({
    take: 8,
    orderBy: { articles: { _count: "desc" } },
  });

  // 7. Fetch Site Ad Settings
  const adTopSetting = await db.siteSetting.findUnique({ where: { key: "ad_homepage_top_html" } });
  const adTopEnabled = (await db.siteSetting.findUnique({ where: { key: "ad_homepage_top_enabled" } }))?.value === "true";

  const adSidebarSetting = await db.siteSetting.findUnique({ where: { key: "ad_sidebar_html" } });
  const adSidebarEnabled = (await db.siteSetting.findUnique({ where: { key: "ad_sidebar_enabled" } }))?.value === "true";

  // 8. Fetch Category-Specific Highlights: Ekonomi, Teknologi, Nasional
  const ekonomiCategory = await db.category.findUnique({ where: { slug: "ekonomi" } });
  const ekonomiArticles = ekonomiCategory
    ? await db.article.findMany({
        where: { categoryId: ekonomiCategory.id, status: "PUBLISHED" },
        take: 3,
        orderBy: { publishedAt: "desc" },
        include: { category: true, author: true },
      })
    : [];

  const teknologiCategory = await db.category.findUnique({ where: { slug: "teknologi" } });
  const teknologiArticles = teknologiCategory
    ? await db.article.findMany({
        where: { categoryId: teknologiCategory.id, status: "PUBLISHED" },
        take: 3,
        orderBy: { publishedAt: "desc" },
        include: { category: true, author: true },
      })
    : [];

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Homepage Banner Ad */}
      {adTopEnabled && (
        <AdBanner
          placement="homepage_top"
          html={adTopSetting?.value}
          enabled={adTopEnabled}
          className="mb-6"
        />
      )}

      {/* Hero & Top Stories Section */}
      <section className="mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Hero (7 cols) */}
          <div className="lg:col-span-7">
            {featuredArticle ? (
              <ArticleCard article={featuredArticle} variant="featured" priority={true} />
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-12 text-center text-slate-500">
                <Newspaper className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <p>Belum ada berita utama yang disematkan.</p>
              </div>
            )}
          </div>

          {/* Top Stories Grid (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="border-b-2 border-brand-red pb-2 flex items-center justify-between">
              <span className="font-serif font-bold text-lg text-brand-navy flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-brand-red" />
                Sorotan Utama
              </span>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Kurasi Redaksi
              </span>
            </div>

            <div className="space-y-3">
              {topStories.map((art) => (
                <ArticleCard key={art.id} article={art} variant="horizontal" />
              ))}
              {topStories.length === 0 && (
                <p className="text-xs text-slate-400 italic p-4">Sedang memutakhirkan laporan terkini...</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Latest News Feed + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Latest News & Category Blocks (8 cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Latest News Feed */}
          <section>
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-6">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-navy flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-brand-red" />
                Kabar Terkini Nusantara
              </h2>
              <span className="text-xs text-slate-500">Liputan 24 Jam</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {latestNews.map((art) => (
                <ArticleCard key={art.id} article={art} variant="standard" />
              ))}
            </div>

            {latestNews.length === 0 && (
              <div className="text-center py-10 bg-slate-50 rounded-lg text-slate-500 text-sm">
                Tidak ada artikel terbaru saat ini.
              </div>
            )}
          </section>

          {/* Category Highlight: Ekonomi & Bisnis */}
          {ekonomiArticles.length > 0 && (
            <section className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-300 pb-3 mb-5">
                <h3 className="font-serif text-xl font-bold text-brand-navy flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-brand-red inline-block rounded-sm"></span>
                  Ekonomi & Keuangan
                </h3>
                <Link
                  href="/ekonomi"
                  className="text-xs font-semibold text-brand-red hover:underline flex items-center gap-1"
                >
                  Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ekonomiArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} variant="standard" />
                ))}
              </div>
            </section>
          )}

          {/* Category Highlight: Teknologi & Sains */}
          {teknologiArticles.length > 0 && (
            <section className="border border-slate-200 rounded-xl p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
                <h3 className="font-serif text-xl font-bold text-brand-navy flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-brand-navy inline-block rounded-sm"></span>
                  Teknologi & Digital
                </h3>
                <Link
                  href="/teknologi"
                  className="text-xs font-semibold text-brand-navy hover:underline flex items-center gap-1"
                >
                  Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {teknologiArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} variant="standard" />
                ))}
              </div>
            </section>
          )}

          {/* Editorial Principles Callout */}
          <section className="bg-brand-navy text-white rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-brand-red-light text-xs font-bold uppercase tracking-widest">
                <Compass className="w-4 h-4" />
                Jurnalisme Terpercaya
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold">
                Komitmen Catatan Negeri: Fakta Teruji, Bebas Sensasionalisme
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Setiap berita yang kami publikasikan melalui proses verifikasi ganda, konfirmasi narasumber resmi, dan kepatuhan ketat pada Kode Etik Jurnalistik serta Pedoman Media Siber.
              </p>
            </div>
            <Link
              href="/pedoman-media-siber"
              className="bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs px-5 py-3 rounded-lg whitespace-nowrap transition-colors shadow"
            >
              Pedoman Kami
            </Link>
          </section>
        </div>

        {/* Right Column: Sticky Sidebar (4 cols) */}
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

