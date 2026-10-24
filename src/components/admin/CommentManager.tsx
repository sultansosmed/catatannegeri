"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X, Trash2, ShieldAlert, MessageSquare, ExternalLink, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface CommentItem {
  id: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: "PENDING" | "APPROVED" | "SPAM" | "TRASH";
  createdAt: Date | string;
  article: {
    id: string;
    title: string;
    slug: string;
    category: { slug: string };
  };
}

export function CommentManager({ initialComments }: { initialComments: any[] }) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = comments.filter((c) => {
    if (activeTab === "ALL") return true;
    return c.status === activeTab;
  });

  const handleUpdateStatus = async (commentId: string, status: string) => {
    setLoadingId(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, status: status as any } : c))
        );
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Hapus komentar ini secara permanen?")) return;
    setLoadingId(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } finally {
      setLoadingId(null);
    }
  };

  const pendingCount = comments.filter((c) => c.status === "PENDING").length;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`py-2 px-1 border-b-2 transition-colors ${
            activeTab === "ALL" ? "border-brand-red text-brand-red" : "border-transparent text-slate-500"
          }`}
        >
          Semua ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`py-2 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "PENDING" ? "border-brand-red text-brand-red" : "border-transparent text-slate-500"
          }`}
        >
          <span>Menunggu Persetujuan</span>
          {pendingCount > 0 && (
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px]">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("APPROVED")}
          className={`py-2 px-1 border-b-2 transition-colors ${
            activeTab === "APPROVED" ? "border-brand-red text-brand-red" : "border-transparent text-slate-500"
          }`}
        >
          Disetujui
        </button>
        <button
          onClick={() => setActiveTab("SPAM")}
          className={`py-2 px-1 border-b-2 transition-colors ${
            activeTab === "SPAM" ? "border-brand-red text-brand-red" : "border-transparent text-slate-500"
          }`}
        >
          Spam
        </button>
      </div>

      {/* Comments List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.map((item) => (
          <div key={item.id} className="p-5 hover:bg-slate-50/50 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
              <div>
                <span className="font-bold text-slate-800 text-xs">{item.authorName}</span>
                <span className="text-slate-400 text-xs ml-2">({item.authorEmail})</span>
                <span className="text-slate-400 text-[11px] ml-2">
                  &bull; {format(new Date(item.createdAt), "d MMM yyyy HH:mm", { locale: id })}
                </span>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  item.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800"
                    : item.status === "PENDING"
                    ? "bg-amber-100 text-amber-800"
                    : item.status === "SPAM"
                    ? "bg-red-100 text-red-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {item.status}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
              "{item.content}"
            </p>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <span>Tanggapan untuk artikel:</span>
                <Link
                  href={`/${item.article.category.slug}/${item.article.slug}`}
                  target="_blank"
                  className="font-serif font-bold text-slate-800 hover:text-brand-red flex items-center gap-1"
                >
                  {item.article.title} <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>
              </div>

              <div className="flex items-center gap-1.5">
                {item.status !== "APPROVED" && (
                  <button
                    onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                    disabled={loadingId === item.id}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] px-2.5 py-1 rounded"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Setujui
                  </button>
                )}
                {item.status !== "SPAM" && (
                  <button
                    onClick={() => handleUpdateStatus(item.id, "SPAM")}
                    disabled={loadingId === item.id}
                    className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[11px] px-2.5 py-1 rounded"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Tandai Spam
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={loadingId === item.id}
                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                  title="Hapus Permanen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Tidak ada komentar pada filter ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}

