"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  LogOut, 
  Lock,
  UserCheck,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatDateWIB } from "@/lib/utils";

function PendingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useAppData();

  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  // Email to check (from query or context)
  const emailToCheck = searchParams.get("email") || user.email || "budi@email.com";
  const nameDisplay = searchParams.get("name") || user.full_name || "Pengguna Baru";

  // Check approval status from backend
  const handleCheckStatus = async () => {
    setIsChecking(true);
    setCheckResult(null);

    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();

      if (data.ok && Array.isArray(data.users)) {
        const found = data.users.find(
          (u: any) => u.email.toLowerCase() === emailToCheck.toLowerCase() || u.id === user.id
        );

        if (found) {
          if (found.status === "approved") {
            setIsApproved(true);
            setUser(found);
            setCheckResult("🎉 Selamat! Akun Anda telah disetujui oleh Admin. Mengarahkan ke Dashboard...");
            setTimeout(() => {
              router.push("/dashboard");
            }, 1200);
            return;
          } else if (found.status === "rejected") {
            setCheckResult("❌ Maaf, pendaftaran akun Anda ditolak oleh Admin. Hubungi dukungan kami.");
          } else {
            setCheckResult("⏳ Akun Anda masih dalam antrean verifikasi Admin. Silakan periksa kembali beberapa saat lagi.");
          }
        } else {
          setCheckResult("ℹ️ Data akun sedang diproses di sistem.");
        }
      }
    } catch (err: any) {
      setCheckResult(`Gagal memeriksa status: ${err.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // If user is already approved, direct to dashboard
    if (user.status === "approved") {
      router.push("/dashboard");
    }
  }, [user.status, router]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col justify-between text-slate-800">
      {/* Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
            T
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">TataDana</span>
        </Link>

        <Link
          href="/login"
          className="text-xs font-bold text-slate-600 hover:text-orange-600 transition flex items-center space-x-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Masuk</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-card-subtle space-y-6 text-center animate-in fade-in duration-200">
          {/* Animated Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-inner">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>Status: Menunggu Persetujuan Admin</span>
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Akun Sedang Menunggu Verifikasi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
              Terima kasih telah mendaftar di <strong>TataDana</strong>! Sesuai standar keamanan sistem, setiap akun baru harus disetujui oleh Administrator sebelum dapat mengakses data dan fitur dashboard keuangan.
            </p>
          </div>

          {/* User Details Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-left text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">Nama Pendaftar:</span>
              <span className="font-bold text-slate-800">{nameDisplay}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono font-medium text-slate-800">{emailToCheck}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">Waktu Registrasi:</span>
              <span className="text-slate-700">{formatDateWIB(new Date(), false)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status Akun:</span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                ⏳ Pending Approval
              </span>
            </div>
          </div>

          {/* Result Alert */}
          {checkResult && (
            <div className={`p-4 rounded-2xl text-xs font-medium flex items-center space-x-2 text-left animate-in fade-in ${
              isApproved 
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800" 
                : "bg-amber-50 border border-amber-200 text-amber-800"
            }`}>
              {isApproved ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <span>{checkResult}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Memeriksa Status..." : "Periksa Status Persetujuan"}</span>
            </button>

            {/* Demo & Testing Shortcut */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 mb-2">
                Sedang menguji alur aplikasi? Buka Dashboard Admin untuk menyetujui akun ini:
              </p>
              <Link
                href="/admin"
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>Buka Dashboard Admin (Manajemen Approval)</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        TataDana Fintech SaaS &bull; Keamanan Terintegrasi RBAC
      </footer>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    }>
      <PendingApprovalContent />
    </Suspense>
  );
}

