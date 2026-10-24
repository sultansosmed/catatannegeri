"use client";

import React, { useState } from "react";
import { Plus, Trash2, ArrowRight, CheckCircle, Globe, X } from "lucide-react";

interface RedirectItem {
  id: string;
  sourcePath: string;
  destinationPath: string;
  statusCode: number;
  isActive: boolean;
  hitCount: number;
}

export function RedirectManager({ initialRedirects }: { initialRedirects: RedirectItem[] }) {
  const [redirects, setRedirects] = useState<RedirectItem[]>(initialRedirects);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [sourcePath, setSourcePath] = useState("");
  const [destinationPath, setDestinationPath] = useState("");
  const [statusCode, setStatusCode] = useState(301);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePath, destinationPath, statusCode, isActive: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal.");

      setRedirects((prev) => [data.redirect, ...prev.filter((r) => r.id !== data.redirect.id)]);
      setSourcePath("");
      setDestinationPath("");
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus aturan pengalihan URL ini?")) return;
    const res = await fetch(`/api/redirects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRedirects((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-brand-navy hover:bg-brand-red text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Aturan Pengalihan (Redirect)
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-serif font-bold text-base text-brand-navy">
                Buat Pengalihan URL Baru
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
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
                <label className="block font-bold text-slate-700 mb-1">
                  Path Asal (Source Path, diawali '/') *
                </label>
                <input
                  type="text"
                  value={sourcePath}
                  onChange={(e) => setSourcePath(e.target.value)}
                  required
                  placeholder="/berita-lama/artikel-2025"
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Path Tujuan (Destination Path) *
                </label>
                <input
                  type="text"
                  value={destinationPath}
                  onChange={(e) => setDestinationPath(e.target.value)}
                  required
                  placeholder="/nasional/artikel-terbaru"
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe Pengalihan HTTP</label>
                <select
                  value={statusCode}
                  onChange={(e) => setStatusCode(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
                >
                  <option value={301}>301 — Permanen (Sangat Disarankan untuk SEO)</option>
                  <option value={302}>302 — Sementara (Temporary)</option>
                </select>
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
                  {saving ? "Menyimpan..." : "Aktifkan Redirect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redirects Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Path Asal (Source)</th>
                <th className="px-4 py-3">Tujuan (Destination)</th>
                <th className="px-4 py-3 text-center">Status HTTP</th>
                <th className="px-4 py-3 text-center">Jumlah Dialihkan</th>
                <th className="px-4 py-3 text-center">Kondisi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {redirects.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-slate-900">
                    {r.sourcePath}
                  </td>
                  <td className="px-4 py-3 font-mono text-brand-red">
                    <span className="flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      {r.destinationPath}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                      {r.statusCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">
                    {r.hitCount}x
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Aktif
                      </span>
                    ) : (
                      <span className="text-slate-400">Nonaktif</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {redirects.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Globe className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>Belum ada aturan pengalihan URL yang tercatat.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

