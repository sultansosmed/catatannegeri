"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Inbox,
  Sparkles,
  AlertTriangle,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  FileText,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface IngestedItemSummary {
  id: string;
  sourceId: string;
  source: {
    id: string;
    name: string;
    type: string;
  };
  originalUrl: string;
  title: string;
  originalPublishedAt: string | Date | null;
  discoveredAt: string | Date;
  excerpt: string | null;
  detectedCategory: string | null;
  status: string;
  duplicateScore: number | null;
  duplicateReason: string | null;
  isHighImpact: boolean;
  aiDraftTitle: string | null;
  reviewedBy?: {
    id: string;
    name: string;
  } | null;
}

interface NewsInboxManagerProps {
  initialItems: IngestedItemSummary[];
  sources: { id: string; name: string }[];
}

export function NewsInboxManager({ initialItems, sources }: NewsInboxManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<IngestedItemSummary[]>(initialItems);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [highImpactOnly, setHighImpactOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSyncingNational, setIsSyncingNational] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Filter items client-side for immediate responsiveness
  const filteredItems = items.filter((item) => {
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (sourceFilter !== "ALL" && item.sourceId !== sourceFilter) return false;
    if (highImpactOnly && !item.isHighImpact) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchExcerpt = item.excerpt?.toLowerCase().includes(q);
      const matchSource = item.source.name.toLowerCase().includes(q);
      if (!matchTitle && !matchExcerpt && !matchSource) return false;
    }
    return true;
  });

  // Calculate status counts
  const counts = {
    all: items.length,
    discovered: items.filter((i) => i.status === "DISCOVERED").length,
    duplicates: items.filter((i) => i.status === "DUPLICATE").length,
    readyAi: items.filter((i) => i.status === "READY_FOR_AI_DRAFT").length,
    draftGenerated: items.filter((i) => i.status === "DRAFT_GENERATED" || i.status === "AWAITING_EDITORIAL_REVIEW").length,
    researchNeeded: items.filter((i) => i.status === "RESEARCH_NEEDED").length,
    published: items.filter((i) => i.status === "PUBLISHED").length,
    highImpact: items.filter((i) => i.isHighImpact).length,
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const refreshItems = async () => {
    setIsRefreshing(true);
    setFeedback(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (sourceFilter !== "ALL") params.append("sourceId", sourceFilter);
      if (highImpactOnly) params.append("isHighImpact", "true");
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const res = await fetch(`/api/news-inbox?${params.toString()}`);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch {
      setFeedback({ text: "Gagal memuat ulang data kotak masuk.", isError: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncNationalNews = async () => {
    setIsSyncingNational(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/ingestion/sync-all?limit=10&autoDraft=true", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi berita nasional.");

      setFeedback({
        text: `🎉 Berhasil! Diproses ${data.totalSources} sumber media nasional (Antara, CNN, CNBC, Tempo, Republika). Ditemukan ${data.totalNewDiscovered} berita baru, ${data.totalDraftsGenerated} draft AI tersusun siap terbit.`,
      });
      await refreshItems();
      router.refresh();
    } catch (err: any) {
      setFeedback({ text: err.message || "Gagal sinkronisasi berita nasional.", isError: true });
    } finally {
      setIsSyncingNational(false);
    }
  };

  const handleQuickPublish = async (e: React.MouseEvent, item: IngestedItemSummary) => {
    e.stopPropagation();
    setActionLoading(`pub-${item.id}`);
    setFeedback(null);
    try {
      const res = await fetch(`/api/news-inbox/${item.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_AND_PUBLISH",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menerbitkan artikel.");

      setFeedback({
        text: `✅ Sukses! Berita berhasil diterbitkan langsung: "${data.article?.title || item.title}". Kunjungi: ${data.articleUrl}`,
      });
      await refreshItems();
      router.refresh();
    } catch (err: any) {
      setFeedback({ text: err.message || "Gagal menerbitkan.", isError: true });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBatchAction = async (action: "MARK_READY_AI" | "DISMISS_DUPLICATES") => {
    if (selectedIds.length === 0) return;
    setActionLoading(action);
    setFeedback(null);
    try {
      const res = await fetch("/api/news-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, itemIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses batch aksi.");

      setFeedback({
        text: `Berhasil memproses ${data.count || selectedIds.length} item.`,
      });
      setSelectedIds([]);
      await refreshItems();
      router.refresh();
    } catch (err: any) {
      setFeedback({ text: err.message || "Terjadi kesalahan.", isError: true });
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateAiDraftSingle = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setActionLoading(`ai-${itemId}`);
    setFeedback(null);
    try {
      const res = await fetch(`/api/news-inbox/${itemId}/ai-draft`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat draf AI.");

      setFeedback({
        text: "Draf jurnalisme AI berhasil disusun! Anda dapat meninjaunya atau langsung menerbitkannya.",
      });
      await refreshItems();
      router.refresh();
    } catch (err: any) {
      setFeedback({ text: err.message || "Gagal membuat draf AI.", isError: true });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DISCOVERED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">Ditemukan</span>;
      case "DUPLICATE":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">Duplikasi</span>;
      case "READY_FOR_AI_DRAFT":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700">Siap Draf AI</span>;
      case "DRAFT_GENERATED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700">Draf Dibuat</span>;
      case "AWAITING_EDITORIAL_REVIEW":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">Menunggu Review</span>;
      case "RESEARCH_NEEDED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">Butuh Riset</span>;
      case "PUBLISHED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Diterbitkan</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">Ditolak</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Berita Masuk</span>
            <Inbox className="w-4 h-4 text-brand-navy" />
          </div>
          <div className="text-2xl font-black text-brand-navy">{counts.all}</div>
          <div className="text-[11px] text-slate-400 mt-1">{counts.discovered} baru belum diproses</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Draf AI & Review</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{counts.draftGenerated + counts.readyAi}</div>
          <div className="text-[11px] text-slate-400 mt-1">{counts.readyAi} siap dibuat draf</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Topik Sensitif / Tinggi</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{counts.highImpact}</div>
          <div className="text-[11px] text-amber-600/80 mt-1">Perlu verifikasi ketat</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Duplikasi Tersaring</span>
            <Copy className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{counts.duplicates}</div>
          <div className="text-[11px] text-slate-400 mt-1">Kemiripan semantik &gt; 70%</div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedback.isError ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline ml-4">
            Tutup
          </button>
        </div>
      )}

      {/* Filter, Actions, and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {[
            { id: "ALL", label: "Semua", count: counts.all },
            { id: "DISCOVERED", label: "Ditemukan", count: counts.discovered },
            { id: "READY_FOR_AI_DRAFT", label: "Siap Draf AI", count: counts.readyAi },
            { id: "DRAFT_GENERATED", label: "Draf Dibuat", count: counts.draftGenerated },
            { id: "RESEARCH_NEEDED", label: "Butuh Riset", count: counts.researchNeeded },
            { id: "DUPLICATE", label: "Duplikasi", count: counts.duplicates },
            { id: "PUBLISHED", label: "Diterbitkan", count: counts.published },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                statusFilter === tab.id
                  ? "bg-brand-navy text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Dropdowns, Search, and Toggles */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari judul berita..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-red w-48 sm:w-60"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-red bg-white"
            >
              <option value="ALL">Semua Sumber Berita</option>
              {sources.map((src) => (
                <option key={src.id} value={src.id}>
                  {src.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setHighImpactOnly(!highImpactOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                highImpactOnly
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Hanya Topik Sensitif ({counts.highImpact})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* National Media Sync Button */}
            <button
              onClick={handleSyncNationalNews}
              disabled={isSyncingNational}
              className="px-3.5 py-1.5 bg-brand-red hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Tarik berita terbaru dari Antara, CNN, CNBC, Tempo, Republika"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNational ? "animate-spin" : ""}`} />
              <span>{isSyncingNational ? "Mengambil Berita Nasional..." : "Tarik Berita Nasional"}</span>
            </button>

            <button
              onClick={refreshItems}
              disabled={isRefreshing}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Segarkan daftar"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-red" : ""}`} />
            </button>
          </div>
        </div>

        {/* Batch Actions Toolbar */}
        {selectedIds.length > 0 && (
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-brand-red" />
              <span className="font-semibold">{selectedIds.length} item dipilih</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBatchAction("MARK_READY_AI")}
                disabled={actionLoading !== null}
                className="px-3 py-1.5 bg-brand-red hover:bg-brand-red/90 rounded text-white font-semibold transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tandai Siap Draf AI</span>
              </button>
              <button
                onClick={() => handleBatchAction("DISMISS_DUPLICATES")}
                disabled={actionLoading !== null}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-semibold transition-colors flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Tolak Duplikasi</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-2 py-1 text-slate-400 hover:text-white"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* News Inbox Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="text-slate-500 hover:text-slate-800">
                    {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-brand-red" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">Judul Berita & Sumber</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Status Pipeline</th>
                <th className="p-3">Waktu Masuk</th>
                <th className="p-3 text-right">Aksi Editorial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">Tidak ada berita ditemukan</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Klik tombol <strong>"Tarik Berita Nasional"</strong> di atas untuk mengambil berita terbaru secara semi otomatis.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isGeneratingAi = actionLoading === `ai-${item.id}`;
                  const isPublishing = actionLoading === `pub-${item.id}`;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? "bg-red-50/40" : ""
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelect(item.id)}
                          className="text-slate-400 hover:text-slate-800"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-red" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3 max-w-md">
                        <div className="space-y-1">
                          <Link
                            href={`/admin/news-inbox/${item.id}`}
                            className="font-bold text-slate-900 hover:text-brand-red line-clamp-2 block transition-colors leading-snug"
                          >
                            {item.title}
                          </Link>

                          {item.excerpt && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {item.excerpt}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            <span className="font-semibold text-brand-navy">
                              {item.source.name}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded">
                              {item.source.type}
                            </span>
                            <a
                              href={item.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-brand-red inline-flex items-center gap-0.5"
                              title="Buka sumber asli"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {item.isHighImpact && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Topik Sensitif
                              </span>
                            )}

                            {item.duplicateScore && item.duplicateScore >= 0.7 && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded"
                                title={item.duplicateReason || "Terindikasi duplikasi"}
                              >
                                <Copy className="w-2.5 h-2.5" />
                                Kemiripan {Math.round(item.duplicateScore * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {item.detectedCategory || "Nasional"}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">{getStatusBadge(item.status)}</td>

                      <td className="p-3 whitespace-nowrap text-slate-500">
                        <div className="text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{format(new Date(item.discoveredAt), "dd MMM, HH:mm", { locale: id })}</span>
                        </div>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Quick Publish Button */}
                          {item.status !== "PUBLISHED" && item.status !== "DUPLICATE" && (
                            <button
                              onClick={(e) => handleQuickPublish(e, item)}
                              disabled={isPublishing}
                              className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                              title="Setujui dan terbitkan langsung ke portal website (1-klik)"
                            >
                              <CheckCircle className={`w-3.5 h-3.5 ${isPublishing ? "animate-spin" : ""}`} />
                              <span>{isPublishing ? "Menerbitkan..." : "Terbitkan"}</span>
                            </button>
                          )}

                          {/* AI Draft Button if not generated yet */}
                          {item.status !== "PUBLISHED" && !item.aiDraftTitle && item.status !== "DUPLICATE" && (
                            <button
                              onClick={(e) => handleGenerateAiDraftSingle(e, item.id)}
                              disabled={isGeneratingAi}
                              className="px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                              title="Susun draf jurnalisme AI 1.200 kata"
                            >
                              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? "animate-spin" : ""}`} />
                              <span>{isGeneratingAi ? "Menyusun..." : "Draf AI"}</span>
                            </button>
                          )}

                          {/* Review Studio Link */}
                          <Link
                            href={`/admin/news-inbox/${item.id}`}
                            className="px-2.5 py-1.5 rounded bg-brand-navy hover:bg-brand-navy/90 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                            title="Buka studio telaah dan sunting naskah"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Tinjau</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
