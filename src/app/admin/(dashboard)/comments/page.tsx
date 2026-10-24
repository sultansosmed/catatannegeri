import React from "react";
import { db } from "@/lib/db";
import { CommentManager } from "@/components/admin/CommentManager";
import { MessageSquare } from "lucide-react";

export default async function AdminCommentsPage() {
  const comments = await db.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      article: { select: { id: true, title: true, slug: true, category: { select: { slug: true } } } },
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Interaksi Pembaca
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Moderasi Komentar & Tanggapan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penyaringan komentar publik, persetujuan tanggapan, dan penanganan spam/ujaran kebencian.
          </p>
        </div>
      </div>

      <CommentManager initialComments={comments} />
    </div>
  );
}

