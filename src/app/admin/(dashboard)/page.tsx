import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  FileCheck,
  FileEdit,
  Calendar,
  Eye,
  Plus,
  ArrowUpRight,
  Clock,
  Radio,
  FolderTree,
  Inbox,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function AdminOverviewPage() {
  const currentUser = await getCurrentUser();

  // Metrics counts
  const [
    totalPublished,
    totalDrafts,
    totalScheduled,
    inboxPendingCount,
    inboxReviewCount,
    activeSourcesCount,
    recentArticles,
    recentInboxItems,
    topArticles,
    recentAuditLogs,
  ] = await Promise.all([
    db.article.count({ where: { status: "PUBLISHED" } }),
    db.article.count({ where: { status: "DRAFT" } }),
    db.article.count({ where: { status: "SCHEDULED" } }),
    db.ingestedItem.count({ where: { status: { in: ["DISCOVERED", "READY_FOR_AI_DRAFT"] } } }),
    db.ingestedItem.count({ where: { status: { in: ["DRAFT_GENERATED", "AWAITING_EDITORIAL_REVIEW"] } } }),
    db.ingestionSource.count({ where: { isActive: true } }),
    db.article.findMany({
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: { category: true, author: true },
    }),
    db.ingestedItem.findMany({
      take: 4,
      orderBy: { discoveredAt: "desc" },
      include: { source: { select: { name: true } } },
    }),
    db.article.findMany({
      where: { status: "PUBLISHED" },
      take: 5,
      orderBy: { viewCount: "desc" },
      include: { category: true },
    }),
    db.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
  ]);

  const totalViews = topArticles.reduce((acc, curr) => acc + curr.viewCount, 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Pusat Komando Redaksi
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-brand-navy mt-1">
            Selamat Datang, {currentUser?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Status sistem: Beroperasi normal. Basis data PostgreSQL terhubung aktif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/articles/new"
            className="flex items-center gap-1.5 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tulis Artikel Baru
          </Link>
          <Link
            href="/admin/news-inbox"
            className="flex items-center gap-1.5 bg-brand-navy hover:bg-brand-navy/90 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Inbox className="w-4 h-4 text-brand-red-light" />
            Kotak Masuk ({inboxPendingCount})
          </Link>
          <Link
            href="/admin/news-sources"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Radio className="w-4 h-4 text-slate-600" />
            Sumber ({activeSourcesCount})
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Artikel Terbit</p>
            <h3 className="font-serif text-3xl font-extrabold text-brand-navy mt-1">{totalPublished}</h3>
            <span className="text-[10px] text-emerald-600 font-medium">Aktif di mesin pencari</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draf Editorial</p>
            <h3 className="font-serif text-3xl font-extrabold text-brand-navy mt-1">{totalDrafts}</h3>
            <span className="text-[10px] text-amber-600 font-medium">Dalam penulisan / telaah</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileEdit className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Terjadwal</p>
            <h3 className="font-serif text-3xl font-extrabold text-brand-navy mt-1">{totalScheduled}</h3>
            <span className="text-[10px] text-blue-600 font-medium">Menunggu jam tayang</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pembaca</p>
            <h3 className="font-serif text-3xl font-extrabold text-brand-navy mt-1">{totalViews}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Tayangan halaman publik</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* News Ingestion Pipeline Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-navy to-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-brand-red text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              Pipeline Otomatisasi
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Agregasi Berita & Studio Jurnalisme AI
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Ada <strong className="text-white font-bold">{inboxPendingCount} berita masuk</strong> dan{" "}
            <strong className="text-white font-bold">{inboxReviewCount} draf</strong> menunggu peninjauan dewan redaksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/news-inbox"
            className="px-4 py-2 bg-brand-red hover:bg-brand-red/90 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Buka Kotak Masuk Berita</span>
          </Link>
          <Link
            href="/admin/news-sources"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Kelola Feed Sumber</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Recent Articles & Top Performing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Articles Table (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-brand-navy">
              Aktivitas Editorial Terkini
            </h3>
            <Link
              href="/admin/articles"
              className="text-xs font-semibold text-brand-red hover:underline flex items-center gap-1"
            >
              Semua Berita <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Judul Berita</th>
                  <th className="px-4 py-3">Kanal</th>
                  <th className="px-4 py-3">Jurnalis</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/articles/${art.id}/edit`}
                        className="font-bold text-slate-800 hover:text-brand-red line-clamp-1"
                      >
                        {art.title}
                      </Link>
                      <span className="text-[10px] text-slate-400">/{art.category.slug}/{art.slug}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {art.category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {art.author.displayName}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          art.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-800"
                            : art.status === "DRAFT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {art.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                      {format(new Date(art.updatedAt), "d MMM HH:mm", { locale: id })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Articles Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="font-serif font-bold text-base text-brand-navy border-b border-slate-200 pb-3 mb-4">
              Berita Terpopuler (Pembaca)
            </h3>
            <div className="space-y-3">
              {topArticles.map((art, idx) => (
                <div key={art.id} className="flex items-start gap-3 border-b border-slate-100 pb-2.5 last:border-b-0 last:pb-0">
                  <span className="font-serif text-lg font-black text-slate-300 w-5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/articles/${art.id}/edit`}
                      className="font-serif text-xs font-bold text-slate-800 hover:text-brand-red line-clamp-2 leading-snug"
                    >
                      {art.title}
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span>{art.category.name}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-slate-600">{art.viewCount} pembaca</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs">
            <h4 className="font-serif font-bold text-sm text-brand-navy border-b border-slate-200 pb-2 mb-3">
              Catatan Audit Keamanan
            </h4>
            <div className="space-y-2">
              {recentAuditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-medium text-slate-800">{log.action}</span>
                  <span className="text-[10px] text-slate-400">
                    {format(new Date(log.createdAt), "HH:mm", { locale: id })}
                  </span>
                </div>
              ))}
              {recentAuditLogs.length === 0 && (
                <p className="text-[11px] text-slate-400 italic">Belum ada aktivitas tercatat.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

