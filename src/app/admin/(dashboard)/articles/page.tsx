import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Plus, Search, Filter, Eye, Edit, Trash2, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArticleDeleteButton } from "@/components/admin/ArticleDeleteButton";

interface ArticlesPageProps {
  searchParams: Promise<{ status?: string; categoryId?: string; q?: string }>;
}

export default async function AdminArticlesListPage({ searchParams }: ArticlesPageProps) {
  const { status, categoryId, q } = await searchParams;
  const user = await getCurrentUser();

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (categoryId && categoryId !== "ALL") {
    where.categoryId = categoryId;
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  // Filter if author
  if (user?.role === "AUTHOR" && user.authorProfile?.id) {
    where.authorId = user.authorProfile.id;
  }

  const [articles, categories] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        author: true,
      },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Arsip & Sirkulasi Berita
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Manajemen Artikel Redaksi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Total {articles.length} artikel terdaftar dalam sistem.
          </p>
        </div>

        <Link
          href="/admin/articles/new"
          className="flex items-center gap-1.5 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tulis Berita Baru
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-5 relative">
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Cari judul artikel atau slug..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-red"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="sm:col-span-3">
            <select
              name="status"
              defaultValue={status || "ALL"}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="PUBLISHED">Diterbitkan (PUBLISHED)</option>
              <option value="DRAFT">Draf (DRAFT)</option>
              <option value="PENDING_REVIEW">Menunggu Telaah (PENDING_REVIEW)</option>
              <option value="SCHEDULED">Terjadwal (SCHEDULED)</option>
              <option value="ARCHIVED">Diarsipkan (ARCHIVED)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              name="categoryId"
              defaultValue={categoryId || "ALL"}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full bg-slate-100 hover:bg-brand-navy hover:text-white text-slate-700 font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Articles Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Judul Berita</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Jurnalis</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Waktu Tayang</th>
                <th className="px-4 py-3 text-center">Pembaca</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articles.map((art) => (
                <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 max-w-xs sm:max-w-md">
                    <Link
                      href={`/admin/articles/${art.id}/edit`}
                      className="font-bold text-slate-900 hover:text-brand-red line-clamp-1 text-sm font-serif"
                    >
                      {art.title}
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>/{art.category.slug}/{art.slug}</span>
                      {art.isBreaking && (
                        <span className="text-brand-red font-bold uppercase">&bull; Breaking</span>
                      )}
                      {art.isFeatured && (
                        <span className="text-amber-600 font-bold uppercase">&bull; Hero</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {art.category.name}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                    {art.author.displayName}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        art.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-800"
                          : art.status === "DRAFT"
                          ? "bg-amber-100 text-amber-800"
                          : art.status === "SCHEDULED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {art.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                    {art.publishedAt
                      ? format(new Date(art.publishedAt), "d MMM yyyy HH:mm", { locale: id })
                      : "-"}
                  </td>
                  <td className="px-4 py-3.5 text-center font-semibold text-slate-700 whitespace-nowrap">
                    {art.viewCount}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {art.status === "PUBLISHED" && (
                        <a
                          href={`/${art.category.slug}/${art.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-brand-navy rounded hover:bg-slate-100"
                          title="Lihat Berita"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Link
                        href={`/admin/articles/${art.id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-brand-navy rounded hover:bg-slate-100"
                        title="Sunting Artikel"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <ArticleDeleteButton
                        articleId={art.id}
                        articleTitle={art.title}
                        userRole={user?.role || "AUTHOR"}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>Tidak ada artikel yang sesuai dengan filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

