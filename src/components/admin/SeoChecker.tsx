"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Search, Share2 } from "lucide-react";

interface SeoCheckerProps {
  title: string;
  summary: string;
  content: string;
  slug: string;
  featuredImage: string;
  imageAlt: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  authorId: string;
  sourceReferences: string;
  categorySlug: string;
}

export function SeoChecker({
  title,
  summary,
  content,
  slug,
  featuredImage,
  imageAlt,
  metaTitle,
  metaDescription,
  canonicalUrl,
  authorId,
  sourceReferences,
  categorySlug,
}: SeoCheckerProps) {
  // Strip HTML tags for word count
  const cleanBody = content.replace(/<[^>]*>/g, " ").trim();
  const wordCount = cleanBody ? cleanBody.split(/\s+/).filter(Boolean).length : 0;

  const displayTitle = metaTitle || title || "Judul Artikel Catatan Negeri";
  const displayDesc = metaDescription || summary || "Ringkasan berita dan laporan mendalam dari redaksi Catatan Negeri...";
  const displayUrl = canonicalUrl || `https://catatannegeri.com/${categorySlug || "berita"}/${slug || "judul-artikel"}`;

  // Quality checks
  const checks = [
    {
      label: "Judul Berita (Headline)",
      pass: title.length >= 10 && title.length <= 100,
      warning: title.length > 0 && title.length < 10,
      fail: !title,
      message: !title
        ? "Judul wajib diisi"
        : title.length < 10
        ? "Judul terlalu pendek (minimal 10 karakter)"
        : title.length > 100
        ? "Judul panjang, pertimbangkan SEO title tersendiri"
        : "Panjang judul optimal",
    },
    {
      label: "Slug URL Ramah Mesin Pencari",
      pass: slug.length >= 3 && /^[a-z0-9-]+$/.test(slug),
      fail: !slug || !/^[a-z0-9-]+$/.test(slug),
      message: !slug
        ? "Slug URL wajib diisi"
        : !/^[a-z0-9-]+$/.test(slug)
        ? "Slug hanya boleh berisi huruf kecil, angka, dan strip"
        : "Format slug bersih dan kanonikal",
    },
    {
      label: "Meta Description",
      pass: displayDesc.length >= 80 && displayDesc.length <= 160,
      warning: displayDesc.length > 0 && (displayDesc.length < 80 || displayDesc.length > 160),
      fail: !displayDesc,
      message: !displayDesc
        ? "Meta description kosong"
        : displayDesc.length < 80
        ? `Deskripsi (${displayDesc.length} kar.) agak singkat, sarankan 120-160 karakter`
        : displayDesc.length > 160
        ? `Deskripsi (${displayDesc.length} kar.) akan terpotong di Google SERP (>160 kar.)`
        : `Panjang deskripsi ideal (${displayDesc.length} karakter)`,
    },
    {
      label: "Gambar Utama & Teks Alternatif (Alt Text)",
      pass: !!featuredImage && !!imageAlt,
      warning: !!featuredImage && !imageAlt,
      fail: !featuredImage,
      message: !featuredImage
        ? "Belum ada gambar utama"
        : !imageAlt
        ? "Gambar ada, tetapi teks alternatif (Alt Text) masih kosong"
        : "Gambar utama dan Alt Text lengkap",
    },
    {
      label: "Target Kedalaman Konten (1.200 Kata SEO)",
      pass: wordCount >= 1100,
      warning: wordCount >= 500 && wordCount < 1100,
      fail: wordCount < 500,
      message: wordCount < 500
        ? `Konten terlalu pendek (${wordCount} kata). Target artikel pilar adalah 1.200 kata.`
        : wordCount < 1100
        ? `Kedalaman konten menengah (${wordCount} kata). Tambahkan sub-analisis/FAQ untuk menyentuh target pilar 1.200 kata.`
        : `Target Pilar 1.200 Kata Tercapai (${wordCount} kata) — Standar E-E-A-T Skyscraper Google SERP!`,
    },
    {
      label: "Struktur Heading (H2/H3 Hierarkis)",
      pass: /<h2[\s>]/i.test(content) && /<h3[\s>]/i.test(content),
      warning: /<h2[\s>]/i.test(content) && !/<h3[\s>]/i.test(content),
      fail: !/<h2[\s>]/i.test(content),
      message: !/<h2[\s>]/i.test(content)
        ? "Belum ada subjudul H2. Gunakan H2 untuk memecah artikel panjang agar mudah dibaca."
        : !/<h3[\s>]/i.test(content)
        ? "Terdapat H2, namun disarankan menambahkan sub-bagian H3 untuk rincian analisis teknis."
        : "Struktur heading H2 dan H3 tersusun hierarkis dan ramah Google Featured Snippet",
    },
    {
      label: "Atribusi Jurnalis / Penulis",
      pass: !!authorId,
      fail: !authorId,
      message: authorId ? "Penulis telah dipilih" : "Wajib memilih jurnalis penanggung jawab",
    },
    {
      label: "Rujukan & Verifikasi Sumber",
      pass: !!sourceReferences,
      warning: !sourceReferences,
      message: sourceReferences
        ? "Rujukan sumber terlampir"
        : "Belum mencantumkan rujukan sumber berita resmi",
    },
  ];

  const passedCount = checks.filter((c) => c.pass).length;
  const scorePercent = Math.round((passedCount / checks.length) * 100);

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h4 className="font-serif font-bold text-sm text-brand-navy">
            Skor Kualitas Konten & SEO
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {passedCount} dari {checks.length} indikator terpenuhi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xl font-black font-serif px-3 py-1 rounded-lg ${
              scorePercent >= 80
                ? "bg-emerald-100 text-emerald-800"
                : scorePercent >= 60
                ? "bg-amber-100 text-amber-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {scorePercent}%
          </span>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2.5">
        {checks.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-white text-xs"
          >
            {item.pass ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : item.warning ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-bold text-slate-800 block">{item.label}</span>
              <span className="text-slate-500 text-[11px]">{item.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Google SERP Preview Simulation */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold text-slate-700">
          <Search className="w-3.5 h-3.5 text-blue-600" />
          <span>Pratinjau Tampilan Google SERP (Desktop & Mobile)</span>
        </div>
        <div className="pt-2 font-sans">
          <div className="flex items-center gap-2 text-[11px] text-slate-700 mb-0.5">
            <span className="font-semibold text-slate-900">Catatan Negeri</span>
            <span className="text-slate-400">&rsaquo;</span>
            <span className="text-slate-500 truncate max-w-xs">{displayUrl}</span>
          </div>
          <h4 className="text-[#1a0dab] hover:underline text-base font-medium line-clamp-1 cursor-pointer leading-snug">
            {displayTitle}
          </h4>
          <p className="text-xs text-[#4d5156] line-clamp-2 mt-1 leading-relaxed">
            {displayDesc}
          </p>
        </div>
      </div>

      {/* Social Card Preview */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold text-slate-700">
          <Share2 className="w-3.5 h-3.5 text-brand-navy" />
          <span>Pratinjau Bagikan Media Sosial (OG Card)</span>
        </div>
        <div className="border border-slate-200 rounded-lg overflow-hidden mt-2 bg-slate-50">
          <div className="relative aspect-[1.91/1] w-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs">
            {featuredImage ? (
              <img src={featuredImage} alt="OG Preview" className="w-full h-full object-cover" />
            ) : (
              <span>[Belum ada gambar utama]</span>
            )}
          </div>
          <div className="p-3 bg-white">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              catatannegeri.com
            </span>
            <h5 className="font-serif font-bold text-xs text-brand-navy line-clamp-1 mt-0.5">
              {displayTitle}
            </h5>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
              {displayDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

