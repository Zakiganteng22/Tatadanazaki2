"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setIsLoading(false);
        // If pending, redirect to pending approval page
        if (data.status === "pending") {
          router.push(`/pending-approval?email=${encodeURIComponent(email)}&name=${encodeURIComponent(data.user?.full_name || "")}`);
          return;
        }

        setErrorMessage(data.message || "Gagal masuk ke akun.");
        return;
      }

      // Successful approved login
      setUser(data.user);

      // Route separation (RBAC): Admin to /admin, User to /dashboard
      if (data.user.role === "admin" || data.user.is_admin) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(`Terjadi kesalahan jaringan: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-800 bg-[#FDFCFB]">
      {/* Kiri (40%) — Branding Panel (Desktop Only) */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white text-orange-600 flex items-center justify-center font-extrabold text-xl shadow-md">
              T
            </div>
            <span className="font-extrabold text-2xl tracking-tight">TataDana</span>
          </Link>

          <div className="mt-20 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-200">
              Personal Finance SaaS
            </span>
            <h2 className="text-4xl font-extrabold leading-tight">
              Sistem Otentikasi &amp;<br />Role Berbasis Izin
            </h2>
            <p className="text-orange-100 text-sm leading-relaxed max-w-sm">
              Pemisahan ketat dashboard pengguna dan dashboard administrator, dengan verifikasi persetujuan akun terpusat.
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/20 text-xs text-orange-100 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Role-Based Access Control (RBAC) &bull; Admin Approval Guard</span>
        </div>
      </div>

      {/* Kanan (60%) — Form Container (Full on Mobile) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-7">
          <div>
            <Link href="/" className="lg:hidden inline-flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
                T
              </div>
              <span className="font-bold text-lg text-slate-900">TataDana</span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke TataDana
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gunakan email &amp; kata sandi Anda yang telah disetujui.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@tatadana.id"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? "Memverifikasi..." : "Masuk ke Sistem"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Belum punya akun TataDana?{" "}
            <Link href="/register" className="font-bold text-orange-600 hover:underline">
              Daftar Akun Baru (Pending Verifikasi)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
