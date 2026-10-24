import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { generatePersonSchema, SITE_URL } from "@/lib/seo";
import { UserCheck, Twitter, Linkedin, Instagram, BookOpen } from "lucide-react";

interface AuthorPageProps {
  params: Promise<{ authorSlug: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { authorSlug } = await params;

  const author = await db.authorProfile.findUnique({
    where: { slug: authorSlug, isPublic: true },
  });

  if (!author) return {};

  const title = `${author.displayName} — Profil Jurnalis Catatan Negeri`;
  const description = author.bio || `Profil dan arsip tulisan jurnalis ${author.displayName} di Catatan Negeri.`;
  const canonicalUrl = `${SITE_URL}/penulis/${author.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonicalUrl,
      images: author.avatar ? [{ url: author.avatar }] : undefined,
    },
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { authorSlug } = await params;

  const author = await db.authorProfile.findUnique({
    where: { slug: authorSlug, isPublic: true },
    include: {
      articles: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        include: { category: true },
      },
    },
  });

  if (!author) {
    notFound();
  }

  const personSchema = generatePersonSchema({
    name: author.displayName,
    slug: author.slug,
    bio: author.bio,
    avatar: author.avatar,
    title: author.title,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { name: "Dewan Redaksi", url: "/tentang-kami" },
            { name: author.displayName, url: `/penulis/${author.slug}` },
          ]}
        />

        {/* Author Header Card */}
        <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 mb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative w-28 h-28 rounded-full overflow-hidden bg-slate-200 shadow-md border-2 border-white flex-shrink-0">
              <Image
                src={author.avatar || "/brand/logo.png"}
                alt={author.displayName}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-brand-navy">
                      {author.displayName}
                    </h1>
                    <span title="Terverifikasi Dewan Redaksi">
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                    </span>
                  </div>
                  {author.title && (
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-red mt-0.5">
                      {author.title}
                    </p>
                  )}
                </div>

                {/* Social links */}
                <div className="flex items-center justify-center sm:justify-end gap-3 text-slate-500">
                  {author.socialTwitter && (
                    <a
                      href={`https://twitter.com/${author.socialTwitter}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="p-1.5 rounded-full hover:bg-slate-200 hover:text-black transition-colors"
                      aria-label="Twitter Profile"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {author.socialLinkedin && (
                    <a
                      href={`https://linkedin.com/in/${author.socialLinkedin}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="p-1.5 rounded-full hover:bg-slate-200 hover:text-[#0A66C2] transition-colors"
                      aria-label="LinkedIn Profile"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {author.bio && (
                <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {author.bio}
                </p>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <BookOpen className="w-4 h-4 text-brand-red" />
                  {author.articles.length} Artikel Terbit
                </span>
                <span>&bull;</span>
                <span>Standar Etika Jurnalistik AJI & PWI</span>
              </div>
            </div>
          </div>
        </section>

        {/* Author Articles Feed */}
        <section>
          <div className="border-b-2 border-brand-navy pb-2 mb-6">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-navy">
              Arsip Tulisan & Laporan oleh {author.displayName}
            </h2>
          </div>

          {author.articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {author.articles.map((art) => (
                <ArticleCard key={art.id} article={art} variant="standard" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-lg text-slate-500 text-sm">
              Belum ada artikel yang dipublikasikan oleh penulis ini.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
