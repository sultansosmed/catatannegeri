"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit2, Tags, X } from "lucide-react";
import { generateSlug } from "@/lib/slug";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { articles: number };
}

export function TagManager({ initialTags }: { initialTags: TagItem[] }) {
  const [tags, setTags] = useState<TagItem[]>(initialTags);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const handleOpenAdd = () => {
    setEditingTag(null);
    setName("");
    setSlug("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TagItem) => {
    setEditingTag(t);
    setName(t.name);
    setSlug(t.slug);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!editingTag;
      const url = isEdit ? `/api/tags/${editingTag.id}` : "/api/tags";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (res.ok && data.tag) {
        if (isEdit) {
          setTags((prev) => prev.map((t) => (t.id === editingTag.id ? { ...t, ...data.tag } : t)));
        } else {
          setTags((prev) => [...prev, { ...data.tag, _count: { articles: 0 } }]);
        }
        setIsModalOpen(false);
      } else {
        alert(data.error || "Gagal.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: TagItem) => {
    if (!confirm(`Hapus tag "#${t.name}"?`)) return;
    const res = await fetch(`/api/tags/${t.id}`, { method: "DELETE" });
    if (res.ok) {
      setTags((prev) => prev.filter((item) => item.id !== t.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-brand-navy hover:bg-brand-red text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Tag Baru
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-serif font-bold text-base text-brand-navy">
                {editingTag ? "Sunting Tag" : "Tambah Topik / Tag"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Tag *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingTag) setSlug(generateSlug(e.target.value));
                  }}
                  required
                  placeholder="Misal: Krisis Pangan"
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Slug URL *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-brand-red text-white font-bold"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tags grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6">
        <div className="flex flex-wrap gap-2.5">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 pl-3 pr-2 py-1.5 rounded-lg text-xs hover:border-slate-300 transition-colors"
            >
              <span className="font-bold text-brand-navy">#{tag.name}</span>
              <span className="bg-white border border-slate-200 text-slate-500 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                {tag._count.articles}
              </span>
              <button
                onClick={() => handleOpenEdit(tag)}
                className="text-slate-400 hover:text-brand-navy p-0.5"
                title="Sunting"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDelete(tag)}
                className="text-slate-400 hover:text-red-600 p-0.5"
                title="Hapus"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

