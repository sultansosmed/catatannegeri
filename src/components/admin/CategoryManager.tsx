"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, FolderTree, X } from "lucide-react";
import { generateSlug } from "@/lib/slug";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  _count: { articles: number };
}

export function CategoryManager({ initialCategories }: { initialCategories: CategoryItem[] }) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setSortOrder((categories.length + 1).toString());
    setIsActive(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setSortOrder(cat.sortOrder.toString());
    setIsActive(cat.isActive);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingCategory) {
      setSlug(generateSlug(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const payload = {
      name,
      slug,
      description: description || null,
      sortOrder: parseInt(sortOrder, 10) || 0,
      isActive,
    };

    try {
      const isEdit = !!editingCategory;
      const url = isEdit ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan kategori.");

      if (isEdit) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...data.category } : c))
        );
      } else {
        setCategories((prev) => [...prev, { ...data.category, _count: { articles: 0 } }]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (cat._count.articles > 0) {
      alert(`Kategori "${cat.name}" masih memiliki ${cat._count.articles} artikel. Pindahkan artikel terlebih dahulu.`);
      return;
    }

    if (!confirm(`Hapus kategori "${cat.name}" secara permanen?`)) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus.");

      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err: any) {
      alert(err.message || "Gagal menghapus.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori Baru
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-serif font-bold text-base text-brand-navy">
                {editingCategory ? "Sunting Kategori" : "Tambah Kategori Berita"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  required
                  placeholder="Contoh: Hankam & Geopolitik"
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Slug URL Kanonikal *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  required
                  placeholder="hankam-geopolitik"
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Editorial</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan liputan dan cakupan topik kanal ini..."
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Urutan</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Visibilitas</label>
                  <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
                  >
                    <option value="true">Aktif (Tampil)</option>
                    <option value="false">Nonaktif (Draf)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-brand-red hover:bg-brand-red-dark text-white font-bold"
                >
                  {saving ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 w-16">Urutan</th>
                <th className="px-4 py-3">Nama Kanal</th>
                <th className="px-4 py-3">Slug URL</th>
                <th className="px-4 py-3">Deskripsi Singkat</th>
                <th className="px-4 py-3 text-center">Jumlah Artikel</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-400">
                    #{cat.sortOrder}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-500">
                    /{cat.slug}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                    {cat.description || "-"}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                    {cat._count.articles}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {cat.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full text-[10px]">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-brand-navy rounded hover:bg-slate-100"
                        title="Sunting Kategori"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

