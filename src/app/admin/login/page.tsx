"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk ke sistem redaksi.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-navy p-2 shadow-md mb-3">
          <Image
            src="/brand/logo.png"
            alt="Logo Catatan Negeri"
            width={48}
            height={48}
            className="object-contain"
          />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-black text-brand-navy">
          Portal Redaksi Catatan Negeri
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Sistem Manajemen Konten & Alur Kerja Editorial Terpadu
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Surel Redaksi
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="editor@catatannegeri.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-brand-navy hover:bg-brand-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red disabled:bg-slate-400 transition-colors"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Dashboard Redaksi"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Akses Cepat Pengujian Redaksi (Demo):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("redaksi@catatannegeri.com", "Admin123!CatatanNegeri")}
                className="p-1.5 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 text-center"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("editor@catatannegeri.com", "Editor123!CatatanNegeri")}
                className="p-1.5 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 text-center"
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("dewi.lestari@catatannegeri.com", "Wartawan123!CatatanNegeri")}
                className="p-1.5 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 text-center"
              >
                Wartawan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

