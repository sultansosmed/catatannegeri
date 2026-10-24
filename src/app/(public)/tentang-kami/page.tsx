import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { Award, ShieldCheck, Users, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "Tentang Kami & Susunan Redaksi — Catatan Negeri",
  description: "Profil media Catatan Negeri, visi, misi, independensi editorial, dan susunan dewan redaksi.",
  alternates: {
    canonical: `${SITE_URL}/tentang-kami`,
  },
};

export default async function TentangKamiPage() {
  const authors = await db.authorProfile.findMany({
    where: { isPublic: true },
    include: { user: true },
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ name: "Tentang Kami", url: "/tentang-kami" }]} />

      <header className="border-b-2 border-brand-navy pb-6 mb-10 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-red">
          Profil & Nilai Redaksi
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-brand-navy mt-2 mb-4">
          Tentang Catatan Negeri
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Media informasi digital independen yang berikhtiar mencerdaskan bangsa melalui jurnalisme berimbang, investigasi mendalam, dan panduan publik teruji.
        </p>
      </header>

      {/* Visi & Nilai Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-brand-navy text-white flex items-center justify-center">
            <Target className="w-5 h-5 text-brand-red-light" />
          </div>
          <h3 className="font-serif font-bold text-lg text-brand-navy">Visi Redaksi</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Menjadi rujukan informasi digital paling kredibel di Indonesia yang menjunjung tinggi kebenaran fakta di atas kecepatan semu.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-brand-navy text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="font-serif font-bold text-lg text-brand-navy">Independensi Mutlak</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bebas dari kepemilikan partai politik, intervensi kelompok oligarki, atau tekanan komersial yang dapat mengompromikan objektivitas laporan.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-brand-navy text-white flex items-center justify-center">
            <Award className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="font-serif font-bold text-lg text-brand-navy">Verifikasi Faktual</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Menerapkan disiplin verifikasi ganda, konfirmasi data primer, dan pemisahan tegas antara fakta berita dan opini subjektif.
          </p>
        </div>
      </section>

      {/* Susunan Dewan Redaksi */}
      <section className="mb-12">
        <div className="border-b-2 border-brand-red pb-2 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-navy" />
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            Susunan Dewan Redaksi & Manajemen
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((auth) => (
            <div key={auth.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center shadow-sm">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 mb-3 border-2 border-slate-200">
                <Image
                  src={auth.avatar || "/brand/logo.png"}
                  alt={auth.displayName}
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="font-serif font-bold text-base text-brand-navy">
                <Link href={`/penulis/${auth.slug}`} className="hover:text-brand-red">
                  {auth.displayName}
                </Link>
              </h4>
              <p className="text-xs font-semibold text-brand-red uppercase tracking-wide mb-2">
                {auth.title || "Jurnalis Catatan Negeri"}
              </p>
              {auth.bio && (
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                  {auth.bio}
                </p>
              )}
              <Link
                href={`/penulis/${auth.slug}`}
                className="text-xs text-brand-navy font-semibold hover:underline mt-auto"
              >
                Lihat Profil & Arsip &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Legalitas Media */}
      <section className="bg-brand-navy text-white rounded-xl p-6 sm:p-8">
        <h3 className="font-serif text-xl font-bold mb-4">Badan Hukum & Legalitas Penerbit</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div>
            <p className="text-slate-400">Penerbit:</p>
            <p className="font-bold text-white text-sm">PT Catatan Media Negeri</p>
          </div>
          <div>
            <p className="text-slate-400">SK Menkumham RI:</p>
            <p className="font-bold text-white text-sm">AHU-0012948.AH.01.01.TAHUN 2026</p>
          </div>
          <div>
            <p className="text-slate-400">Nomor Induk Berusaha (NIB):</p>
            <p className="font-bold text-white text-sm">9120304910245</p>
          </div>
          <div>
            <p className="text-slate-400">KBLI Penerbitan Portal Web / Berita:</p>
            <p className="font-bold text-white text-sm">63122 (Aktivitas Portal Web)</p>
          </div>
        </div>
      </section>
    </main>
  );
}

