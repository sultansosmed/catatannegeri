import React from "react";
import { Metadata } from "next";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Kebijakan Ralat, Koreksi & Hak Jawab — Catatan Negeri",
  description: "Mekanisme pengajuan koreksi, ralat faktual, dan pemenuhan hak jawab pembaca sesuai UU Pers di Catatan Negeri.",
  alternates: {
    canonical: `${SITE_URL}/kebijakan-koreksi`,
  },
};

export default function KebijakanKoreksiPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ name: "Kebijakan Koreksi", url: "/kebijakan-koreksi" }]} />

      <article className="prose prose-slate max-w-none">
        <header className="border-b-2 border-brand-navy pb-4 mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-red">
            Transparansi & Akuntabilitas Jurnalistik
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-navy mt-1 mb-2">
            Kebijakan Ralat, Koreksi & Hak Jawab
          </h1>
          <p className="text-xs text-slate-500">
            Komitmen penegakan akurasi informasi dan hak publik untuk meluruskan kekeliruan fakta
          </p>
        </header>

        <p>
          Kepercayaan pembaca adalah modal utama <strong>Catatan Negeri</strong>. Meskipun seluruh artikel dan laporan investigasi melalui proses verifikasi berlapis, kekeliruan faktual dapat terjadi tanpa sengaja. Kami berkomitmen untuk memperbaiki kesalahan tersebut secepat mungkin secara terbuka dan transparan.
        </p>

        <h2>1. Prosedur Pengajuan Ralat dan Hak Jawab</h2>
        <p>
          Bagi narasumber, subjek pemberitaan, atau pembaca yang menemukan kekeliruan data, kutipan, nama, jabatan, angka, atau fakta dalam pemberitaan Catatan Negeri, Anda dapat menyampaikan permohonan koreksi melalui surel resmi redaksi:
        </p>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg my-4 text-sm not-prose">
          <p><strong>Surel Khusus Koreksi:</strong> redaksi@catatannegeri.com</p>
          <p><strong>Subjek Surel:</strong> [PERMOHONAN RALAT/HAK JAWAB] - Judul Berita - Tanggal</p>
          <p><strong>Lampirkan:</strong> Tautan artikel, bagian yang keliru, data/dokumen pendukung yang valid, serta identitas pemohon.</p>
        </div>

        <h2>2. Standar Transparansi Koreksi (Correction Note)</h2>
        <p>
          Setiap perbaikan artikel yang bersifat substantif akan disertai dengan <em>Correction Box</em> (Catatan Ralat) di bagian bawah artikel yang mencantumkan:
        </p>
        <ul>
          <li>Waktu (tanggal dan jam) koreksi dilakukan.</li>
          <li>Keterangan perbaikan fakta yang telah disunting.</li>
          <li>Permohonan maaf redaksi atas kekhilafan jika menyangkut kesalahan data mendasar.</li>
        </ul>

        <h2>3. Penanganan Hak Jawab</h2>
        <p>
          Hak Jawab adalah hak seseorang atau sekelompok orang untuk memberikan tanggapan atau sanggahan terhadap pemberitaan berupa fakta yang merugikan nama baiknya. Hak Jawab akan dimuat dalam waktu 1x24 jam sejak surat atau materi resmi diterima, dengan proporsi dan penempatan yang seimbang.
        </p>
      </article>
    </main>
  );
}

