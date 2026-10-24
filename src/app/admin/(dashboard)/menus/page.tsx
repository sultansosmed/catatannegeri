import React from "react";
import { db } from "@/lib/db";
import { MenuManager } from "@/components/admin/MenuManager";

export default async function AdminMenusPage() {
  const menus = await db.navigationMenu.findMany({
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Struktur Tautan Situs
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Manajemen Menu Navigasi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi susunan menu header, footer, dan tautan sorotan editorial.
          </p>
        </div>
      </div>

      <MenuManager initialMenus={menus} />
    </div>
  );
}

