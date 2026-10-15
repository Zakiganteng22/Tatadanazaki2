"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Cpu, 
  Users, 
  FileText, 
  CreditCard, 
  Eye, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Download, 
  Key,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  UserX,
  UserPlus,
  Lock,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatRupiah, formatDateWIB } from "@/lib/utils";
import { UserProfile, UserStatus, UserRole } from "@/types";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { 
    user, 
    setUser,
    startImpersonation, 
    aiProviders, 
    updateAIProvider, 
    addAIProvider, 
    deleteAIProvider, 
    aiLogs, 
    payments, 
    approvePayment, 
    rejectPayment, 
    transactions, 
    auditLogs, 
    addAuditLog 
  } = useAppData();

  const [activeTab, setActiveTab] = useState<"users" | "ai" | "payments" | "audit">("users");

  // Users Live State from Server API
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);

  // AI Provider Form State
  const [newProvName, setNewProvName] = useState("");
  const [newProvDisplayName, setNewProvDisplayName] = useState("");
  const [newProvModel, setNewProvModel] = useState("");
  const [newProvKey, setNewProvKey] = useState("");
  const [newProvMode, setNewProvMode] = useState<"single" | "failover">("single");

  // Inspect user transactions modal
  const [inspectUser, setInspectUser] = useState<UserProfile | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.ok && Array.isArray(data.users)) {
        setUsersList(data.users);
      }
    } catch (err) {
      console.warn("Failed to fetch users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle User Status Update (Approve / Reject)
  const handleUpdateStatus = async (targetUser: UserProfile, newStatus: UserStatus) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUser.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        setUserActionMsg(`Status akun ${targetUser.full_name} berhasil diubah menjadi: ${newStatus.toUpperCase()}`);
        addAuditLog("update_user_status", { target_name: targetUser.full_name, new_status: newStatus }, targetUser.id);
        fetchUsers();
        setTimeout(() => setUserActionMsg(null), 3000);
      }
    } catch (err: any) {
      alert(`Gagal memperbarui status: ${err.message}`);
    }
  };

  // Handle Role Change (Admin <-> User)
  const handleUpdateRole = async (targetUser: UserProfile, newRole: UserRole) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUser.id, role: newRole }),
      });
      const data = await res.json();
      if (data.ok) {
        setUserActionMsg(`Role ${targetUser.full_name} berhasil diubah menjadi: ${newRole.toUpperCase()}`);
        addAuditLog("update_user_role", { target_name: targetUser.full_name, new_role: newRole }, targetUser.id);
        fetchUsers();
        setTimeout(() => setUserActionMsg(null), 3000);
      }
    } catch (err: any) {
      alert(`Gagal memperbarui role: ${err.message}`);
    }
  };

  // Handle User Deletion
  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (!confirm(`Yakin ingin menghapus akun ${targetUser.full_name} (${targetUser.email})?`)) return;

    try {
      const res = await fetch(`/api/admin/users?userId=${targetUser.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setUserActionMsg(`User ${targetUser.full_name} berhasil dihapus.`);
        addAuditLog("delete_user", { target_name: targetUser.full_name }, targetUser.id);
        fetchUsers();
        setTimeout(() => setUserActionMsg(null), 3000);
      }
    } catch (err: any) {
      alert(`Gagal menghapus user: ${err.message}`);
    }
  };

  // Impersonate User Handler
  const handleImpersonate = (targetUser: UserProfile) => {
    startImpersonation(targetUser);
    router.push("/dashboard");
  };

  // Inspect User Transactions
  const handleInspectTransactions = (targetUser: UserProfile) => {
    setInspectUser(targetUser);
    addAuditLog("view_user_transactions", { target_name: targetUser.full_name }, targetUser.id);
  };

  // Add AI Provider
  const handleAddAIProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName || !newProvDisplayName) return;

    addAIProvider({
      name: newProvName.toLowerCase(),
      display_name: newProvDisplayName,
      model_name: newProvModel || "default-model",
      api_key_masked: newProvKey.slice(0, 7) + "••••••••••••",
      is_active: true,
      priority: aiProviders.length + 1,
      mode: newProvMode,
    });

    setNewProvName("");
    setNewProvDisplayName("");
    setNewProvModel("");
    setNewProvKey("");
  };

  // Export all users data
  const handleExportAllUsers = () => {
    const csvHeader = "ID,Nama,Email,No HP,Role,Status,Plan,Waktu Daftar\n";
    const csvRows = usersList
      .map((u) => `"${u.id}","${u.full_name}","${u.email}","${u.phone_number || "-"}","${u.role}","${u.status}","${u.plan_tier}","${u.created_at}"`)
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TataDana_Users_Approval_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addAuditLog("export_all_users_data", { count: usersList.length });
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesQuery = 
      !query || 
      u.full_name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query) || 
      (u.phone_number && u.phone_number.includes(query));
    return matchesStatus && matchesQuery;
  });

  const pendingCount = usersList.filter((u) => u.status === "pending").length;
  const approvedCount = usersList.filter((u) => u.status === "approved").length;
  const rejectedCount = usersList.filter((u) => u.status === "rejected").length;

  const isAdmin = user.role === "admin" || user.is_admin;

  // RBAC Access Control Guard
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">403 — Akses Ditolak</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Halaman ini dikhususkan untuk Administrator TataDana. Akun Anda saat ini memiliki role <strong>Pengguna Biasa (User)</strong>.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                // Quick switch for demo/testing
                setUser((prev) => ({ ...prev, role: "admin", is_admin: true }));
              }}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              Beralih ke Akun Superadmin (Demo Mode)
            </button>
            <Link
              href="/dashboard"
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard User</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Admin Top Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center font-extrabold text-white shadow-sm">
            T
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight">TataDana Admin Console</span>
              <span className="bg-orange-500/30 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500/40">
                Superadmin
              </span>
            </div>
            <p className="text-xs text-slate-400">Verifikasi Approval Pengguna, AI Multi-Provider, &amp; Transaksi</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-2 border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ke Dashboard User</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
              activeTab === "users"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manajemen User &amp; Approval</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[11px] animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
              activeTab === "ai"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Multi-Provider &amp; Logs</span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
              activeTab === "payments"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Pembayaran Midtrans / Transfer ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
              activeTab === "audit"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Log Sistem ({auditLogs.length})</span>
          </button>
        </div>

        {/* Action Alert Banner */}
        {userActionMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{userActionMsg}</span>
          </div>
        )}

        {/* Tab 1: Manajemen User & Approval RBAC */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-400">Total User Terdaftar</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{usersList.length}</p>
                <span className="text-[11px] text-slate-500 mt-1 block">Seluruh akun terdaftar di sistem</span>
              </div>

              <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden">
                <span className="text-xs font-bold text-amber-800">Menunggu Persetujuan</span>
                <p className="text-2xl font-extrabold text-amber-900 mt-1">{pendingCount}</p>
                <span className="text-[11px] text-amber-700 mt-1 block font-medium">Memerlukan verifikasi admin</span>
                {pendingCount > 0 && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </div>

              <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-sm">
                <span className="text-xs font-bold text-emerald-800">Akun Disetujui (Approved)</span>
                <p className="text-2xl font-extrabold text-emerald-900 mt-1">{approvedCount}</p>
                <span className="text-[11px] text-emerald-700 mt-1 block">Dapat login &amp; akses dashboard</span>
              </div>

              <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-sm">
                <span className="text-xs font-bold text-rose-800">Akun Ditolak (Rejected)</span>
                <p className="text-2xl font-extrabold text-rose-900 mt-1">{rejectedCount}</p>
                <span className="text-[11px] text-rose-700 mt-1 block">Akses login diblokir</span>
              </div>
            </div>

            {/* Filter, Search & Export Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, email, no HP..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Semua ({usersList.length})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1 ${
                    statusFilter === "pending" ? "bg-amber-500 text-slate-950 font-extrabold" : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  }`}
                >
                  <span>Pending</span>
                  <span className="bg-amber-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">{pendingCount}</span>
                </button>
                <button
                  onClick={() => setStatusFilter("approved")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === "approved" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  }`}
                >
                  Approved ({approvedCount})
                </button>
                <button
                  onClick={() => setStatusFilter("rejected")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === "rejected" ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                  }`}
                >
                  Rejected ({rejectedCount})
                </button>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={fetchUsers}
                  disabled={isLoadingUsers}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition"
                  title="Segarkan Data"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? "animate-spin" : ""}`} />
                </button>

                <button
                  onClick={handleExportAllUsers}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Users Approval Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Pengguna</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Status Akun</th>
                      <th className="py-3.5 px-4">Paket</th>
                      <th className="py-3.5 px-4">Waktu Terdaftar</th>
                      <th className="py-3.5 px-4 text-center">Aksi Administrator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400">
                          Tidak ada user yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          {/* Nama & Email */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0">
                                {u.full_name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                                  <span>{u.full_name}</span>
                                  {u.id === user.id && (
                                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">Anda</span>
                                  )}
                                </div>
                                <span className="text-slate-400 block font-mono text-[11px]">{u.email}</span>
                                {u.phone_number && (
                                  <span className="text-slate-400 block text-[10px]">{u.phone_number}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            {u.role === "admin" || u.is_admin ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-[11px]">
                                <ShieldCheck className="w-3 h-3 text-purple-600" />
                                <span>Admin</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                <span>User</span>
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            {u.status === "pending" && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>⏳ Pending Approval</span>
                              </span>
                            )}
                            {u.status === "approved" && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>✅ Approved</span>
                              </span>
                            )}
                            {u.status === "rejected" && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>❌ Rejected</span>
                              </span>
                            )}
                          </td>

                          {/* Paket */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              u.plan_tier === "pro" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {u.plan_tier}
                            </span>
                          </td>

                          {/* Tanggal Terdaftar */}
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {formatDateWIB(u.created_at, false)}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5 flex-wrap gap-y-1">
                              {/* Approve Button */}
                              {u.status !== "approved" && (
                                <button
                                  onClick={() => handleUpdateStatus(u, "approved")}
                                  className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs transition flex items-center space-x-1 shadow-sm"
                                  title="Setujui pendaftaran akun ini"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Setujui</span>
                                </button>
                              )}

                              {/* Reject Button */}
                              {u.status !== "rejected" && (
                                <button
                                  onClick={() => handleUpdateStatus(u, "rejected")}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition flex items-center space-x-1"
                                  title="Tolak pendaftaran akun ini"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Tolak</span>
                                </button>
                              )}

                              {/* Role Toggle */}
                              <button
                                onClick={() => handleUpdateRole(u, u.role === "admin" ? "user" : "admin")}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition"
                                title="Ganti Role Admin / User"
                              >
                                {u.role === "admin" ? "Jadikan User" : "Jadikan Admin"}
                              </button>

                              {/* Impersonate */}
                              <button
                                onClick={() => handleImpersonate(u)}
                                className="px-2 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition"
                                title="Login sebagai user ini"
                              >
                                Impersonasi
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-slate-300 hover:text-rose-600 transition"
                                title="Hapus User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Multi-Provider */}
        {activeTab === "ai" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Konfigurasi AI Multi-Provider</h3>
                  <p className="text-xs text-slate-500">Kelola prioritas engine Gemini, OpenAI, dan DeepSeek untuk parsing text, STT, dan Vision OCR.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {aiProviders.map((prov) => (
                  <div key={prov.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-slate-900">{prov.display_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prov.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                        }`}>
                          {prov.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-1">Model: {prov.model_name}</p>
                      <p className="text-xs font-mono text-slate-400">Key: {prov.api_key_masked}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-500">Mode: <strong>{prov.mode}</strong></span>
                      <button
                        onClick={() => updateAIProvider(prov.id, { is_active: !prov.is_active })}
                        className="text-orange-600 font-bold hover:underline"
                      >
                        {prov.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Execution Logs Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Log Eksekusi AI Terbaru</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Provider</th>
                      <th className="py-2.5 px-3">Fitur</th>
                      <th className="py-2.5 px-3">Tokens</th>
                      <th className="py-2.5 px-3">Latency</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 px-3 font-bold uppercase text-slate-800">{log.provider}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{log.feature}</td>
                        <td className="py-2.5 px-3 text-slate-700">{log.tokens_used}</td>
                        <td className="py-2.5 px-3 text-slate-700">{log.latency_ms} ms</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{formatDateWIB(log.created_at, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Pembayaran */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-slate-900">Persetujuan Transaksi Midtrans &amp; Transfer Manual</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Paket</th>
                    <th className="py-3 px-3">Nominal</th>
                    <th className="py-3 px-3">Metode</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{p.order_id}</td>
                      <td className="py-3 px-3">{p.user?.full_name || "Budi Pratama"}</td>
                      <td className="py-3 px-3 uppercase font-bold text-orange-600">{p.plan_tier}</td>
                      <td className="py-3 px-3 font-semibold">{formatRupiah(p.amount)}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{p.payment_method}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          p.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {p.status === "pending" ? (
                          <div className="flex justify-center space-x-1.5">
                            <button
                              onClick={() => approvePayment(p.id)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectPayment(p.id, "Bukti transfer tidak valid")}
                              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-slate-900">Audit Trail Administrator</h3>
            <p className="text-xs text-slate-500">Mencatat seluruh tindakan admin: verifikasi status approval, perubahan role, impersonasi, dan persetujuan transaksi.</p>
            <div className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <p className="py-6 text-center text-slate-400 text-xs">Belum ada aktivitas audit tercatat.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold font-mono text-orange-600">{log.action}</span>
                      <p className="text-slate-500 mt-0.5">{JSON.stringify(log.details)}</p>
                    </div>
                    <span className="text-slate-400 text-[11px] whitespace-nowrap">{formatDateWIB(log.created_at, true)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
