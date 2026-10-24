import React from "react";
import Link from "next/link";
import { TrendingUp, Award, Tag as TagIcon } from "lucide-react";
import { ArticleCard } from "./ArticleCard";
import { AdBanner } from "./AdBanner";
import { NewsletterBox } from "./NewsletterBox";

interface SidebarProps {
  popularArticles: any[];
  editorPicks: any[];
  tags: any[];
  adHtml?: string | null;
  adEnabled?: boolean;
}

export function Sidebar({
  popularArticles,
  editorPicks,
  tags,
  adHtml,
  adEnabled = true,
}: SidebarProps) {
  return (
    <aside className="w-full space-y-8">
      {/* Sidebar Ad Placement */}
      {adEnabled && (
        <AdBanner placement="sidebar" html={adHtml} enabled={adEnabled} />
      )}

      {/* Terpopuler / Most Read */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-red" />
          <h3 className="font-serif font-bold text-base text-brand-navy">
            Terpopuler
          </h3>
        </div>
        <div className="space-y-3">
          {popularArticles.map((art, idx) => (
            <div key={art.id} className="flex gap-3 items-start border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
              <span className="font-serif text-2xl font-black text-slate-300 w-6 text-center">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/${art.category.slug}/${art.slug}`}
                  className="font-serif text-xs sm:text-sm font-bold text-brand-navy hover:text-brand-red transition-colors line-clamp-2 leading-snug"
                >
                  {art.title}
                </Link>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                  <span>{art.category.name}</span>
                  <span>&bull;</span>
                  <span>{art.viewCount} pembaca</span>
                </div>
              </div>
            </div>
          ))}
          {popularArticles.length === 0 && (
            <p className="text-xs text-slate-400 italic">Belum ada data berita populer.</p>
          )}
        </div>
      </div>

      {/* Pilihan Editor */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
          <Award className="w-4 h-4 text-brand-navy" />
          <h3 className="font-serif font-bold text-base text-brand-navy">
            Pilihan Editor
          </h3>
        </div>
        <div className="space-y-2">
          {editorPicks.map((art) => (
            <ArticleCard key={art.id} article={art} variant="compact" />
          ))}
          {editorPicks.length === 0 && (
            <p className="text-xs text-slate-400 italic">Belum ada artikel pilihan editor.</p>
          )}
        </div>
      </div>

      {/* Newsletter Box */}
      <NewsletterBox />

      {/* Trending Topics / Tags */}
      {tags && tags.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
            <TagIcon className="w-4 h-4 text-brand-navy" />
            <h3 className="font-serif font-bold text-base text-brand-navy">
              Topik Hangat
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/search?q=${encodeURIComponent(tag.name)}`}
                className="text-xs bg-slate-100 hover:bg-brand-navy hover:text-white text-slate-700 px-2.5 py-1 rounded transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

