"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Menu, X, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface HeaderProps {
  categories: CategoryItem[];
}

export function Header({ categories }: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");

  useEffect(() => {
    // Indonesian date format
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setCurrentDateStr(now.toLocaleDateString("id-ID", options));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  // Top primary navigation categories (first 10) and secondary in dropdown
  const primaryCategories = categories.slice(0, 10);
  const secondaryCategories = categories.slice(10);

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 transition-shadow">
      {/* Top Bar: Date, Slogan, Quick Links */}
      <div className="border-b border-slate-100 text-xs text-slate-500 py-1.5 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>{currentDateStr || "Indonesia"}</span>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-slate-600">Portal Berita & Informasi Digital Indonesia</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pedoman-media-siber" className="hover:text-brand-red transition-colors">
              Pedoman Media Siber
            </Link>
            <Link href="/kebijakan-koreksi" className="hover:text-brand-red transition-colors">
              Kebijakan Koreksi
            </Link>
            <Link href="/tentang-kami" className="hover:text-brand-red transition-colors">
              Tentang Kami
            </Link>
            <Link href="/admin/login" className="text-slate-400 hover:text-slate-700">
              Redaksi
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Brand Area */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-700 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red rounded"
          aria-label="Buka Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 overflow-hidden rounded bg-brand-navy p-1 flex items-center justify-center shadow-sm">
            <Image
              src="/brand/logo.png"
              alt="Logo Catatan Negeri"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-brand-navy group-hover:text-brand-red transition-colors">
              CATATAN<span className="text-brand-red">NEGERI</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-500 -mt-1 hidden sm:block">
              Jernih & Terpercaya
            </span>
          </div>
        </Link>

        {/* Search bar & Search toggle */}
        <div className="flex items-center gap-2">
          {/* Desktop Search Input */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
            <input
              type="text"
              placeholder="Cari berita, tokoh, topik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 lg:w-72 pl-9 pr-3 py-1.5 text-xs rounded-full border border-slate-300 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          </form>

          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-brand-red rounded"
            aria-label="Cari Berita"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Search Popdown */}
      {searchOpen && (
        <div className="md:hidden p-3 bg-slate-50 border-t border-slate-200">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Cari berita..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:border-brand-red"
              autoFocus
            />
            <button
              type="submit"
              className="bg-brand-navy hover:bg-brand-red text-white px-4 py-2 text-sm font-semibold rounded transition-colors"
            >
              Cari
            </button>
          </form>
        </div>
      )}

      {/* Main Category Navigation Bar (Desktop) */}
      <nav className="bg-brand-navy text-white text-xs sm:text-sm font-medium hidden lg:block border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            <Link
              href="/"
              className="px-3 py-2 rounded font-bold uppercase tracking-wider text-white hover:text-brand-red-light transition-colors whitespace-nowrap"
            >
              Beranda
            </Link>
            {primaryCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className="px-2.5 py-2 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}

            {/* Dropdown for other categories */}
            {secondaryCategories.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-1 px-3 py-2 text-slate-200 hover:text-white hover:bg-white/10 rounded transition-colors">
                  <span>Lainnya</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="absolute left-0 mt-1 w-52 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-2 hidden group-hover:block group-focus-within:block z-50">
                  {secondaryCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/${cat.slug}`}
                      className="block px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-red transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[60px] bg-white z-50 overflow-y-auto p-4 border-t border-slate-200">
          <div className="flex flex-col gap-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Cari berita..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:border-brand-red"
              />
              <button
                type="submit"
                className="bg-brand-navy hover:bg-brand-red text-white px-4 py-2 text-sm font-semibold rounded transition-colors"
              >
                Cari
              </button>
            </form>

            <div className="border-b border-slate-200 pb-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-bold text-brand-navy hover:text-brand-red"
              >
                Beranda
              </Link>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Kategori Berita</h4>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-1.5 text-sm font-medium text-slate-700 hover:text-brand-red transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Informasi Redaksi</h4>
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <Link href="/pedoman-media-siber" onClick={() => setMobileMenuOpen(false)}>
                  Pedoman Pemberitaan Media Siber
                </Link>
                <Link href="/kebijakan-koreksi" onClick={() => setMobileMenuOpen(false)}>
                  Kebijakan Ralat & Hak Jawab
                </Link>
                <Link href="/tentang-kami" onClick={() => setMobileMenuOpen(false)}>
                  Tentang Redaksi & Manajemen
                </Link>
                <Link href="/kontak" onClick={() => setMobileMenuOpen(false)}>
                  Kontak Redaksi & Iklan
                </Link>
                <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)} className="text-brand-navy font-semibold">
                  Portal Redaksi / Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

