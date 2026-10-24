import React from "react";
import { Metadata } from "next";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Layanan — Catatan Negeri",
  description: "Ketentuan penggunaan situs, hak cipta artikel, dan batasan tanggung jawab hukum portal Catatan Negeri.",
  alternates: {
    canonical: `${SITE_URL}/syarat-ketentuan`,
  },
};

export default function SyaratKetentuanPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ name: "Syarat & Ketentuan", url: "/syarat-ketentuan" }]} />

      <article className="prose prose-slate max-w-none">
        <header className="border-b-2 border-brand-navy pb-4 mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-red">
            Ketentuan Hukum Penggunaan
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-navy mt-1 mb-2">
            Syarat dan Ketentuan Layanan
          </h1>
          <p className="text-xs text-slate-500">
            Terakhir dimutakhirkan: 2026
          </p>
        </header>

        <p>
          Selamat datang di <strong>Catatan Negeri (catatannegeri.com)</strong>. Dengan mengakses dan menggunakan portal ini, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan berikut:
        </p>

        <h2>1. Hak Cipta dan Kekayaan Intelektual</h2>
        <p>
          Seluruh konten editorial, artikel, investigasi, foto berhak cipta, grafik, logo, dan tata letak yang dipublikasikan di catatannegeri.com dilindungi oleh Undang-Undang Republik Indonesia Nomor 28 Tahun 2014 tentang Hak Cipta. Pengutipan artikel diperkenankan maksimal 250 karakter dengan kewajiban mencantumkan sumber dan tautan aktif (dofollow) ke artikel asli.
        </p>

        <h2>2. Batasan Tanggung Jawab</h2>
        <p>
          Catatan Negeri berupaya maksimal menghadirkan informasi yang akurat dan mutakhir. Namun demikian, materi artikel yang bersinggungan dengan analisis keuangan, kesehatan, atau hukum disajikan sebagai edukasi umum dan bukan merupakan anjuran finansial atau nasihat medis pengganti tenaga profesional berlisensi.
        </p>

        <h2>3. Perubahan Ketentuan</h2>
        <p>
          Redaksi berhak mengubah syarat dan ketentuan ini sewaktu-waktu sesuai dengan perkembangan regulasi pers nasional dan perundang-undangan di Indonesia.
        </p>
      </article>
    </main>
  );
}

