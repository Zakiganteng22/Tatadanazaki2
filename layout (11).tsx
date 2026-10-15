"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  CreditCard, 
  BarChart3, 
  Target, 
  Wallet as WalletIcon, 
  Settings, 
  Bot, 
  Crown, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert, 
  Sparkles,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { TelegramSimulatorModal } from "@/components/telegram/TelegramSimulatorModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isImpersonating, stopImpersonation, setUser } = useAppData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isBotSimulatorOpen, setIsBotSimulatorOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Route Guard & Admin Approval Enforcement
  useEffect(() => {
    if (user.status === "pending") {
      router.push(`/pending-approval?email=${encodeURIComponent(user.email || "")}&name=${encodeURIComponent(user.full_name || "")}`);
    } else if (user.status === "rejected") {
      router.push("/login");
    }
  }, [user.status, user.email, user.full_name, router]);

  const navItems = [
    { name: "Beranda", href: "/dashboard", icon: Home },
    { name: "Transaksi", href: "/dashboard/transaksi", icon: CreditCard },
    { name: "Laporan", href: "/dashboard/laporan", icon: BarChart3 },
    { name: "Budget", href: "/dashboard/budget", icon: Target },
    { name: "Wallet", href: "/dashboard/wallet", icon: WalletIcon },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col md:flex-row text-slate-800">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 font-medium text-xs sm:text-sm flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-slate-950" />
            <span>Mode Impersonasi Admin Aktif: Mengakses akun <strong>{user.full_name}</strong></span>
          </div>
          <button
            onClick={() => {
              stopImpersonation();
              router.push("/admin");
            }}
            className="px-3 py-1 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
          >
            Kembali ke Admin
          </button>
        </div>
      )}

      {/* Mobile Topbar */}
      <div className={`md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 ${isImpersonating ? "mt-8" : ""}`}>
        <Link href="/dashboard" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            T
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">TataDana</span>
        </Link>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBotSimulatorOpen(true)}
            className="p-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition text-xs font-semibold flex items-center space-x-1"
          >
            <Bot className="w-4 h-4" />
            <span>Bot</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 md:translate-x-0 md:static ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-0 max-md:-translate-x-full"
        } ${isImpersonating ? "md:pt-10" : ""}`}
      >
        <div>
          {/* Logo Branding */}
          <div className="p-6 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-extrabold text-xl shadow-glow-orange">
                T
              </div>
              <div>
                <span className="font-extrabold text-xl text-slate-900 tracking-tight block leading-tight">TataDana</span>
                <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Fintech SaaS</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Telegram Bot Live Interactive Pill */}
          <div className="px-4 mt-6">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-100 shadow-card-subtle">
              <div className="flex items-center space-x-2 text-xs font-bold text-orange-700 mb-1">
                <Bot className="w-4 h-4 text-orange-600 animate-bounce" />
                <span>Telegram Bot Online</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-2.5 leading-snug">
                Simulasi bot instan langsung di browser tanpa butuh tunnel.
              </p>
              <button
                onClick={() => setIsBotSimulatorOpen(true)}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Buka Bot Simulator</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Profile & Subscription Badge Bottom Section */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Plan Badge */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-lg ${user.plan_tier === "pro" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"}`}>
                <Crown className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  Paket {user.plan_tier === "pro" ? "Pro (Aktif)" : "Starter"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {user.plan_tier === "pro" ? "Fitur Unlimited" : `${user.monthly_transaction_count}/50 transaksi`}
                </span>
              </div>
            </div>
            {user.plan_tier === "starter" && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
              >
                Upgrade
              </button>
            )}
          </div>

          {/* User info & Logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-xs text-orange-700 shrink-0">
                {user.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 truncate block">{user.full_name}</span>
                <span className="text-[10px] text-slate-400 block">{user.phone_number || "No. Terdaftar"}</span>
              </div>
            </div>
            <Link
              href="/"
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className={`flex-1 min-w-0 overflow-y-auto ${isImpersonating ? "md:pt-8" : ""}`}>
        {children}
      </main>

      {/* Floating Telegram Simulator Launcher */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsBotSimulatorOpen(true)}
          className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-glow-orange flex items-center space-x-3 font-extrabold text-xs sm:text-sm transition transform hover:-translate-y-1 active:translate-y-0 border border-white/20"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
          </div>
          <span>Chatbot Input Transaksi</span>
        </button>
      </div>

      {/* Telegram Simulator Modal */}
      <TelegramSimulatorModal
        isOpen={isBotSimulatorOpen}
        onClose={() => setIsBotSimulatorOpen(false)}
      />

      {/* Upgrade Pro Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white mb-4 shadow-glow-orange">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Upgrade ke TataDana Pro</h3>
            <p className="text-xs text-slate-500 mb-4">
              Akses tanpa batas ke seluruh fitur otomasi Telegram & AI Financial Advisor.
            </p>

            <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-4 mb-4 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>Input transaksi via <strong>Foto Struk AI OCR</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span><strong>AI Financial Advisor</strong> analisis otomatis</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>Unlimited transaksi, wallet, & export PDF / Excel</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between mb-6">
              <div>
                <span className="text-xs text-slate-400 line-through">Rp199.000</span>
                <div className="text-2xl font-extrabold text-orange-600">Rp99.000</div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                Sekali Bayar Selamanya
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setUser((prev) => ({ ...prev, plan_tier: "pro" }));
                  setShowUpgradeModal(false);
                }}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition shadow-sm"
              >
                Bayar Instan via QRIS / Midtrans
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
