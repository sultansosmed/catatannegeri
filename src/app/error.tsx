"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
      <div className="w-16 h-16 bg-red-100 text-brand-red rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="font-serif text-2xl font-bold text-brand-navy mb-2">
        Terjadi Kendala Teknis Sementara
      </h1>
      <p className="text-xs text-slate-600 max-w-md mb-6 leading-relaxed">
        Sistem redaksi Catatan Negeri mengalami gangguan saat memuat halaman ini. Tim teknologi kami telah mencatat kendala ini.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-1.5 bg-brand-navy hover:bg-brand-red text-white text-xs font-bold px-4 py-2 rounded transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Muat Ulang Halaman
        </button>
        <Link
          href="/"
          className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded hover:bg-slate-100 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

