"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  ArrowRight, 
  Mail, 
  Lock, 
  User,
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Laptop,
  AlertCircle,
  Clock,
  Phone
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, addCategory } = useAppData();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [profession, setProfession] = useState<"karyawan" | "freelance" | "mahasiswa">("karyawan");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const userName = fullName.trim() || "Pengguna TataDana";

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: userName,
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          password,
          profession,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMessage(data.message || "Gagal melakukan pendaftaran.");
        setIsLoading(false);
        return;
      }

      // Add tailored starter categories
      if (profession === "freelance") {
        addCategory("Software & SaaS Tools", "expense", "💻", "#8B5CF6");
        addCategory("Pendapatan Klien", "income", "💼", "#10B981");
      } else if (profession === "mahasiswa") {
        addCategory("Buku & Kuliah", "expense", "📚", "#6366F1");
        addCategory("Kiriman Ortu", "income", "🎓", "#10B981");
      }

      // Set user profile in state with pending status
      setUser(data.user);

      // Redirect immediately to /pending-approval page as mandated by approval workflow
      router.push(`/pending-approval?email=${encodeURIComponent(email)}&name=${encodeURIComponent(userName)}`);
    } catch (err: any) {
      setErrorMessage(`Terjadi kesalahan jaringan: ${err.message}`);
      setIsLoading(false);
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
              Registrasi Akun Baru
            </span>
            <h2 className="text-4xl font-extrabold leading-tight">
              Sistem Keamanan &amp;<br />Verifikasi Admin
            </h2>
            <p className="text-orange-100 text-sm leading-relaxed max-w-sm">
              Setiap pendaftaran baru diverifikasi terlebih dahulu oleh Administrator untuk menjaga privasi dan keamanan data finansial.
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/20 text-xs text-orange-100 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Status Akun Baru: Pending Verification by Admin</span>
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
              Daftar Akun Baru
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Isi data diri Anda. Akun akan ditinjau oleh Admin sebelum akses dashboard dibuka.
            </p>
          </div>

          {/* Pending Approval Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Pemberitahuan Sistem:</strong> Setelah mendaftar, akun Anda akan berstatus <em>Pending</em> hingga disetujui oleh Admin.
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Pratama"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@email.com"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nomor Handphone (Opsional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="081234567890"
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
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>
            </div>

            {/* Profil Profesi */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-700 mb-2">Profil Utama Anda:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProfession("karyawan")}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    profession === "karyawan"
                      ? "border-orange-500 bg-orange-50 text-orange-700 font-bold"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <Briefcase className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                  <span className="text-[11px] block">Karyawan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfession("freelance")}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    profession === "freelance"
                      ? "border-orange-500 bg-orange-50 text-orange-700 font-bold"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <Laptop className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                  <span className="text-[11px] block">Freelancer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfession("mahasiswa")}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    profession === "mahasiswa"
                      ? "border-orange-500 bg-orange-50 text-orange-700 font-bold"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                  <span className="text-[11px] block">Mahasiswa</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? "Mendaftarkan Akun..." : "Daftar & Kirim Pengajuan"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-xs text-slate-500 pt-1">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-bold text-orange-600 hover:underline">
                Masuk di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
