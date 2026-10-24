"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit2, BookOpen, ExternalLink, X, Plus } from "lucide-react";
import { generateSlug } from "@/lib/slug";

interface AuthorItem {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  title: string | null;
  bio: string | null;
  avatar: string | null;
  socialTwitter: string | null;
  socialLinkedin: string | null;
  isPublic: boolean;
  user: { email: string; role: string };
  _count: { articles: number };
}

export function AuthorManager({ initialAuthors }: { initialAuthors: AuthorItem[] }) {
  const [authors, setAuthors] = useState<AuthorItem[]>(initialAuthors);
  const [editingAuthor, setEditingAuthor] = useState<AuthorItem | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [saving, setSaving] = useState(false);

  const handleOpenEdit = (author: AuthorItem) => {
    setEditingAuthor(author);
    setDisplayName(author.displayName);
    setSlug(author.slug);
    setTitle(author.title || "");
    setBio(author.bio || "");
    setAvatar(author.avatar || "");
    setSocialTwitter(author.socialTwitter || "");
    setSocialLinkedin(author.socialLinkedin || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAuthor) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/authors/${editingAuthor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          slug,
          title,
          bio,
          avatar,
          socialTwitter,
          socialLinkedin,
        }),
      });

      const data = await res.json();
      if (res.ok && data.author) {
        setAuthors((prev) =>
          prev.map((a) => (a.id === editingAuthor.id ? { ...a, ...data.author } : a))
        );
        setEditingAuthor(null);
      } else {
        alert(data.error || "Gagal menyimpan.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      {editingAuthor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-serif font-bold text-base text-brand-navy">
                Sunting Profil Jurnalis: {editingAuthor.displayName}
              </h3>
              <button onClick={() => setEditingAuthor(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Tampilan *</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slug URL Profil *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jabatan / Spesialisasi Desk</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Redaktur Pelaksana / Jurnalis Investigasi"
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Foto Profil (Avatar)</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://... atau /uploads/..."
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Biografi Jurnalis (E-E-A-T)</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Pengalaman peliputan, keahlian khusus, dan kredensial pers..."
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username X (Twitter)</label>
                  <input
                    type="text"
                    value={socialTwitter}
                    onChange={(e) => setSocialTwitter(e.target.value)}
                    placeholder="username"
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username LinkedIn</label>
                  <input
                    type="text"
                    value={socialLinkedin}
                    onChange={(e) => setSocialLinkedin(e.target.value)}
                    placeholder="username"
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAuthor(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-brand-red text-white font-bold"
                >
                  {saving ? "Menyimpan..." : "Simpan Profil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid of Authors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {authors.map((author) => (
          <div
            key={author.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                  <Image
                    src={author.avatar || "/brand/logo.png"}
                    alt={author.displayName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif font-bold text-sm text-brand-navy truncate">
                    {author.displayName}
                  </h4>
                  <p className="text-[11px] font-semibold text-brand-red truncate">
                    {author.title || "Jurnalis"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    /penulis/{author.slug}
                  </p>
                </div>
              </div>

              {author.bio && (
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {author.bio}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <BookOpen className="w-3.5 h-3.5 text-brand-navy" />
                {author._count.articles} Artikel
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(author)}
                  className="text-slate-600 hover:text-brand-navy font-semibold text-[11px] flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"
                >
                  <Edit2 className="w-3 h-3" />
                  Sunting
                </button>
                <Link
                  href={`/penulis/${author.slug}`}
                  target="_blank"
                  className="text-brand-red hover:underline flex items-center gap-1 font-semibold text-[11px]"
                >
                  Publik <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

