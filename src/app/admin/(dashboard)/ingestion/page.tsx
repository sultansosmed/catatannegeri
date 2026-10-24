"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Radio, RefreshCw, CheckCircle, ExternalLink, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function IngestionPage() {
  const router = useRouter();
  const [fetching, setFetching] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCatMap, setSelectedCatMap] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    try {
      const [catsRes, itemsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/articles"), // or fetch pending ingested
      ]);
      const catsData = await catsRes.json();
      if (catsData.categories) setCategories(catsData.categories);
    } catch {
      //
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFetchAll = async () => {
    setFetching(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/ingestion/fetch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil data feed.");

      setStatusMessage("Pengambilan siaran pers resmi selesai! Duplikasi otomatis disaring.");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Pipeline Agregasi Terkendali
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Pipeline Berita & Siaran Pers Resmi (RSS)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penyerapan rilis resmi pemerintah, deteksi duplikasi artikel, dan alur verifikasi redaksi manusia.
          </p>
        </div>

        <button
          onClick={handleFetchAll}
          disabled={fetching}
          className="bg-brand-navy hover:bg-brand-red disabled:bg-slate-300 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
          {fetching ? "Mengambil Data..." : "Tarik Siaran Pers Terbaru"}
        </button>
      </div>

      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Compliance Guidelines */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-xs text-amber-950 space-y-2">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-900">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          Kepatuhan Etika Jurnalistik & Hak Cipta
        </div>
        <p className="leading-relaxed">
          Seluruh materi yang ditarik melalui modul ini berasal dari rilis publik resmi (Kominfo, Lembaga Negara, dan Kantor Berita). Sistem secara otomatis menyaring duplikasi dengan indeks similaritas Jaccard &gt; 70%.
        </p>
        <p className="font-semibold text-amber-900">
          Aturan Redaksi: Seluruh item yang diubah menjadi draf TIDAK AKAN PERNAH terbit otomatis. Draf wajib melalui penyuntingan orisinal, konfirmasi fakta lapangan, dan persetujuan Redaktur sebelum status dialihkan ke PUBLISHED.
        </p>
      </div>

      {/* Ingestion Sources Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="font-serif font-bold text-base text-brand-navy mb-4 flex items-center gap-2">
          <Radio className="w-4 h-4 text-brand-red" />
          Konektor Sumber Resmi Terdaftar
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">LKBN Antara News Terkini</p>
              <p className="text-slate-400 font-mono text-[11px]">https://www.antaranews.com/rss/terkini.xml</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              AKTIF
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">Siaran Pers Resmi Kominfo RI</p>
              <p className="text-slate-400 font-mono text-[11px]">https://www.kominfo.go.id/feed</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              AKTIF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

