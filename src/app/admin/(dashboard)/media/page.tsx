"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, Copy, Check, Image as ImageIcon, Trash2, AlertCircle } from "lucide-react";

export default function MediaLibraryPage() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadMedia = async () => {
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      if (data.media) {
        setMediaList(data.media);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", altText);
    formData.append("caption", caption);
    formData.append("credit", credit);

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah foto.");
      }

      setFile(null);
      setAltText("");
      setCaption("");
      setCredit("");
      loadMedia();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
          Aset Visual Editorial
        </span>
        <h1 className="font-serif text-2xl font-black text-brand-navy">
          Pustaka Media & Galeri Foto
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Penyimpanan foto dan infografik dengan optimasi pengiriman Next.js.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-serif font-bold text-base text-brand-navy mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-brand-red" />
          Unggah Gambar Baru
        </h3>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Berkas Gambar (JPG, PNG, WebP, AVIF, Maks 5MB) *
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-brand-navy hover:file:bg-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teks Alternatif (Alt Text SEO) *
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Deskripsi objek gambar untuk aksesibilitas & Google Image..."
                required
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Keterangan Foto (Kepsyen Berita)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Contoh: Suasana pembukaan rapat kerja di Gedung Nusantara..."
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kredit Sumber / Fotografer
              </label>
              <input
                type="text"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder="Contoh: Dok. Humas / LKBN Antara"
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="bg-brand-navy hover:bg-brand-red disabled:bg-slate-300 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Mengunggah..." : "Mulai Unggah ke Server"}
          </button>
        </form>
      </div>

      {/* Media Grid */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-serif font-bold text-base text-brand-navy mb-4">
          Arsip Berkas ({mediaList.length})
        </h3>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Memuat galeri...</div>
        ) : mediaList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="group border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] w-full bg-slate-200 overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.altText || item.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="p-2 text-[10px] space-y-1 bg-white">
                  <p className="font-semibold text-slate-800 truncate" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <p className="text-slate-400 truncate">
                    {(item.sizeBytes / 1024).toFixed(0)} KB &bull; {item.mimeType.split("/")[1]}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.url)}
                    className="w-full mt-1 flex items-center justify-center gap-1 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p>Belum ada media yang diunggah.</p>
          </div>
        )}
      </div>
    </div>
  );
}

