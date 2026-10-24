"use client";

import React, { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-8 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <h4 className="font-serif font-bold text-lg">Pesan Terkirim</h4>
        <p className="text-xs text-emerald-800 max-w-sm mx-auto leading-relaxed">
          Terima kasih. Pesan Anda telah diterima oleh dewan redaksi Catatan Negeri. Kami akan meninjau dan merespons dalam waktu 1x24 jam kerja.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
          <input
            type="text"
            required
            placeholder="Nama Anda"
            className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Surel (Email) *</label>
          <input
            type="email"
            required
            placeholder="email@domain.com"
            className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Perihal / Kategori Pesan *</label>
        <select className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white">
          <option value="pengaduan">Pengaduan Pemberitaan / Hak Jawab</option>
          <option value="siaran-pers">Siaran Pers / Undangan Liputan</option>
          <option value="iklan">Pemasangan Iklan & Kemitraan</option>
          <option value="umum">Pertanyaan Umum / Saran</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Isi Pesan *</label>
        <textarea
          rows={5}
          required
          placeholder="Tuliskan pesan lengkap Anda di sini..."
          className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
        ></textarea>
      </div>

      <button
        type="submit"
        className="w-full bg-brand-navy hover:bg-brand-red text-white text-xs font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <Send className="w-4 h-4" />
        Kirim Pesan ke Redaksi
      </button>
    </form>
  );
}

