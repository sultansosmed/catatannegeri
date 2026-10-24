"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Save, CheckCircle, AlertCircle, Megaphone, Layout, ShieldAlert } from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [settings, setSettings] = useState<Record<string, string>>({
    site_title: "Catatan Negeri",
    site_tagline: "Portal Berita & Informasi Digital Indonesia",
    breaking_news_enabled: "true",
    breaking_news_text: "",
    ad_homepage_top_enabled: "true",
    ad_homepage_top_html: "",
    ad_sidebar_enabled: "true",
    ad_sidebar_html: "",
    ad_in_content_enabled: "true",
    ad_in_content_html: "",
    contact_email: "redaksi@catatannegeri.com",
    contact_phone: "+62 21 5550 1234",
    office_address: "Gedung Pers, Jl. Kebon Sirih No. 45, Jakarta Pusat",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan.");

      setStatusMsg("Pengaturan situs dan slot pariwara berhasil diperbarui!");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-xs text-slate-500">Memuat pengaturan situs...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Konfigurasi Portal
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Pengaturan Situs & Penempatan Iklan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola ticker breaking news, identitas brand media, dan ruang pariwara (monetisasi).
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red-dark disabled:bg-slate-300 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breaking News Ticker Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Megaphone className="w-5 h-5 text-brand-red" />
            <h3 className="font-serif font-bold text-base text-brand-navy">
              Ticker Berita Terkini (Breaking News)
            </h3>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-3">
              <input
                type="checkbox"
                checked={settings.breaking_news_enabled === "true"}
                onChange={(e) => handleChange("breaking_news_enabled", e.target.checked ? "true" : "false")}
                className="rounded border-slate-300 text-brand-red focus:ring-brand-red"
              />
              <span>Aktifkan Pita Breaking News di Header Publik</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teks Berita Terkini Default (Bila tidak ada artikel breaking)
            </label>
            <textarea
              rows={3}
              value={settings.breaking_news_text || ""}
              onChange={(e) => handleChange("breaking_news_text", e.target.value)}
              placeholder="BREAKING NEWS: ..."
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {/* Identity & Contact Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Layout className="w-5 h-5 text-brand-navy" />
            <h3 className="font-serif font-bold text-base text-brand-navy">
              Identitas & Kontak Redaksi
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Brand Media</label>
            <input
              type="text"
              value={settings.site_title || ""}
              onChange={(e) => handleChange("site_title", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tagline Media</label>
            <input
              type="text"
              value={settings.site_tagline || ""}
              onChange={(e) => handleChange("site_tagline", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Surel Redaksi</label>
            <input
              type="email"
              value={settings.contact_email || ""}
              onChange={(e) => handleChange("contact_email", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {/* Advertisements Placements (Section 13) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-serif font-bold text-lg text-brand-navy">
              Pengaturan Slot Iklan & Pariwara (Monetisasi Siap Tayang)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola script / kode embed HTML ruang iklan (AdSense, sponsor lokal, atau programmatic banner).
            </p>
          </div>

          {/* Ad 1: Homepage Top */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={settings.ad_homepage_top_enabled === "true"}
                onChange={(e) => handleChange("ad_homepage_top_enabled", e.target.checked ? "true" : "false")}
                className="rounded border-slate-300 text-brand-red focus:ring-brand-red"
              />
              <span>Slot 1: Leaderboard Banner Atas Beranda (728x90 / Responsif)</span>
            </label>
            <textarea
              rows={3}
              value={settings.ad_homepage_top_html || ""}
              onChange={(e) => handleChange("ad_homepage_top_html", e.target.value)}
              placeholder="<div ...> HTML / Script Iklan </div>"
              className="w-full px-3 py-2 text-xs font-mono rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
            />
          </div>

          {/* Ad 2: Desktop Sidebar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={settings.ad_sidebar_enabled === "true"}
                onChange={(e) => handleChange("ad_sidebar_enabled", e.target.checked ? "true" : "false")}
                className="rounded border-slate-300 text-brand-red focus:ring-brand-red"
              />
              <span>Slot 2: Kolom Samping Desktop / Sidebar (Medium Rectangle 300x250)</span>
            </label>
            <textarea
              rows={3}
              value={settings.ad_sidebar_html || ""}
              onChange={(e) => handleChange("ad_sidebar_html", e.target.value)}
              placeholder="<div ...> HTML / Script Iklan </div>"
              className="w-full px-3 py-2 text-xs font-mono rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
            />
          </div>

          {/* Ad 3: In-Content Article Placement */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={settings.ad_in_content_enabled === "true"}
                onChange={(e) => handleChange("ad_in_content_enabled", e.target.checked ? "true" : "false")}
                className="rounded border-slate-300 text-brand-red focus:ring-brand-red"
              />
              <span>Slot 3: Pariwara Dalam Naskah Artikel (In-Content Native Banner)</span>
            </label>
            <textarea
              rows={3}
              value={settings.ad_in_content_html || ""}
              onChange={(e) => handleChange("ad_in_content_html", e.target.value)}
              placeholder="<div ...> HTML / Script Iklan </div>"
              className="w-full px-3 py-2 text-xs font-mono rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
            />
          </div>
        </div>
      </div>
    </form>
  );
}

