import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, User } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";
import { getCategoryVisual } from "@/lib/category-images";

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  featuredImage?: string | null;
  imageAlt?: string | null;
  readingTime?: number;
  publishedAt?: Date | string | null;
  category: {
    name: string;
    slug: string;
  };
  author?: {
    displayName: string;
    slug: string;
  } | null;
}

interface ArticleCardProps {
  article: ArticleItem;
  variant?: "standard" | "horizontal" | "featured" | "compact";
  priority?: boolean;
}

export function ArticleCard({ article, variant = "standard", priority = false }: ArticleCardProps) {
  const articleUrl = `/${article.category.slug}/${article.slug}`;

  // Formatted date
  const pubDate = article.publishedAt ? new Date(article.publishedAt) : new Date();
  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(pubDate, { addSuffix: true, locale: id });
  } catch {
    timeAgo = format(pubDate, "d MMMM yyyy", { locale: id });
  }

  const categoryVisual = getCategoryVisual(article.category?.slug);
  const imageSrc =
    article.featuredImage && !article.featuredImage.includes("og-default.png")
      ? article.featuredImage
      : categoryVisual.image;
  const imageAlt = article.imageAlt || article.title || categoryVisual.alt;

  if (variant === "featured") {
    return (
      <article className="group relative bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <Link href={articleUrl} className="block relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
          <div className="absolute top-3 left-3">
            <span className="bg-brand-red text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow">
              {article.category.name}
            </span>
          </div>
        </Link>
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
            {article.author && (
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <User className="w-3.5 h-3.5" />
                {article.author.displayName}
              </span>
            )}
            <span>&bull;</span>
            <time dateTime={pubDate.toISOString()}>{timeAgo}</time>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readingTime || 3} mnt baca
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-brand-navy leading-tight mb-3 group-hover:text-brand-red transition-colors">
            <Link href={articleUrl}>{article.title}</Link>
          </h2>
          {article.summary && (
            <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
              {article.summary}
            </p>
          )}
        </div>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className="group flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
        <Link
          href={articleUrl}
          className="relative w-28 h-20 sm:w-36 sm:h-24 flex-shrink-0 rounded overflow-hidden bg-slate-100"
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="150px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        </Link>
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <Link
              href={`/${article.category.slug}`}
              className="text-[11px] font-bold uppercase tracking-wider text-brand-red hover:underline mb-1 inline-block"
            >
              {article.category.name}
            </Link>
            <h3 className="font-serif font-bold text-sm sm:text-base text-brand-navy line-clamp-2 leading-snug group-hover:text-brand-red transition-colors">
              <Link href={articleUrl}>{article.title}</Link>
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
            <time dateTime={pubDate.toISOString()}>{timeAgo}</time>
            <span>&bull;</span>
            <span>{article.readingTime || 3} mnt</span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group py-2.5 border-b border-slate-100 last:border-b-0">
        <Link
          href={`/${article.category.slug}`}
          className="text-[10px] font-bold uppercase tracking-wider text-brand-red hover:underline mb-0.5 inline-block"
        >
          {article.category.name}
        </Link>
        <h4 className="font-serif font-bold text-sm text-brand-navy leading-snug group-hover:text-brand-red transition-colors line-clamp-2">
          <Link href={articleUrl}>{article.title}</Link>
        </h4>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
          <time dateTime={pubDate.toISOString()}>{timeAgo}</time>
        </div>
      </article>
    );
  }

  // Standard vertical card
  return (
    <article className="group bg-white rounded-lg overflow-hidden border border-slate-200 hover:shadow-sm transition-shadow flex flex-col h-full">
      <Link href={articleUrl} className="block relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={priority}
        />
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-brand-navy/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
            {article.category.name}
          </span>
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-serif font-bold text-base text-brand-navy leading-snug group-hover:text-brand-red transition-colors mb-2 line-clamp-2">
            <Link href={articleUrl}>{article.title}</Link>
          </h3>
          {article.summary && (
            <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 mb-3">
              {article.summary}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <time dateTime={pubDate.toISOString()}>{timeAgo}</time>
          <span>{article.readingTime || 3} mnt</span>
        </div>
      </div>
    </article>
  );
}

