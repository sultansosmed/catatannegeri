"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Eye,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Zap,
} from "lucide-react";
import { generateSlug } from "@/lib/slug";
import { getCategoryVisual } from "@/lib/category-images";
import { SeoChecker } from "./SeoChecker";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface AuthorOption {
  id: string;
  displayName: string;
}

interface TagOption {
  id: string;
  name: string;
  slug: string;
}

interface ArticleEditorProps {
  initialData?: any;
  categories: CategoryOption[];
  authors: AuthorOption[];
  tags: TagOption[];
  userRole: string;
}

export function ArticleEditor({
  initialData,
  categories,
  authors,
  tags,
  userRole,
}: ArticleEditorProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [manualSlug, setManualSlug] = useState(!!initialData?.slug);
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || (categories[0]?.id || ""));
  const [authorId, setAuthorId] = useState(initialData?.authorId || (authors[0]?.id || ""));
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags?.map((t: any) => t.tagId || t.tag?.id) || []
  );

  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || "");
  const [imageAlt, setImageAlt] = useState(initialData?.imageAlt || "");
  const [imageCaption, setImageCaption] = useState(initialData?.imageCaption || "");
  const [imageCredit, setImageCredit] = useState(initialData?.imageCredit || "");

  const [status, setStatus] = useState(initialData?.status || "DRAFT");
  const [scheduledFor, setScheduledFor] = useState(
    initialData?.scheduledFor ? new Date(initialData.scheduledFor).toISOString().slice(0, 16) : ""
  );

  const [isBreaking, setIsBreaking] = useState(initialData?.isBreaking || false);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  const [isEditorPick, setIsEditorPick] = useState(initialData?.isEditorPick || false);

  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl || "");
  const [noIndex, setNoIndex] = useState(initialData?.noIndex || false);

  const [factCheckNotes, setFactCheckNotes] = useState(initialData?.factCheckNotes || "");
  const [correctionNotes, setCorrectionNotes] = useState(initialData?.correctionNotes || "");
  const [sourceReferences, setSourceReferences] = useState(initialData?.sourceReferences || "");

  // UI State
  const [activeTab, setActiveTab] = useState<"editor" | "seo" | "sources">("editor");
  const [saving, setSaving] = useState(false);
  const [indexingLoading, setIndexingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleFastIndex = async () => {
    if (!initialData?.id) return;
    setIndexingLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/seo/fast-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: initialData.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim ping indeks.");
      setSuccessMessage("Sinyal Indeks Instan berhasil dikirim ke Google Search Console & IndexNow!");
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengirim sinyal indeks.");
    } finally {
      setIndexingLoading(false);
    }
  };

  // Handle title change & auto slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!manualSlug) {
      setSlug(generateSlug(val));
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const cleanContentWords = content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;

  // Quick formatting insert helper
  const insertFormatting = (tagStart: string, tagEnd: string = "") => {
    setContent((prev: string) => `${prev}\n${tagStart}Teks di sini${tagEnd}\n`);
  };

  const handleSubmit = async (targetStatus?: string) => {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const newStatus = targetStatus || status;

    const payload = {
      title,
      slug: slug || generateSlug(title),
      summary,
      content,
      categoryId,
      authorId,
      featuredImage: featuredImage || null,
      imageAlt: imageAlt || null,
      imageCaption: imageCaption || null,
      imageCredit: imageCredit || null,
      status: newStatus,
      scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      isBreaking,
      isFeatured,
      isEditorPick,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      noIndex,
      factCheckNotes: factCheckNotes || null,
      correctionNotes: correctionNotes || null,
      sourceReferences: sourceReferences || null,
      tags: selectedTags,
    };

    try {
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/articles/${initialData.id}` : "/api/articles";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan artikel.");
      }

      setSuccessMessage("Artikel berhasil disimpan!");
      setStatus(newStatus);

      if (!isEdit && data.article?.id) {
        router.push(`/admin/articles/${data.article.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {initialData?.id ? "Sunting Artikel" : "Pembuatan Artikel Baru"}
          </span>
          <h1 className="font-serif text-xl sm:text-2xl font-black text-brand-navy">
            {title || "Draf Berita Tanpa Judul"}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              status === "PUBLISHED"
                ? "bg-emerald-100 text-emerald-800"
                : status === "DRAFT"
                ? "bg-amber-100 text-amber-800"
                : status === "SCHEDULED"
                ? "bg-blue-100 text-blue-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {status}
          </span>

          <button
            type="button"
            onClick={() => handleSubmit("DRAFT")}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Draf
          </button>

          {(userRole === "SUPER_ADMIN" || userRole === "EDITOR") ? (
            <button
              type="button"
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-red hover:bg-brand-red-dark rounded-lg shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {status === "PUBLISHED" ? "Perbarui Publikasi" : "Terbitkan Sekarang"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit("PENDING_REVIEW")}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim ke Meja Redaksi
            </button>
          )}

          {initialData?.slug && selectedCategory?.slug && (
            <>
              {status === "PUBLISHED" && (
                <button
                  type="button"
                  onClick={handleFastIndex}
                  disabled={indexingLoading}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors"
                  title="Kirim sinyal rayap cepat ke Google Search Console & IndexNow"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-700 ${indexingLoading ? "animate-spin" : ""}`} />
                  <span>{indexingLoading ? "Pinging..." : "Ping Google"}</span>
                </button>
              )}
              <a
                href={`/${selectedCategory.slug}/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-500 hover:text-brand-navy rounded-lg hover:bg-slate-50 border border-slate-200"
                title="Pratinjau Halaman Publik"
              >
                <Eye className="w-4 h-4" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("editor")}
          className={`py-2 px-1 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "editor"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Konten & Penulisan
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`py-2 px-1 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "seo"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          SEO & Pratinjau Google
        </button>
        <button
          onClick={() => setActiveTab("sources")}
          className={`py-2 px-1 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "sources"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Verifikasi Sumber & Ralat
        </button>
      </div>

      {/* Main Grid: Editor vs Sidebar Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === "editor" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Berita (Headline) *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Ketik judul berita yang jernih, faktual, dan kuat..."
                  required
                  className="w-full px-4 py-3 text-base sm:text-lg font-serif font-bold rounded-lg border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Slug URL Kanonikal *
                  </label>
                  <button
                    type="button"
                    onClick={() => setManualSlug(!manualSlug)}
                    className="text-[10px] text-brand-red hover:underline font-semibold"
                  >
                    {manualSlug ? "Kunci Otomatis" : "Ubah Manual"}
                  </button>
                </div>
                <div className="flex items-center rounded-lg border border-slate-300 overflow-hidden text-xs bg-slate-50">
                  <span className="px-3 py-2 text-slate-400 select-none">
                    https://catatannegeri.com/{selectedCategory?.slug || "kanal"}/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setManualSlug(true);
                      setSlug(generateSlug(e.target.value));
                    }}
                    required
                    className="flex-1 py-2 pr-3 bg-white text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Summary / Lead */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ringkasan / Paragraf Pembuka (Lead) *
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ringkasan padat 5W+1H (1-2 kalimat) yang merangkum esensi berita..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-brand-red leading-relaxed"
                />
              </div>

              {/* Rich Text Editor Toolbars & Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700">
                      Naskah Isi Berita (HTML Semantik) *
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Mendukung tag p, h2, h3, blockquote, ul, ol, img, a
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded transition-colors ${
                      cleanContentWords >= 1100
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : cleanContentWords >= 600
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                    title="Target kedalaman artikel pilar SEO ramah mesin pencari Google adalah 1.200 kata"
                  >
                    {cleanContentWords.toLocaleString("id-ID")} / 1.200 Kata {cleanContentWords >= 1100 ? "✓ (Pilar SEO)" : "(Target 1.200 Kata)"}
                  </span>
                </div>

                {/* Quick HTML Insertion Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 rounded-t-lg border border-b-0 border-slate-300 text-xs">
                  <button
                    type="button"
                    onClick={() => insertFormatting("<h2>", "</h2>")}
                    className="px-2 py-1 bg-white hover:bg-slate-200 rounded font-bold"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("<h3>", "</h3>")}
                    className="px-2 py-1 bg-white hover:bg-slate-200 rounded font-bold"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("<p><strong>", "</strong></p>")}
                    className="px-2 py-1 bg-white hover:bg-slate-200 rounded font-bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("<blockquote>\n  \"", "\"\n</blockquote>")}
                    className="px-2 py-1 bg-white hover:bg-slate-200 rounded italic"
                  >
                    Kutipan
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("<ul>\n  <li>", "</li>\n</ul>")}
                    className="px-2 py-1 bg-white hover:bg-slate-200 rounded"
                  >
                    Daftar (List)
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<a href="https://" target="_blank" rel="noopener noreferrer">', "</a>")}
                    className="px-2 py-1 bg-white hover:bg-slate-200 rounded flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" /> Tautan
                  </button>
                </div>

                <textarea
                  rows={16}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan naskah berita lengkap di sini..."
                  required
                  className="w-full px-4 py-3 font-mono text-xs rounded-b-lg border border-slate-300 focus:outline-none focus:border-brand-red leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
              <h3 className="font-serif font-bold text-lg text-brand-navy border-b border-slate-200 pb-2">
                Asisten Optimasi Teknis SEO
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Khusus SEO (SEO Title Override)
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Kosongkan jika menggunakan judul artikel di atas (maks. 70 karakter)"
                    maxLength={70}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {metaTitle.length}/70 karakter
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Meta Description Override
                  </label>
                  <textarea
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Deskripsi rangkuman untuk cuplikan Google SERP (disarankan 120-160 karakter)"
                    maxLength={160}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {metaDescription.length}/160 karakter
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Kanonikal Kustom (Bila Mengutip Sindikasi)
                  </label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://catatannegeri.com/..."
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="noIndexToggle"
                    checked={noIndex}
                    onChange={(e) => setNoIndex(e.target.checked)}
                    className="rounded border-slate-300 text-brand-red focus:ring-brand-red"
                  />
                  <label htmlFor="noIndexToggle" className="text-xs font-semibold text-slate-700">
                    Terapkan direktif NoIndex (Jangan diindeks oleh mesin pencari Google)
                  </label>
                </div>
              </div>

              {/* Real-time Quality Checker */}
              <SeoChecker
                title={title}
                summary={summary}
                content={content}
                slug={slug}
                featuredImage={featuredImage}
                imageAlt={imageAlt}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                canonicalUrl={canonicalUrl}
                authorId={authorId}
                sourceReferences={sourceReferences}
                categorySlug={selectedCategory?.slug || "nasional"}
              />
            </div>
          )}

          {activeTab === "sources" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
              <h3 className="font-serif font-bold text-lg text-brand-navy border-b border-slate-200 pb-2">
                Integritas Jurnalistik, Sumber & Verifikasi Fakta
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Pemeriksaan Fakta (Fact-Checking Notes)
                </label>
                <textarea
                  rows={4}
                  value={factCheckNotes}
                  onChange={(e) => setFactCheckNotes(e.target.value)}
                  placeholder="Keterangan rujukan data primer, hasil uji keabsahan, atau dokumen resmi yang diverifikasi..."
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rujukan Sumber Berita (Source References)
                </label>
                <textarea
                  rows={4}
                  value={sourceReferences}
                  onChange={(e) => setSourceReferences(e.target.value)}
                  placeholder='Format JSON atau baris teks: [{"source": "Kementerian Kominfo", "url": "https://kominfo.go.id"}]'
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Ralat / Koreksi Berita (Bila Ada Pembaruan Faktual)
                </label>
                <textarea
                  rows={3}
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  placeholder="Keterangan ralat yang transparan bagi pembaca..."
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Meta attributes (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Publication Workflow Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <h4 className="font-serif font-bold text-sm text-brand-navy border-b border-slate-200 pb-2">
              Status & Jadwal Tayang
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Publikasi</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
              >
                <option value="DRAFT">Draf (Konsep)</option>
                <option value="PENDING_REVIEW">Menunggu Telaah Redaktur</option>
                <option value="SCHEDULED">Terjadwal</option>
                <option value="PUBLISHED">Diterbitkan (Published)</option>
                <option value="ARCHIVED">Diarsipkan (Archived)</option>
              </select>
            </div>

            {status === "SCHEDULED" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Waktu Tayang Otomatis
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>
            )}

            {/* Editorial Placement Flags */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="rounded text-brand-red focus:ring-brand-red"
                />
                <span className="font-semibold text-brand-red">Breaking News (Ticker Terkini)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-brand-red focus:ring-brand-red"
                />
                <span className="font-semibold">Berita Utama Hero (Headline)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={isEditorPick}
                  onChange={(e) => setIsEditorPick(e.target.checked)}
                  className="rounded text-brand-red focus:ring-brand-red"
                />
                <span>Pilihan Editor (Editor's Pick)</span>
              </label>
            </div>
          </div>

          {/* Category & Author Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <h4 className="font-serif font-bold text-sm text-brand-navy border-b border-slate-200 pb-2">
              Kanal & Jurnalis
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Kanal *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jurnalis / Penulis *</label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
              >
                {authors.map((auth) => (
                  <option key={auth.id} value={auth.id}>
                    {auth.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags multi-selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Topik Terkait (Tag)
              </label>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      type="button"
                      key={tag.id}
                      onClick={() => {
                        setSelectedTags(
                          isSelected
                            ? selectedTags.filter((id) => id !== tag.id)
                            : [...selectedTags, tag.id]
                        );
                      }}
                      className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                        isSelected
                          ? "bg-brand-red text-white font-bold"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Featured Image Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <h4 className="font-serif font-bold text-sm text-brand-navy border-b border-slate-200 pb-2">
              Gambar Utama Berita
            </h4>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">URL Gambar Utama</label>
                <button
                  type="button"
                  onClick={() => {
                    const cat = categories.find((c) => c.id === categoryId);
                    const visual = getCategoryVisual(cat?.slug);
                    setFeaturedImage(visual.image);
                    if (!imageAlt) setImageAlt(visual.alt);
                    if (!imageCaption) setImageCaption(visual.caption);
                  }}
                  className="text-[11px] text-brand-red hover:underline font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Rekomendasi Foto Kategori
                </button>
              </div>
              <input
                type="url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://... atau /uploads/..."
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
              />
            </div>

            {featuredImage && (
              <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                <img src={featuredImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teks Alternatif (Alt Text SEO) *
              </label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Deskripsi visual gambar secara akurat..."
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Foto (Kepsyen)</label>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Konteks foto peristiwa..."
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kredit Fotografer / Sumber</label>
              <input
                type="text"
                value={imageCredit}
                onChange={(e) => setImageCredit(e.target.value)}
                placeholder="Contoh: Dok. Humas Pemprov / Antara"
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
