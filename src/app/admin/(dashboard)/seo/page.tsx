"use client";

import React, { useState, useEffect } from "react";
import { Search, Save, CheckCircle, ExternalLink, Globe, ShieldCheck, AlertCircle, Zap, RefreshCw } from "lucide-react";

export default function AdminSeoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResults, setPingResults] = useState<any[] | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [seo, setSeo] = useState({
    seo_meta_title_template: "%s — Catatan Negeri",
    seo_default_description: "Portal berita dan informasi digital Indonesia terpercaya. Menyajikan liputan peristiwa aktual, analisis mendalam, kebijakan publik, dan panduan teruji.",
    seo_google_site_verification: "",
    seo_google_analytics_id: "",
    seo_default_og_image: "/brand/og-default.png",
    seo_bing_site_verification: "",
  });

  useEffect(() => {
    fetch("/api/seo")
      .then((r) => r.json())
      .then((data) => {
        if (data.seo) {
          setSeo((prev) => ({ ...prev, ...data.seo }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, val: string) => {
    setSeo((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seo),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan.");

      setStatusMsg("Konfigurasi SEO teknis & kode verifikasi berhasil diperbarui!");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal.");
    } finally {
      setSaving(false);
    }
  };

  const handlePingAll = async () => {
    setPingLoading(true);
    setStatusMsg("");
    setErrorMsg("");
    try {
      const res = await fetch("/api/seo/fast-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PING_ALL_RECENT" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim sinyal ping.");
      setPingResults(data.results || []);
      setStatusMsg(data.message || "Sinyal percepatan indeks berhasil dikirim!");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengirim sinyal ping.");
    } finally {
      setPingLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-xs text-slate-500">Memuat konfigurasi SEO...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Visibilitas Mesin Pencari
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Konfigurasi Technical SEO & Webmaster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan metadata global, Google Search Console, Google Analytics 4, dan verifikasi domain.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red-dark disabled:bg-slate-300 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
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

      {/* Sitemaps Quick Verification Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-serif font-bold text-base text-brand-navy flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-navy" />
              Sitemap & Protokol Indeks Instan Aktif
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh berkas ini terindeks secara dinamis (*real-time*) dan siap didaftarkan ke Google Search Console:
            </p>
          </div>

          <button
            type="button"
            onClick={handlePingAll}
            disabled={pingLoading}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all"
          >
            <Zap className={`w-3.5 h-3.5 text-white ${pingLoading ? "animate-spin" : ""}`} />
            <span>{pingLoading ? "Mengirim Ping..." : "🚀 Ping Cepat Googlebot & IndexNow"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">XML Sitemap Index</p>
              <p className="text-slate-400 font-mono text-[10px]">/sitemap.xml</p>
            </div>
            <a
              href="/sitemap.xml"
              target="_blank"
              className="text-brand-red hover:underline flex items-center gap-1 font-semibold"
            >
              Uji <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">Google News Sitemap</p>
              <p className="text-slate-400 font-mono text-[10px]">/news-sitemap.xml</p>
            </div>
            <a
              href="/news-sitemap.xml"
              target="_blank"
              className="text-brand-red hover:underline flex items-center gap-1 font-semibold"
            >
              Uji <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">WebSub RSS Feed</p>
              <p className="text-slate-400 font-mono text-[10px]">/rss.xml</p>
            </div>
            <a
              href="/rss.xml"
              target="_blank"
              className="text-brand-red hover:underline flex items-center gap-1 font-semibold"
            >
              Uji <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">IndexNow Token Key</p>
              <p className="text-slate-400 font-mono text-[10px]">/cn98a72ef31b40289a87d0e4125b0f19.txt</p>
            </div>
            <a
              href="/cn98a72ef31b40289a87d0e4125b0f19.txt"
              target="_blank"
              className="text-brand-red hover:underline flex items-center gap-1 font-semibold"
            >
              Uji <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Live Ping Results Panel */}
        {pingResults && pingResults.length > 0 && (
          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-2 animate-in fade-in text-xs">
            <span className="font-bold text-white block text-[11px] uppercase tracking-wider text-amber-400">
              Hasil Notifikasi Mesin Pencari (Live Search Engine Status):
            </span>
            <div className="space-y-1.5">
              {pingResults.map((res: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${res.success ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"}`}>
                    {res.success ? "SUKSES" : "GAGAL"}
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-white block">{res.engine}</span>
                    <span className="text-[11px] text-slate-300">{res.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <h3 className="font-serif font-bold text-base text-brand-navy border-b border-slate-200 pb-2">
            Metadata Standar & SERP Snippet
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pola Template Judul SEO (Title Template)
            </label>
            <input
              type="text"
              value={seo.seo_meta_title_template}
              onChange={(e) => handleChange("seo_meta_title_template", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Meta Description Default (Fallback)
            </label>
            <textarea
              rows={4}
              value={seo.seo_default_description}
              onChange={(e) => handleChange("seo_default_description", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Gambar Standar Open Graph (Social Sharing)
            </label>
            <input
              type="text"
              value={seo.seo_default_og_image}
              onChange={(e) => handleChange("seo_default_og_image", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <h3 className="font-serif font-bold text-base text-brand-navy border-b border-slate-200 pb-2">
            Integrasi Webmaster & Analisis
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Google Site Verification Token (Search Console HTML Tag)
            </label>
            <input
              type="text"
              value={seo.seo_google_site_verification}
              onChange={(e) => handleChange("seo_google_site_verification", e.target.value)}
              placeholder="Contoh: google-site-verification=abc123xyz"
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Verifikasi properti domain Catatan Negeri di Google Search Console.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Google Analytics 4 Measurement ID (GA4)
            </label>
            <input
              type="text"
              value={seo.seo_google_analytics_id}
              onChange={(e) => handleChange("seo_google_analytics_id", e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bing Webmaster Verification Code
            </label>
            <input
              type="text"
              value={seo.seo_bing_site_verification}
              onChange={(e) => handleChange("seo_bing_site_verification", e.target.value)}
              placeholder="Kode verifikasi Bing Webmaster Tools"
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
            />
          </div>
        </div>
      </div>
    </form>
  );
}

