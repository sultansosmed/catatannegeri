"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit2, Shield, UserCheck, CheckCircle2, XCircle, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "EDITOR" | "AUTHOR";
  isActive: boolean;
  createdAt: Date | string;
  authorProfile?: { displayName: string; title: string | null } | null;
}

export function UserManager({ initialUsers, currentUserId }: { initialUsers: UserItem[]; currentUserId: string }) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "EDITOR" | "AUTHOR">("AUTHOR");
  const [authorTitle, setAuthorTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpenAdd = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("AUTHOR");
    setAuthorTitle("Wartawan");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, authorTitle, isActive: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pengguna.");

      setUsers((prev) => [...prev, { ...data.user, createdAt: new Date() }]);
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: UserItem) => {
    if (u.id === currentUserId) {
      alert("Anda tidak dapat menonaktifkan akun Anda sendiri.");
      return;
    }
    const newStatus = !u.isActive;
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...u, isActive: newStatus }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isActive: newStatus } : item))
      );
    }
  };

  const handleChangeRole = async (u: UserItem, newRole: "SUPER_ADMIN" | "EDITOR" | "AUTHOR") => {
    if (u.id === currentUserId) {
      alert("Anda tidak dapat mengubah peran akun Anda sendiri.");
      return;
    }
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...u, role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, role: newRole } : item))
      );
    }
  };

  const handleDelete = async (u: UserItem) => {
    if (u.id === currentUserId) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    if (!confirm(`Hapus akun "${u.name}" (${u.email})?`)) return;

    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Pengguna / Jurnalis Baru
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-serif font-bold text-base text-brand-navy">
                Buat Akun Redaksi Baru
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Misal: Ahmad Fauzi"
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Surel (Email) *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ahmad@catatannegeri.com"
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Awal * (Min. 8 Karakter)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran Akses (RBAC)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red bg-white"
                  >
                    <option value="AUTHOR">Wartawan / Penulis (Author)</option>
                    <option value="EDITOR">Redaktur / Editor</option>
                    <option value="SUPER_ADMIN">Pemimpin Redaksi (Super Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan Redaksi</label>
                  <input
                    type="text"
                    value={authorTitle}
                    onChange={(e) => setAuthorTitle(e.target.value)}
                    placeholder="Jurnalis Investigasi"
                    className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-brand-red text-white font-bold"
                >
                  {saving ? "Membuat..." : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Nama Pengguna</th>
                <th className="px-4 py-3">Surel</th>
                <th className="px-4 py-3">Peran Akses (RBAC)</th>
                <th className="px-4 py-3">Jabatan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                        (Akun Anda)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-mono">
                    {u.email}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <select
                      value={u.role}
                      disabled={u.id === currentUserId}
                      onChange={(e) => handleChangeRole(u, e.target.value as any)}
                      className="text-[11px] font-bold uppercase rounded border border-slate-200 px-2 py-1 bg-white"
                    >
                      <option value="AUTHOR">AUTHOR</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {u.authorProfile?.title || "-"}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={u.id === currentUserId}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {u.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-600" /> Diblokir
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Hapus Pengguna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

