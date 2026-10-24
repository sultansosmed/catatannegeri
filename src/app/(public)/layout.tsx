import React from "react";
import { db } from "@/lib/db";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { BreakingTicker } from "@/components/public/BreakingTicker";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch active categories sorted by sortOrder
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  // Fetch breaking news settings
  const breakingSetting = await db.siteSetting.findUnique({
    where: { key: "breaking_news_enabled" },
  });
  const breakingTextSetting = await db.siteSetting.findUnique({
    where: { key: "breaking_news_text" },
  });

  const breakingEnabled = breakingSetting?.value === "true";
  const breakingText = breakingTextSetting?.value || "";

  // Check if there is an active breaking article
  const breakingArticle = await db.article.findFirst({
    where: { status: "PUBLISHED", isBreaking: true },
    orderBy: { publishedAt: "desc" },
    include: { category: true },
  });

  const activeTickerText = breakingArticle
    ? breakingArticle.title
    : breakingText;
  const activeTickerLink = breakingArticle
    ? `/${breakingArticle.category.slug}/${breakingArticle.slug}`
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-brand-red selection:text-white">
      {breakingEnabled && activeTickerText && (
        <BreakingTicker text={activeTickerText} link={activeTickerLink} />
      )}
      <Header categories={categories} />
      <div className="flex-1">
        {children}
      </div>
      <Footer categories={categories} />
    </div>
  );
}

