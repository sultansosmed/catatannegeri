import React from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function AdminAuditLogsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
          Keamanan & Integritas Data
        </span>
        <h1 className="font-serif text-2xl font-black text-brand-navy">
          Log Audit Aktivitas Administratif
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Rekaman jejak digital setiap aksi penerbitan, pengubahan pengaturan, dan otentikasi sistem.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Aksi Administratif</th>
                <th className="px-4 py-3">Entitas</th>
                <th className="px-4 py-3">Pengguna / Eksekutor</th>
                <th className="px-4 py-3">Keterangan / Detail</th>
                <th className="px-4 py-3">Alamat IP</th>
                <th className="px-4 py-3">Waktu Kejadian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-brand-navy">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                    {log.entityType}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {log.user ? (
                      <div>
                        <p className="font-bold text-slate-800">{log.user.name}</p>
                        <p className="text-[10px] text-slate-400">{log.user.email} ({log.user.role})</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Sistem / Tamu</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                    {log.details || "-"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {log.ipAddress || "127.0.0.1"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                    {format(new Date(log.createdAt), "d MMM yyyy HH:mm:ss", { locale: id })}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>Belum ada rekaman audit log.</p>
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

