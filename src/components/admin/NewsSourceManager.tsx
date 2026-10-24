"use client";

import React, { useState } from "react";
import {
  Plus,
  RefreshCw,
  Radio,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Trash2,
  Edit2,
  Clock,
  ShieldCheck,
  X,
  Play,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface SourceItem {
  id: string;
  name: string;
  websiteUrl: string | null;
  type: string;
  url: string;
  authType: string;
  authSecretEnvKey: string | null;
  isActive: boolean;
  pollingInterval: number;
  allowedCategories: string | null;
  licenseNotes: string | null;
  lastFetchedAt: Date | string | null;
  lastError: string | null;
  itemCount: number;
  _count: { items: number };
}

export function NewsSourceManager({ initialSources }: { initialSources: SourceItem[] }) {
  const [sources, setSources] = useState<SourceItem[]>(initialSources);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<SourceItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [type, setType] = useState("RSS");
  const [url, setUrl] = useState("");
  const [authType, setAuthType] = useState("NONE");
  const [authSecretEnvKey, setAuthSecretEnvKey] = useState("");
  const [pollingInterval, setPollingInterval] = useState("30");
  const [allowedCategories, setAllowedCategories] = useState("Nasional, Ekonomi, Kebijakan Publik");
  const [licenseNotes, setLicenseNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Action status
  const [testingId, setTestingId] = useState<string | null>(null);
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ id?: string; text: string; isError?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleOpenAdd = () => {
    setEditingSource(null);
    setName("");
    setWebsiteUrl("");
    setType("RSS");
    setUrl("");
    setAuthType("NONE");
    setAuthSecretEnvKey("");
    setPollingInterval("30");
    setAllowedCategories("Nasional, Ekonomi");
    setLicenseNotes("Siaran pers publik resmi / izin atribusi jurnalistik.");
    setIsActive(true);
    setFeedbackMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedbackMsg(null);

    const payload = {
      name,
      websiteUrl,
      type,
      url,
      authType,
      authSecretEnvKey,
      pollingInterval: parseInt(pollingInterval, 10),
      allowedCategories,
      licenseNotes,
      isActive,
    };

    try {
      const isEdit = !!editingSource;
      const endpoint = isEdit ? `/api/news-sources/${editingSource.id}` : "/api/news-sources";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan sumber.");

      if (isEdit) {
        setSources((prev) => prev.map((s) => (s.id === editingSource.id ? { ...s, ...data.source } : s)));
      } else {
        setSources((prev) => [{ ...data.source, _count: { items: 0 } }, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Gagal menyimpan sumber.", isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (source: SourceItem) => {
    setTestingId(source.id);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/news-sources/${source.id}/test`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Uji koneksi gagal.");

      setFeedbackMsg({ id: source.id, text: data.message, isError: false });
    } catch (err: any) {
      setFeedbackMsg({ id: source.id, text: err.message, isError: true });
    } finally {
      setTestingId(null);
    }
  };

  const handleManualFetch = async (source: SourceItem) => {
    setFetchingId(source.id);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/news-sources/${source.id}/fetch`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menarik data.");

      const { fetchedCount, newDiscoveredCount, duplicateCount } = data.stats;
      setFeedbackMsg({
        id: source.id,
        text: `Sukses! Ditarik: ${fetchedCount} item | Baru Disimpan: ${newDiscoveredCount} | Duplikat Diabaikan: ${duplicateCount}`,
        isError: false,
      });

      // Update source in local list
      setSources((prev) =>
        prev.map((s) =>
          s.id === source.id
            ? { ...s, lastFetchedAt: new Date(), itemCount: s.itemCount + newDiscoveredCount }
            : s
        )
      );
    } catch (err: any) {
      setFeedbackMsg({ id: source.id, text: err.message, isError: true });
    } finally {
      setFetchingId(null);
    }
  };

  const handleToggleActive = async (source: SourceItem) => {
    const updatedStatus = !source.isActive;
    const res = await fetch(`/api/news-sources/${source.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...source, isActive: updatedStatus }),
    });

    if (res.ok) {
      setSources((prev) =>
        prev.map((s) => (s.id === source.id ? { ...s, isActive: updatedStatus } : s))
      );
    }
  };

  const handleDelete = async (source: SourceItem) => {
    if (!confirm(`Hapus sumber berita "${source.name}" beserta riwayatnya?`)) return;
    const res = await fetch(`/api/news-sources/${source.id}`, { method: "DELETE" });
    if (res.ok) {
      setSources((prev) => prev.filter((s) => s.id !== source.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Pusat Integrasi Feed Eksternal
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Manajemen Sumber Berita & Siaran Pers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi feed RSS resmi, API berlisensi, proteksi keamanan SSRF, dan pengujian koneksi.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Sumber Konten
        </button>
      </div>

      {feedbackMsg && !feedbackMsg.id && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            feedbackMsg.isError
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {feedbackMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Modal Add / Edit Source */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-serif font-bold text-base text-brand-navy">
                {editingSource ? "Sunting Sumber Berita" : "Tambah Sumber Berita Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Sumber *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Misal: Siaran Pers Kemkominfo"
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Sumber *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
                  >
                    <option value="RSS">RSS / Atom Feed</option>
                    <option value="PRESS_RELEASE">Siaran Pers Resmi Pemerintah</option>
                    <option value="LICENSED_API">API Berita Berlisensi</option>
                    <option value="GOV_SOURCE">Kanal Data Publik Terbuka</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  URL Endpoint Feed RSS / API *
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="https://kominfo.go.id/feed atau https://antaranews.com/rss/..."
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Sistem menerapkan filter SSRF ketat yang memblokir akses ke alamat IP privat, loopback, dan jaringan internal.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Situs Web Induk</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://kominfo.go.id"
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interval Penarikan (Menit)</label>
                  <input
                    type="number"
                    value={pollingInterval}
                    onChange={(e) => setPollingInterval(e.target.value)}
                    min={5}
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Yang Diizinkan</label>
                  <input
                    type="text"
                    value={allowedCategories}
                    onChange={(e) => setAllowedCategories(e.target.value)}
                    placeholder="Nasional, Teknologi, Ekonomi"
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Lisensi & Kepatuhan Hak Cipta</label>
                <textarea
                  rows={3}
                  value={licenseNotes}
                  onChange={(e) => setLicenseNotes(e.target.value)}
                  placeholder="Keterangan izin atribusi rilis publik, syarat tautan sumber, atau kontrak lisensi kantor berita..."
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-300 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-brand-red text-white font-bold hover:bg-brand-red-dark"
                >
                  {saving ? "Menyimpan..." : "Simpan Sumber"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sources Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Nama Sumber & Tipe</th>
                <th className="px-4 py-3">URL Endpoint Feed</th>
                <th className="px-4 py-3 text-center">Interval</th>
                <th className="px-4 py-3">Sinkronisasi Terakhir</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Total Ditarik</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase">
                      {s.type}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-slate-600 max-w-xs truncate" title={s.url}>
                    {s.url}
                  </td>

                  <td className="px-4 py-3.5 text-center text-slate-600 font-semibold">
                    {s.pollingInterval} mnt
                  </td>

                  <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                    {s.lastFetchedAt ? (
                      format(new Date(s.lastFetchedAt), "d MMM HH:mm", { locale: id })
                    ) : (
                      <span className="text-slate-400 italic">Belum pernah</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.isActive ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>

                  <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                    {s.itemCount || s._count.items || 0}
                  </td>

                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleTestConnection(s)}
                        disabled={testingId === s.id}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1"
                        title="Uji Koneksi SSRF Aman"
                      >
                        <Wifi className="w-3 h-3 text-blue-600" />
                        {testingId === s.id ? "Menguji..." : "Uji"}
                      </button>

                      <button
                        onClick={() => handleManualFetch(s)}
                        disabled={fetchingId === s.id || !s.isActive}
                        className="px-2 py-1 rounded bg-brand-navy hover:bg-brand-red text-white font-semibold flex items-center gap-1 disabled:bg-slate-300"
                        title="Tarik Berita Sekarang"
                      >
                        <Play className="w-3 h-3 text-white" />
                        {fetchingId === s.id ? "Menarik..." : "Tarik"}
                      </button>

                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Hapus Sumber"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {feedbackMsg && feedbackMsg.id === s.id && (
                      <div
                        className={`text-[10px] mt-1 text-right font-medium ${
                          feedbackMsg.isError ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {feedbackMsg.text}
                      </div>
                    )}
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

