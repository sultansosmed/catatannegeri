"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ArticleDeleteButtonProps {
  articleId: string;
  articleTitle: string;
  userRole: string;
}

export function ArticleDeleteButton({
  articleId,
  articleTitle,
  userRole,
}: ArticleDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Only SUPER_ADMIN and EDITOR can delete articles
  if (userRole !== "SUPER_ADMIN" && userRole !== "EDITOR") {
    return null;
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus artikel:\n"${articleTitle}"?\n\nTindakan ini bersifat permanen dan tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus artikel.");
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menghapus artikel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
      title="Hapus Artikel Permanen"
    >
      <Trash2 className={`w-3.5 h-3.5 ${loading ? "animate-pulse" : ""}`} />
    </button>
  );
}

