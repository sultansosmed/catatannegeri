"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle2, ArrowUpDown, Menu as MenuIcon } from "lucide-react";

interface MenuItem {
  id: string;
  title: string;
  url: string;
  target: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
}

export function MenuManager({ initialMenus }: { initialMenus: MenuItem[] }) {
  const [menus, setMenus] = useState<MenuItem[]>(initialMenus);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [position, setPosition] = useState("HEADER");
  const [target, setTarget] = useState("_self");
  const [sortOrder, setSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url, position, target, sortOrder }),
      });
      const data = await res.json();
      if (res.ok && data.menu) {
        setMenus((prev) => [...prev, data.menu]);
        setTitle("");
        setUrl("");
        setShowAddModal(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus item menu ini?")) return;
    const res = await fetch(`/api/menus/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMenus((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleToggle = async (menu: MenuItem) => {
    const updatedStatus = !menu.isActive;
    const res = await fetch(`/api/menus/${menu.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...menu, isActive: updatedStatus }),
    });
    if (res.ok) {
      setMenus((prev) =>
        prev.map((m) => (m.id === menu.id ? { ...m, isActive: updatedStatus } : m))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-brand-navy hover:bg-brand-red text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Tautan Menu
        </button>
      </div>

      {showAddModal && (
        <form onSubmit={handleAdd} className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm space-y-4">
          <h4 className="font-serif font-bold text-sm text-brand-navy">Tambah Item Menu Navigasi</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Label Tautan *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Laporan Khusus IKN"
                required
                className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target URL *</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/nasional atau https://..."
                required
                className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Posisi Penempatan</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
              >
                <option value="HEADER">Menu Header Utama</option>
                <option value="FOOTER">Menu Footer</option>
                <option value="SECONDARY">Sub-Menu / Bar Tambahan</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Urutan (Sort Order)</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded bg-brand-red text-white font-bold hover:bg-brand-red-dark"
            >
              {saving ? "Menyimpan..." : "Simpan Menu"}
            </button>
          </div>
        </form>
      )}

      {/* Menu Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Urutan</th>
              <th className="px-4 py-3">Label Menu</th>
              <th className="px-4 py-3">Tautan URL</th>
              <th className="px-4 py-3">Posisi</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {menus.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3 font-mono font-bold text-slate-400">#{m.sortOrder}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{m.title}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{m.url}</td>
                <td className="px-4 py-3">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                    {m.position}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggle(m)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m.isActive ? "Aktif" : "Nonaktif"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {menus.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <MenuIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Belum ada custom navigation menu yang ditambahkan.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

