import React from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Mail, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function AdminSubscribersPage() {
  const user = await getCurrentUser();
  if (user?.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const subscribers = await db.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
          Pembaca & Komunitas
        </span>
        <h1 className="font-serif text-2xl font-black text-brand-navy">
          Daftar Pelanggan Buletin Catatan Negeri
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Daftar alamat surel pembaca yang berlangganan buletin kurasi berita harian.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Alamat Surel (Email)</th>
                <th className="px-4 py-3 text-center">Status Berlangganan</th>
                <th className="px-4 py-3">Waktu Pendaftaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900 font-mono">
                    {sub.email}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {sub.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        Berhenti Langganan
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                    {format(new Date(sub.subscribedAt), "d MMMM yyyy HH:mm", { locale: id })}
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-400">
                    <Mail className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>Belum ada pembaca yang mendaftar buletin.</p>
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

