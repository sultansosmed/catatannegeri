import React from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserManager } from "@/components/admin/UserManager";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { authorProfile: true },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            Manajemen Akun & Hak Akses
          </span>
          <h1 className="font-serif text-2xl font-black text-brand-navy">
            Pengguna & Peran Redaksi (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin (Pemimpin Redaksi), Editor (Redaktur), dan Author (Wartawan) dengan kontrol peran interaktif.
          </p>
        </div>
      </div>

      <UserManager initialUsers={users as any} currentUserId={currentUser.id} />
    </div>
  );
}
