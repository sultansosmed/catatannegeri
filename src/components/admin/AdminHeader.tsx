"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Shield, PenTool } from "lucide-react";
import { Role } from "@prisma/client";

interface AdminHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { label: "Pemimpin Redaksi", color: "bg-red-100 text-red-800 border-red-200", icon: Shield };
      case "EDITOR":
        return { label: "Redaktur / Editor", color: "bg-blue-100 text-blue-800 border-blue-200", icon: PenTool };
      case "AUTHOR":
      default:
        return { label: "Wartawan / Penulis", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: UserIcon };
    }
  };

  const badge = getRoleBadge(user.role);
  const BadgeIcon = badge.icon;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-xs">
      <div>
        <span className="text-xs text-slate-400 font-medium">Panel Redaksi</span>
        <h2 className="text-sm font-bold text-slate-800">Catatan Negeri CMS</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Role badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
            <p className="text-[10px] text-slate-500">{user.email}</p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Keluar dari Sistem"
          className="p-2 text-slate-400 hover:text-brand-red hover:bg-slate-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

