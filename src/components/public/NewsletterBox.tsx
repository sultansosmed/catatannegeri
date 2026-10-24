"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

export function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftar newsletter.");
      }

      setStatus("success");
      setMessage("Terima kasih! Anda telah terdaftar dalam buletin harian Catatan Negeri.");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Terjadi kesalahan.");
    }
  };

  return (
    <div className="bg-gradient-to-br from-brand-navy to-slate-900 text-white rounded-lg p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-5 h-5 text-brand-red-light" />
        <h4 className="font-serif font-bold text-base">Buletin Catatan Negeri</h4>
      </div>
      <p className="text-xs text-slate-300 mb-4 leading-relaxed">
        Dapatkan rangkuman kurasi berita nasional, analisis kebijakan, dan wawasan terpercaya langsung di kotak masuk surel Anda setiap pagi.
      </p>

      {status === "success" ? (
        <div className="flex items-start gap-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs p-3 rounded">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Alamat surel Anda..."
            required
            className="w-full px-3 py-2 text-xs rounded bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-brand-red hover:bg-brand-red-dark disabled:bg-slate-600 text-white text-xs font-bold py-2 rounded transition-colors"
          >
            {status === "loading" ? "Memproses..." : "Langganan Gratis"}
          </button>
          {status === "error" && (
            <div className="flex items-center gap-1.5 text-red-300 text-[11px] pt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}
          <p className="text-[10px] text-slate-400 text-center pt-1">
            Privasi Anda terjamin. Berhenti berlangganan kapan saja dengan 1 klik.
          </p>
        </form>
      )}
    </div>
  );
}

