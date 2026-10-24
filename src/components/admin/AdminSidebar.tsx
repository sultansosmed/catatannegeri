"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tags,
  Image as ImageIcon,
  Users,
  Compass,
  MessageSquare,
  Menu as MenuIcon,
  Search,
  Sliders,
  Globe,
  Radio,
  Mail,
  ShieldCheck,
  ExternalLink,
  Inbox,
  Sparkles,
} from "lucide-react";
import { Role } from "@prisma/client";

interface AdminSidebarProps {
  userRole: Role;
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Manajemen Artikel", href: "/admin/articles", icon: FileText },
    { label: "Kotak Masuk Berita", href: "/admin/news-inbox", icon: Inbox },
    { label: "Pustaka Media", href: "/admin/media", icon: ImageIcon },
    { label: "Kategori Berita", href: "/admin/categories", icon: FolderTree },
    { label: "Topik & Tag", href: "/admin/tags", icon: Tags },
    { label: "Profil Jurnalis", href: "/admin/authors", icon: Compass },
    { label: "Moderasi Komentar", href: "/admin/comments", icon: MessageSquare },
  ];

  const adminOnlyItems = [
    { label: "Sumber Berita Eksternal", href: "/admin/news-sources", icon: Radio },
    { label: "Menu Navigasi", href: "/admin/menus", icon: MenuIcon },
    { label: "Konfigurasi SEO", href: "/admin/seo", icon: Search },
    { label: "Pengalihan URL (Redirect)", href: "/admin/redirects", icon: Globe },
    { label: "Pengguna & Hak Akses", href: "/admin/users", icon: Users },
    { label: "Pengaturan Situs & Iklan", href: "/admin/settings", icon: Sliders },
    { label: "Pelanggan Buletin", href: "/admin/subscribers", icon: Mail },
    { label: "Log Audit Keamanan", href: "/admin/audit-logs", icon: ShieldCheck },
  ];

  const isSuperAdmin = userRole === "SUPER_ADMIN";

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-white p-1 flex items-center justify-center">
            <Image
              src="/brand/logo.png"
              alt="Catatan Negeri"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <span className="font-serif font-black text-white text-base block leading-tight">
              CATATAN<span className="text-brand-red-light">NEGERI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Ruang Redaksi
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
          Menu Editorial
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-brand-red text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {isSuperAdmin && (
          <>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pt-4 pb-1">
              Administrasi Sistem
            </div>
            {adminOnlyItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-brand-red text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer link to public site */}
      <div className="p-3 border-t border-slate-800">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span>Lihat Situs Publik</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}

