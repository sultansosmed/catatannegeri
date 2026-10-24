import React from "react";
import { Metadata } from "next";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — Catatan Negeri",
  description: "Kebijakan perlindungan data pribadi pengunjung Catatan Negeri sesuai dengan UU Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022).",
  alternates: {
    canonical: `${SITE_URL}/kebijakan-privasi`,
  },
};

export default function KebijakanPrivasiPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ name: "Kebijakan Privasi", url: "/kebijakan-privasi" }]} />

      <article className="prose prose-slate max-w-none">
        <header className="border-b-2 border-brand-navy pb-4 mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-red">
            Perlindungan Data Pribadi
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-navy mt-1 mb-2">
            Kebijakan Privasi
          </h1>
          <p className="text-xs text-slate-500">
            Kepatuhan terhadap Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi
          </p>
        </header>

        <p>
          Catatan Negeri (<strong>catatannegeri.com</strong>) menghargai dan melindungi privasi setiap pengunjung. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan menjaga informasi pribadi Anda saat mengakses portal kami.
        </p>

        <h2>1. Informasi yang Kami Kumpulkan</h2>
        <ul>
          <li><strong>Data yang Anda Berikan Secara Sukarela:</strong> Alamat surel saat berlangganan buletin berita atau saat mengirim pesan formulir kontak.</li>
          <li><strong>Data Teknis Otomatis:</strong> Alamat IP, jenis peramban (browser), halaman yang dikunjungi, dan durasi kunjungan melalui kuki (cookies) standar yang bertujuan untuk mengukur performa teknis portal dan penayangan iklan yang relevan.</li>
        </ul>

        <h2>2. Penggunaan Informasi</h2>
        <p>
          Informasi yang dikumpulkan hanya digunakan semata-mata untuk:
        </p>
        <ul>
          <li>Mengirimkan buletin berita pilihan yang telah Anda setujui.</li>
          <li>Menganalisis performa artikel dan ketahanan server guna memastikan Core Web Vitals optimal.</li>
          <li>Mencegah aktivitas spam, serangan siber, atau penyalahgunaan kolom interaktif.</li>
        </ul>

        <h2>3. Larangan Penjualan Data</h2>
        <p>
          Catatan Negeri tidak pernah dan tidak akan pernah menjual, menyewakan, atau memperdagangkan data pribadi pengguna kepada pihak ketiga mana pun untuk tujuan komersial di luar ketentuan hukum Republik Indonesia.
        </p>
      </article>
    </main>
  );
}

