import React from "react";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { TableOfContents } from "@/components/public/TableOfContents";
import { ShareButtons } from "@/components/public/ShareButtons";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Sidebar } from "@/components/public/Sidebar";
import { AdBanner } from "@/components/public/AdBanner";
import { generateNewsArticleSchema, generateFaqSchema, SITE_URL } from "@/lib/seo";
import { getCategoryVisual } from "@/lib/category-images";
import {
  Clock,
  User,
  Calendar,
  RefreshCw,
  ShieldCheck,
  FileText,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ArticlePageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;

  const article = await db.article.findUnique({
    where: { slug },
    include: { category: true, author: true },
  });

  if (!article || article.status !== "PUBLISHED") {
    return {};
  }

  const title = article.metaTitle || `${article.title} — Catatan Negeri`;
  const description = article.metaDescription || article.summary;
  const canonicalUrl = article.canonicalUrl || `${SITE_URL}/${article.category.slug}/${article.slug}`;
  const categoryVisual = getCategoryVisual(article.category.slug);
  const heroImage =
    article.featuredImage && !article.featuredImage.includes("og-default.png")
      ? article.featuredImage
      : categoryVisual.image;
  const ogImage = heroImage.startsWith("http") ? heroImage : `${SITE_URL}${heroImage}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !article.noIndex,
      follow: !article.noIndex,
    },
    openGraph: {
      type: "article",
      locale: "id_ID",
      url: canonicalUrl,
      title,
      description,
      publishedTime: article.publishedAt ? article.publishedAt.toISOString() : undefined,
      modifiedTime: article.updatedAt.toISOString(),
      section: article.category.name,
      authors: [article.author.displayName],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.imageAlt || article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category: categorySlug, slug } = await params;

  // 1. Fetch the article with category, author, tags
  const article = await db.article.findUnique({
    where: { slug },
    include: {
      category: true,
      author: true,
      tags: { include: { tag: true } },
    },
  });

  // Check if article exists and is published
  if (!article || article.status !== "PUBLISHED") {
    // Check if there is a permanent redirect configured for this path
    const targetPath = `/${categorySlug}/${slug}`;
    const redirectRecord = await db.redirect.findUnique({
      where: { sourcePath: targetPath, isActive: true },
    });

    if (redirectRecord) {
      // Increment hit count
      await db.redirect.update({
        where: { id: redirectRecord.id },
        data: { hitCount: { increment: 1 } },
      });
      redirect(redirectRecord.destinationPath);
    }

    notFound();
  }

  // Canonical category match check: if URL category doesn't match article.category.slug, redirect permanently
  if (article.category.slug !== categorySlug) {
    redirect(`/${article.category.slug}/${article.slug}`);
  }

  // Atomically increment viewCount asynchronously
  try {
    await db.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });
  } catch (err) {
    // Non-blocking view increment
  }

  // Fetch adjacent articles (previous & next)
  const [prevArticle, nextArticle] = await Promise.all([
    db.article.findFirst({
      where: {
        status: "PUBLISHED",
        publishedAt: article.publishedAt ? { lt: article.publishedAt } : undefined,
      },
      orderBy: { publishedAt: "desc" },
      select: { title: true, slug: true, category: { select: { slug: true } } },
    }),
    db.article.findFirst({
      where: {
        status: "PUBLISHED",
        publishedAt: article.publishedAt ? { gt: article.publishedAt } : undefined,
      },
      orderBy: { publishedAt: "asc" },
      select: { title: true, slug: true, category: { select: { slug: true } } },
    }),
  ]);

  // Fetch related articles (same category, excluding current)
  const relatedArticles = await db.article.findMany({
    where: {
      categoryId: article.categoryId,
      status: "PUBLISHED",
      id: { not: article.id },
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
    include: { category: true, author: true },
  });

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

  const trendingTags = await db.tag.findMany({
    take: 8,
    orderBy: { articles: { _count: "desc" } },
  });

  // Ads
  const adInContentSetting = await db.siteSetting.findUnique({ where: { key: "ad_in_content_html" } });
  const adInContentEnabled = (await db.siteSetting.findUnique({ where: { key: "ad_in_content_enabled" } }))?.value === "true";

  const adSidebarSetting = await db.siteSetting.findUnique({ where: { key: "ad_sidebar_html" } });
  const adSidebarEnabled = (await db.siteSetting.findUnique({ where: { key: "ad_sidebar_enabled" } }))?.value === "true";

  // Formatted Dates
  const publishedDate = article.publishedAt || article.createdAt;
  const formattedPublish = format(new Date(publishedDate), "EEEE, d MMMM yyyy HH:mm 'WIB'", { locale: id });
  const isUpdated = article.updatedAt.getTime() - new Date(publishedDate).getTime() > 1000 * 60 * 15;
  const formattedUpdate = isUpdated
    ? format(new Date(article.updatedAt), "EEEE, d MMMM yyyy HH:mm 'WIB'", { locale: id })
    : null;

  const currentArticleUrl = `${SITE_URL}/${article.category.slug}/${article.slug}`;

  // Thematic visual fallback
  const categoryVisual = getCategoryVisual(article.category.slug);
  const featuredImageSrc =
    article.featuredImage && !article.featuredImage.includes("og-default.png")
      ? article.featuredImage
      : categoryVisual.image;
  const imageAltText = article.imageAlt || article.title || categoryVisual.alt;
  const captionText = article.imageCaption || categoryVisual.caption;

  // Schema JSON-LD
  const articleSchema = generateNewsArticleSchema({
    title: article.title,
    description: article.summary,
    url: currentArticleUrl,
    imageUrl: featuredImageSrc,
    datePublished: new Date(publishedDate).toISOString(),
    dateModified: article.updatedAt.toISOString(),
    authorName: article.author.displayName,
    authorUrl: `${SITE_URL}/penulis/${article.author.slug}`,
    categoryName: article.category.name,
  });

  // Parse source references if any
  let parsedSources: Array<{ source?: string; url?: string; type?: string; date?: string }> = [];
  if (article.sourceReferences) {
    try {
      parsedSources = JSON.parse(article.sourceReferences);
    } catch {
      // If it's plain text, treat as single line
    }
  }

  // Extract FAQs if present for FAQPage Schema (Google Rich Snippets)
  const faqMatches = Array.from(
    article.content.matchAll(/<p><strong>(\d+\.\s*[^?]+(?:\?|:))<\/strong><br\s*\/?>([\s\S]*?)<\/p>/gi)
  );
  const faqs = faqMatches
    .map((m) => ({
      question: m[1].replace(/^\d+\.\s*/, "").trim(),
      answer: m[2].replace(/<[^>]*>/g, " ").trim(),
    }))
    .slice(0, 4);

  const faqSchema = faqs.length > 0 ? generateFaqSchema(faqs) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { name: article.category.name, url: `/${article.category.slug}` },
            { name: article.title, url: `/${article.category.slug}/${article.slug}` },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Article Content (8 cols) */}
          <article className="lg:col-span-8 bg-white">
            <header className="mb-6">
              {/* Category Tag */}
              <Link
                href={`/${article.category.slug}`}
                className="inline-block bg-brand-red text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded mb-3 hover:bg-brand-red-dark transition-colors"
              >
                {article.category.name}
              </Link>

              {/* Headline */}
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-black text-brand-navy leading-tight mb-4">
                {article.title}
              </h1>

              {/* Subtitle / Summary */}
              {article.summary && (
                <p className="text-base sm:text-lg text-slate-600 font-sans font-medium leading-relaxed mb-4">
                  {article.summary}
                </p>
              )}

              {/* Meta: Author, Date, Reading Time */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 py-3 border-y border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 relative flex-shrink-0">
                    <Image
                      src={article.author.avatar || "/brand/logo.png"}
                      alt={article.author.displayName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Jurnalis</span>
                    <Link
                      href={`/penulis/${article.author.slug}`}
                      className="font-bold text-slate-800 hover:text-brand-red transition-colors"
                    >
                      {article.author.displayName}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <time dateTime={new Date(publishedDate).toISOString()}>
                    {formattedPublish}
                  </time>
                </div>

                {formattedUpdate && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    <span>Diperbarui: {formattedUpdate}</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{article.readingTime || 3} menit baca</span>
                </div>
              </div>

              {/* Share Buttons */}
              <ShareButtons url={currentArticleUrl} title={article.title} />
            </header>

            {/* Featured Image */}
            <figure className="mb-6 rounded-lg overflow-hidden bg-slate-100">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={featuredImageSrc}
                  alt={imageAltText}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                  priority
                />
              </div>
              <figcaption className="text-xs text-slate-500 p-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-1">
                <span>{captionText}</span>
                {article.imageCredit && (
                  <span className="text-slate-400 font-medium">Foto: {article.imageCredit}</span>
                )}
              </figcaption>
            </figure>

            {/* Table of Contents */}
            <TableOfContents contentHtml={article.content} />

            {/* Article Semantic Body */}
            <div
              className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-brand-navy prose-a:text-brand-red prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg text-slate-800 leading-relaxed text-base sm:text-lg"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* In-Content Native Ad */}
            {adInContentEnabled && (
              <AdBanner placement="in_content" html={adInContentSetting?.value} enabled={adInContentEnabled} />
            )}

            {/* Fact Check / Editorial Notes */}
            {article.factCheckNotes && (
              <div className="my-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-emerald-800 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verifikasi Fakta & Standar Pemeriksaan
                </div>
                <p className="leading-relaxed">{article.factCheckNotes}</p>
              </div>
            )}

            {/* Source References */}
            {parsedSources.length > 0 && (
              <div className="my-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Rujukan Sumber Berita
                </div>
                <ul className="space-y-1.5 list-disc list-inside">
                  {parsedSources.map((s, idx) => (
                    <li key={idx}>
                      <span className="font-semibold">{s.source || "Sumber Resmi"}: </span>
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-brand-red hover:underline inline-flex items-center gap-1"
                        >
                          {s.url} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span>{s.type || "-"}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Corrections Notice */}
            {article.correctionNotes && (
              <div className="my-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950">
                <div className="font-bold uppercase tracking-wider text-amber-800 mb-1">
                  Catatan Koreksi / Ralat Redaksi
                </div>
                <p className="leading-relaxed">{article.correctionNotes}</p>
              </div>
            )}

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="py-4 border-t border-slate-200 mt-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                  <BookmarkCheck className="w-3.5 h-3.5 text-slate-400" />
                  Topik Terkait:
                </span>
                {article.tags.map(({ tag }) => (
                  <Link
                    key={tag.id}
                    href={`/search?q=${encodeURIComponent(tag.name)}`}
                    className="text-xs bg-slate-100 hover:bg-brand-navy hover:text-white text-slate-700 px-3 py-1 rounded-full transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Author Profile Bio Box */}
            <div className="my-8 p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-slate-200">
                <Image
                  src={article.author.avatar || "/brand/logo.png"}
                  alt={article.author.displayName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <Link
                    href={`/penulis/${article.author.slug}`}
                    className="font-serif font-bold text-base text-brand-navy hover:text-brand-red transition-colors"
                  >
                    {article.author.displayName}
                  </Link>
                  {article.author.title && (
                    <span className="text-[11px] font-semibold text-brand-red uppercase tracking-wide">
                      {article.author.title}
                    </span>
                  )}
                </div>
                {article.author.bio && (
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {article.author.bio}
                  </p>
                )}
                <Link
                  href={`/penulis/${article.author.slug}`}
                  className="text-xs font-semibold text-brand-navy hover:underline inline-flex items-center gap-1"
                >
                  Lihat Semua Tulisan &rarr;
                </Link>
              </div>
            </div>

            {/* Prev / Next Article Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-y border-slate-200 my-6">
              <div>
                {prevArticle ? (
                  <Link
                    href={`/${prevArticle.category.slug}/${prevArticle.slug}`}
                    className="group block p-3 rounded-lg border border-slate-200 hover:border-brand-navy transition-colors h-full"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                      <ChevronLeft className="w-3.5 h-3.5" /> Berita Sebelumnya
                    </span>
                    <span className="font-serif text-xs font-bold text-slate-800 group-hover:text-brand-red line-clamp-2 leading-snug">
                      {prevArticle.title}
                    </span>
                  </Link>
                ) : (
                  <div className="p-3 text-slate-400 text-xs italic">
                    Ini adalah berita terawal dalam arsip.
                  </div>
                )}
              </div>

              <div>
                {nextArticle ? (
                  <Link
                    href={`/${nextArticle.category.slug}/${nextArticle.slug}`}
                    className="group block p-3 rounded-lg border border-slate-200 hover:border-brand-navy transition-colors h-full sm:text-right"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 sm:justify-end mb-1">
                      Berita Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-serif text-xs font-bold text-slate-800 group-hover:text-brand-red line-clamp-2 leading-snug">
                      {nextArticle.title}
                    </span>
                  </Link>
                ) : (
                  <div className="p-3 text-slate-400 text-xs italic sm:text-right">
                    Ini adalah berita terbaru saat ini.
                  </div>
                )}
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section className="my-10">
                <div className="border-b-2 border-brand-red pb-2 mb-6">
                  <h3 className="font-serif text-xl font-bold text-brand-navy">
                    Berita Terkait di Kanal {article.category.name}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedArticles.map((art) => (
                    <ArticleCard key={art.id} article={art} variant="standard" />
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4">
            <Sidebar
              popularArticles={popularArticles}
              editorPicks={editorPicks}
              tags={trendingTags}
              adHtml={adSidebarSetting?.value}
              adEnabled={adSidebarEnabled}
            />
          </div>
        </div>
      </main>
    </>
  );
}

