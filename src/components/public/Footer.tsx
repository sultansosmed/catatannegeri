import React from "react";
import Link from "next/link";
import Image from "next/image";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface FooterProps {
  categories: CategoryItem[];
}

export function Footer({ categories }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-navy text-slate-300 pt-12 pb-8 border-t-4 border-brand-red">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Section: Brand Info & Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-700/60">
          {/* Column 1: Brand & Identity */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded bg-white p-1 flex items-center justify-center">
                <Image
                  src="/brand/logo.png"
                  alt="Catatan Negeri"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="font-serif text-2xl font-black text-white">
                CATATAN<span className="text-brand-red-light">NEGERI</span>
              </span>
            </Link>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Portal Berita & Informasi Digital Indonesia. Menghadirkan liputan peristiwa aktual, analisis mendalam, kebijakan publik, dan panduan terpercaya dari pelosok tanah air.
            </p>
            <div className="text-xs text-slate-400 space-y-1">
              <p><strong>Penerbit:</strong> PT Catatan Media Negeri</p>
              <p><strong>Alamat:</strong> Gedung Pers, Jl. Kebon Sirih No. 45, Jakarta Pusat</p>
              <p><strong>Surel:</strong> redaksi@catatannegeri.com</p>
            </div>
          </div>

          {/* Column 2: Categories Grid */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 border-l-2 border-brand-red pl-2">
              Kanal Berita
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className="text-slate-300 hover:text-white hover:underline transition-colors py-1"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Redaksi & Regulasi */}
          <div className="md:col-span-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 border-l-2 border-brand-red pl-2">
              Kebijakan Redaksi
            </h4>
            <ul className="text-xs space-y-2 text-slate-300">
              <li>
                <Link href="/pedoman-media-siber" className="hover:text-white hover:underline">
                  Pedoman Pemberitaan Media Siber
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-koreksi" className="hover:text-white hover:underline">
                  Kebijakan Ralat, Koreksi & Hak Jawab
                </Link>
              </li>
              <li>
                <Link href="/tentang-kami" className="hover:text-white hover:underline">
                  Tentang Redaksi & Manajemen
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="hover:text-white hover:underline">
                  Kontak Redaksi & Pemasangan Iklan
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-privasi" className="hover:text-white hover:underline">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/syarat-ketentuan" className="hover:text-white hover:underline">
                  Syarat dan Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="hover:text-white hover:underline" target="_blank">
                  Peta Situs (XML Sitemap)
                </Link>
              </li>
              <li>
                <Link href="/news-sitemap.xml" className="hover:text-white hover:underline" target="_blank">
                  Google News Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section: Dewan Pers compliance & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p className="text-center sm:text-left">
            &copy; {currentYear} Catatan Negeri (catatannegeri.com). Seluruh hak cipta dilindungi undang-undang.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Standar Jurnalisme Berkualitas</span>
            <span className="text-slate-600">&bull;</span>
            <span>UU Pers No. 40 Tahun 1999</span>
            <span className="text-slate-600">&bull;</span>
            <Link href="/admin/login" className="hover:text-slate-200">
              Login Redaksi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

