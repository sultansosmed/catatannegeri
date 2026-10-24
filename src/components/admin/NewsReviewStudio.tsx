"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ExternalLink,
  Save,
  Send,
  HelpCircle,
  FileCheck,
  Search,
  BookOpen,
  Info,
  Calendar,
  UserCheck,
  Check,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { getCategoryVisual } from "@/lib/category-images";

interface NewsReviewStudioProps {
  item: {
    id: string;
    sourceId: string;
    source: {
      id: string;
      name: string;
      type: string;
      websiteUrl: string | null;
      licenseNotes: string | null;
    };
    originalUrl: string;
    canonicalUrl: string | null;
    title: string;
    originalPublishedAt: string | Date | null;
    discoveredAt: string | Date;
    rawContent: string | null;
    excerpt: string | null;
    author: string | null;
    detectedCategory: string | null;
    status: string;
    duplicateOfId: string | null;
    duplicateScore: number | null;
    duplicateReason: string | null;
    editorialNotes: string | null;
    aiDraftTitle: string | null;
    aiDraftAlternativeTitles: string | null;
    aiDraftSummary: string | null;
    aiDraftContent: string | null;
    aiDraftOutline: string | null;
    aiRecommendedCategory: string | null;
    aiRecommendedTags: string | null;
    aiMetaTitle: string | null;
    aiMetaDescription: string | null;
    aiSuggestedInternalLinks: string | null;
    aiVerificationClaims: string | null;
    aiQualityAudit: string | null;
    isHighImpact: boolean;
    reviewedById: string | null;
    reviewedBy?: { id: string; name: string } | null;
    reviewedAt: string | Date | null;
    draftedArticleId: string | null;
  };
  categories: { id: string; name: string; slug: string }[];
  authors: { id: string; displayName: string }[];
  currentUserId: string;
}

export function NewsReviewStudio({
  item,
  categories,
  authors,
  currentUserId,
}: NewsReviewStudioProps) {
  const router = useRouter();

  // Parse JSON properties safely
  const alternativeHeadlines: string[] = React.useMemo(() => {
    try {
      return item.aiDraftAlternativeTitles ? JSON.parse(item.aiDraftAlternativeTitles) : [];
    } catch {
      return [];
    }
  }, [item.aiDraftAlternativeTitles]);

  const recommendedTags: string[] = React.useMemo(() => {
    try {
      return item.aiRecommendedTags ? JSON.parse(item.aiRecommendedTags) : [];
    } catch {
      return [];
    }
  }, [item.aiRecommendedTags]);

  const verificationClaims: { claim: string; verified?: boolean; context?: string }[] = React.useMemo(() => {
    try {
      return item.aiVerificationClaims ? JSON.parse(item.aiVerificationClaims) : [];
    } catch {
      return [];
    }
  }, [item.aiVerificationClaims]);

  const internalLinks: { title: string; slug: string; relevance: string }[] = React.useMemo(() => {
    try {
      return item.aiSuggestedInternalLinks ? JSON.parse(item.aiSuggestedInternalLinks) : [];
    } catch {
      return [];
    }
  }, [item.aiSuggestedInternalLinks]);

  const qualityAudit: any = React.useMemo(() => {
    try {
      return item.aiQualityAudit ? JSON.parse(item.aiQualityAudit) : null;
    } catch {
      return null;
    }
  }, [item.aiQualityAudit]);

  // Form State
  const [title, setTitle] = useState(item.aiDraftTitle || item.title || "");
  const [summary, setSummary] = useState(item.aiDraftSummary || item.excerpt || "");
  const [content, setContent] = useState(item.aiDraftContent || item.rawContent || "");

  // Match initial category by name or slug
  const initialCat = categories.find(
    (c) =>
      c.name.toLowerCase() === (item.aiRecommendedCategory || item.detectedCategory || "").toLowerCase() ||
      c.slug.toLowerCase() === (item.aiRecommendedCategory || item.detectedCategory || "").toLowerCase()
  );
  const [categoryId, setCategoryId] = useState(initialCat ? initialCat.id : categories[0]?.id || "");
  const [authorId, setAuthorId] = useState(authors[0]?.id || "");
  const [tags, setTags] = useState(recommendedTags.join(", "));
  const [metaTitle, setMetaTitle] = useState(item.aiMetaTitle || item.aiDraftTitle || item.title || "");
  const [metaDescription, setMetaDescription] = useState(item.aiMetaDescription || item.aiDraftSummary || "");
  const [editorialNotes, setEditorialNotes] = useState(item.editorialNotes || "");
  const initialCatVisual = getCategoryVisual(initialCat?.slug);
  const [featuredImage, setFeaturedImage] = useState(initialCatVisual.image);
  const [imageAlt, setImageAlt] = useState(initialCatVisual.alt);
  const [imageCaption, setImageCaption] = useState(initialCatVisual.caption);
  const [imageCredit, setImageCredit] = useState(item.source.name || "Redaksi Catatan Negeri");

  // Pre-publication Checklist States
  const [checkFacts, setCheckFacts] = useState(false);
  const [checkNoFabrication, setCheckNoFabrication] = useState(false);
  const [checkAccurateHeadline, setCheckAccurateHeadline] = useState(false);
  const [checkCategory, setCheckCategory] = useState(false);
  const [checkHighImpact, setCheckHighImpact] = useState(!item.isHighImpact); // if not high impact, checked by default

  // Verified claims check toggles
  const [verifiedClaimsState, setVerifiedClaimsState] = useState<Record<number, boolean>>({});

  // Loading & feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const contentWordCount = content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;

  const allChecklistPassed =
    checkFacts && checkNoFabrication && checkAccurateHeadline && checkCategory && checkHighImpact;

  const toggleClaimCheck = (index: number) => {
    setVerifiedClaimsState((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSelectAlternativeTitle = (altTitle: string) => {
    setTitle(altTitle);
    setMetaTitle(altTitle);
  };

  const handleRegenerateDraft = async () => {
    setIsRegenerating(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/news-inbox/${item.id}/ai-draft`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyusun ulang draf AI.");

      setTitle(data.draft.headline);
      setSummary(data.draft.summary);
      setContent(data.draft.articleBodyHtml);
      setMetaTitle(data.draft.seoTitle);
      setMetaDescription(data.draft.metaDescription);
      if (data.draft.recommendedTags) {
        setTags(data.draft.recommendedTags.join(", "));
      }
      setSuccessMessage("Draf AI berhasil diperbarui dengan gaya jurnalisme Catatan Negeri.");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses draf.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleReviewAction = async (
    action: "APPROVE_AND_PUBLISH" | "APPROVE_AS_DRAFT" | "RESEARCH_NEEDED" | "REJECT"
  ) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (action === "APPROVE_AND_PUBLISH" && !allChecklistPassed) {
      setErrorMessage(
        "Harap lengkapi semua poin dalam Lembar Verifikasi Redaksi sebelum melakukan publikasi langsung."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/news-inbox/${item.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          editorialNotes,
          title,
          summary,
          content,
          categoryId,
          authorId,
          tags,
          metaTitle,
          metaDescription,
          featuredImage,
          imageAlt,
          imageCaption,
          imageCredit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses aksi review.");

      if (action === "APPROVE_AND_PUBLISH") {
        setSuccessMessage("Berita berhasil disetujui dan DITERBITKAN ke publik!");
        setTimeout(() => {
          router.push(`/admin/articles`);
        }, 1200);
      } else if (action === "APPROVE_AS_DRAFT") {
        setSuccessMessage("Berita berhasil disimpan sebagai naskah DRAF redaksi.");
        setTimeout(() => {
          router.push(`/admin/articles`);
        }, 1200);
      } else if (action === "RESEARCH_NEEDED") {
        setSuccessMessage("Berita ditandai 'Butuh Riset' untuk tindak lanjut liputan.");
        setTimeout(() => {
          router.push("/admin/news-inbox");
        }, 1200);
      } else if (action === "REJECT") {
        setSuccessMessage("Berita berhasil ditolak.");
        setTimeout(() => {
          router.push("/admin/news-inbox");
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menyimpan review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link
              href="/admin/news-inbox"
              className="hover:text-brand-red flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kotak Masuk Berita</span>
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-400">ID: {item.id.slice(0, 8)}...</span>
          </div>

          <h1 className="font-serif text-xl sm:text-2xl font-black text-brand-navy">
            Studio Tinjauan & Verifikasi Berita
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbandingan komprehensif fakta sumber eksternal dengan naskah jurnalisme Catatan Negeri.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleReviewAction("REJECT")}
            disabled={isSubmitting}
            className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>Tolak</span>
          </button>

          <button
            onClick={() => handleReviewAction("RESEARCH_NEEDED")}
            disabled={isSubmitting}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Butuh Riset</span>
          </button>

          <button
            onClick={() => handleReviewAction("APPROVE_AS_DRAFT")}
            disabled={isSubmitting}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Draf Redaksi</span>
          </button>

          <button
            onClick={() => handleReviewAction("APPROVE_AND_PUBLISH")}
            disabled={isSubmitting || !allChecklistPassed}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs ${
              allChecklistPassed
                ? "bg-brand-red hover:bg-brand-red/90 text-white"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
            title={
              allChecklistPassed
                ? "Setujui dan terbitkan langsung ke pembaca"
                : "Centang seluruh lembar verifikasi redaksi untuk mengaktifkan publikasi"
            }
          >
            <Send className="w-4 h-4" />
            <span>Setujui & Terbitkan</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* High-Impact / Sensitive Notice */}
      {item.isHighImpact && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block text-sm">
              Perhatian Khusus: Topik Sensitif & Berisiko Tinggi (Kesehatan/Keuangan/Hukum/Bencana)
            </span>
            <p className="mt-1 leading-relaxed text-amber-800">
              Berita ini menyangkut kebijakan sensitif yang memengaruhi keselamatan, finansial, atau hak hukum warga.
              Dilarang keras menyunting spekulatif atau menghasilkan klaim tanpa kutipan otoritas resmi yang valid.
            </p>
          </div>
        </div>
      )}

      {/* Side-by-Side Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Original Source Material & Fact Verification (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Source Header Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Sumber Materi
                </span>
                <span className="text-base font-serif font-black text-brand-navy">
                  {item.source.name}
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                {item.source.type}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">URL Asli:</span>
                <a
                  href={item.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-red font-semibold hover:underline flex items-center gap-1 max-w-[200px] truncate"
                >
                  <span className="truncate">{item.originalUrl}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>

              {item.originalPublishedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Terbit Sumber:</span>
                  <span className="text-slate-700 font-medium">
                    {format(new Date(item.originalPublishedAt), "dd MMM yyyy, HH:mm", { locale: id })}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Ditemukan:</span>
                <span className="text-slate-700 font-medium">
                  {format(new Date(item.discoveredAt), "dd MMM yyyy, HH:mm", { locale: id })}
                </span>
              </div>

              {item.source.licenseNotes && (
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 block">Catatan Lisensi:</span>
                  {item.source.licenseNotes}
                </div>
              )}
            </div>

            {/* Duplicate detection warning if present */}
            {item.duplicateScore && item.duplicateScore >= 0.7 && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Copy className="w-4 h-4 text-rose-600" />
                  <span>Potensi Duplikasi: {Math.round(item.duplicateScore * 100)}%</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  {item.duplicateReason || "Topik ini memiliki kemiripan teks sangat tinggi dengan artikel yang sudah ada."}
                </p>
              </div>
            )}
          </div>

          {/* Original Content Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Materi Mentah dari Sumber
            </span>
            <h2 className="font-serif text-lg font-bold text-slate-900 leading-snug">
              {item.title}
            </h2>

            {item.excerpt && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs italic text-slate-700 leading-relaxed">
                "{item.excerpt}"
              </div>
            )}

            <div className="text-xs text-slate-700 leading-relaxed space-y-2 pt-2 border-t border-slate-100 max-h-72 overflow-y-auto pr-1">
              {item.rawContent ? (
                item.rawContent
                  .split("\n\n")
                  .filter((p) => p.trim())
                  .map((p, idx) => (
                    <p key={idx} className="text-slate-700">
                      {p}
                    </p>
                  ))
              ) : (
                <p className="text-slate-400 italic">Tidak ada konten tubuh teks mentah.</p>
              )}
            </div>
          </div>

          {/* Fact Verification Claims Checklist */}
          {verificationClaims.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-navy flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-brand-red" />
                  <span>Klaim Fakta Kunci (Verifikasi Lapangan)</span>
                </span>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {verificationClaims.length} Fakta
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Tinjau tiap butir klaim dari sumber. Centang setelah memastikan kebenaran faktualnya:
              </p>

              <div className="space-y-2.5">
                {verificationClaims.map((claimObj, idx) => {
                  const isChecked = verifiedClaimsState[idx] ?? false;
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleClaimCheck(idx)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                        isChecked
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="mt-0.5">
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold block leading-snug">{claimObj.claim}</span>
                        {claimObj.context && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Konteks: {claimObj.context}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Quality Audit Card */}
          {qualityAudit && (
            <div className="bg-slate-900 text-slate-200 p-5 rounded-xl shadow-xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Audit Kualitas Jurnalistik AI
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/80 p-2.5 rounded">
                  <span className="text-[10px] text-slate-400 block">Keterbacaan</span>
                  <span className="font-bold text-emerald-400">{qualityAudit.readingEase || "Tinggi"}</span>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded">
                  <span className="text-[10px] text-slate-400 block">Status Atribusi</span>
                  <span className="font-bold text-white">{qualityAudit.attributionStatus || "Lengkap"}</span>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded">
                  <span className="text-[10px] text-slate-400 block">Gaya Bahasa</span>
                  <span className="font-bold text-white">{qualityAudit.tone || "Objektif & Lugas"}</span>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded">
                  <span className="text-[10px] text-slate-400 block">Klaim Terverifikasi</span>
                  <span className="font-bold text-amber-400">{qualityAudit.unverifiedClaimsCount || 0} Perlu Perhatian</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Catatan Negeri Editorial Draft Studio (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            {/* Header & Regenerate Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 block">
                  Studio Redaksi
                </span>
                <span className="font-serif text-lg font-black text-brand-navy">
                  Naskah Berita Catatan Negeri
                </span>
              </div>

              <button
                type="button"
                onClick={handleRegenerateDraft}
                disabled={isRegenerating}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                <span>{isRegenerating ? "Menyusun Draf..." : "Susun Ulang Draf AI"}</span>
              </button>
            </div>

            {/* Alternative Headlines Carousel/Pills */}
            {alternativeHeadlines.length > 0 && (
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Pilihan Sudut Pandang Judul (Klik untuk menerapkan):
                </span>
                <div className="flex flex-col gap-1.5">
                  {alternativeHeadlines.map((altTitle, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectAlternativeTitle(altTitle)}
                      className={`text-left text-xs p-2 rounded transition-colors flex items-center justify-between ${
                        title === altTitle
                          ? "bg-brand-navy text-white font-bold"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      <span className="line-clamp-1">{altTitle}</span>
                      {title === altTitle && <Check className="w-3.5 h-3.5 ml-2 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex justify-between">
                <span>Judul Utama Artikel</span>
                <span className={`text-[10px] font-mono ${title.length > 70 ? "text-amber-600" : "text-slate-400"}`}>
                  {title.length} karakter (disarankan 50-70)
                </span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul artikel berita yang jernih dan akurat..."
                className="w-full text-sm font-bold text-brand-navy px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>

            {/* Summary Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex justify-between">
                <span>Ringkasan Eksekutif (Excerpt / Lead Berita)</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {summary.length} karakter
                </span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                placeholder="Lead ringkas yang menjawab 5W+1H inti peristiwa..."
                className="w-full text-xs text-slate-700 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-red leading-relaxed"
              />
            </div>

            {/* Outline if present */}
            {item.aiDraftOutline && (
              <details className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <summary className="font-bold text-slate-700 cursor-pointer flex items-center justify-between">
                  <span>Kerangka Berita (Editorial Outline)</span>
                  <span className="text-[10px] text-brand-red uppercase">Buka</span>
                </summary>
                <div className="mt-2 text-slate-600 whitespace-pre-line leading-relaxed border-t border-slate-200 pt-2 font-mono text-[11px]">
                  {item.aiDraftOutline}
                </div>
              </details>
            )}

            {/* Content Editor */}
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Isi Lengkap Naskah Berita (HTML / Paragraf Redaksi)
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border transition-colors ${
                      contentWordCount >= 1100
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : contentWordCount >= 600
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {contentWordCount.toLocaleString("id-ID")} / 1.200 Kata {contentWordCount >= 1100 ? "✓ (Pilar SEO)" : "(Target 1.200 Kata)"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {content.length} karakter
                  </span>
                </div>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                placeholder="Tulis naskah berita lengkap..."
                className="w-full text-xs font-sans text-slate-800 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-red leading-relaxed font-mono"
              />
            </div>

            {/* Category & Author Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Kanal Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-red bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Penulis / Wartawan</label>
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-red bg-white"
                >
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tag & Topik (Pisahkan koma)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="contoh: IKN, Kementerian Keuangan, APBN 2026"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>

            {/* Gambar Utama Tematik */}
            <div className="space-y-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Foto Utama Berita</label>
                <button
                  type="button"
                  onClick={() => {
                    const cat = categories.find((c) => c.id === categoryId);
                    const visual = getCategoryVisual(cat?.slug);
                    setFeaturedImage(visual.image);
                    setImageAlt(visual.alt);
                    setImageCaption(visual.caption);
                  }}
                  className="text-[10px] text-brand-red hover:underline font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Rekomendasi Foto Kategori
                </button>
              </div>

              {featuredImage && (
                <div className="relative aspect-[16/9] w-full rounded-md overflow-hidden border border-slate-200 bg-white">
                  <img src={featuredImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <input
                type="url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="URL Gambar (https://...)"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-red bg-white"
              />
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Deskripsi Foto (Alt Text SEO)..."
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-red bg-white"
              />
            </div>

            {/* Suggested Internal Links */}
            {internalLinks.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-red" />
                  <span>Rekomendasi Internal Link (SEO Architecture):</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {internalLinks.map((link, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 px-2 py-1 rounded text-slate-700"
                    >
                      <span className="font-semibold">{link.title}</span>
                      <span className="text-[9px] text-slate-400 font-mono">({link.slug})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Metadata Accordion */}
            <details className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <summary className="font-bold text-slate-700 cursor-pointer flex items-center justify-between">
                <span>Pengaturan Metadata SEO & Indeks Mesin Pencari</span>
                <span className="text-[10px] text-brand-red uppercase">Sunting</span>
              </summary>
              <div className="mt-3 space-y-3 pt-3 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 flex justify-between">
                    <span>Judul SEO (Meta Title)</span>
                    <span className="text-[10px] font-mono text-slate-400">{metaTitle.length} char</span>
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 flex justify-between">
                    <span>Deskripsi SEO (Meta Description)</span>
                    <span className="text-[10px] font-mono text-slate-400">{metaDescription.length} char</span>
                  </label>
                  <textarea
                    rows={2}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </details>

            {/* Pre-publication Verification Checklist */}
            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Lembar Verifikasi Wajib Sebelum Publikasi
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                Untuk menjaga standar integritas Catatan Negeri, centang seluruh pernyataan sebelum mempublikasikan berita ini:
              </p>

              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkFacts}
                    onChange={(e) => setCheckFacts(e.target.checked)}
                    className="mt-0.5 rounded text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-slate-800">
                    Akurasi fakta, waktu, nama instansi, dan kronologi telah diverifikasi sesuai sumber resmi.
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkNoFabrication}
                    onChange={(e) => setCheckNoFabrication(e.target.checked)}
                    className="mt-0.5 rounded text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-slate-800">
                    Naskah bebas dari fabrikasi data, kutipan buatan, dan opini pribadi yang menyamar sebagai fakta.
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkAccurateHeadline}
                    onChange={(e) => setCheckAccurateHeadline(e.target.checked)}
                    className="mt-0.5 rounded text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-slate-800">
                    Judul artikel jernih, faktual, tidak clickbait, dan mencerminkan isi substansi berita.
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkCategory}
                    onChange={(e) => setCheckCategory(e.target.checked)}
                    className="mt-0.5 rounded text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-slate-800">
                    Kategori kanal dan tag relevan dengan topik pembahasan.
                  </span>
                </label>

                {item.isHighImpact && (
                  <label className="flex items-start gap-2 cursor-pointer font-bold text-amber-950">
                    <input
                      type="checkbox"
                      checked={checkHighImpact}
                      onChange={(e) => setCheckHighImpact(e.target.checked)}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                      Saya menyatakan topik sensitif (kesehatan/keuangan/hukum) ini telah dicek ketat secara profesional.
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Editorial Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Catatan Dewan Redaksi (Internal Redaksi)
              </label>
              <textarea
                value={editorialNotes}
                onChange={(e) => setEditorialNotes(e.target.value)}
                rows={2}
                placeholder="Catatan peninjauan redaktur untuk arsip..."
                className="w-full text-xs text-slate-700 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

