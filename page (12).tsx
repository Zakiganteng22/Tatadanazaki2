"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Target, 
  TrendingUp, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  Filter,
  Calendar,
  MessageSquare,
  Bot
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area 
} from "recharts";
import { useAppData } from "@/context/AppDataContext";
import { formatRupiah, formatDateWIB } from "@/lib/utils";

import { TelegramSimulatorModal } from "@/components/telegram/TelegramSimulatorModal";

const PIE_COLORS = ["#F97316", "#3B82F6", "#EF4444", "#EC4899", "#8B5CF6", "#14B8A6", "#F59E0B", "#10B981"];

export default function DashboardOverviewPage() {
  const { user, stats, wallets, categories, budgets, transactions, telegramAccount } = useAppData();
  const [period, setPeriod] = useState<"hari" | "minggu" | "bulan" | "tahun">("bulan");
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [quickInput, setQuickInput] = useState("");

  // Filtered transactions based on period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      if (period === "hari") {
        return tDate.toDateString() === now.toDateString();
      }
      if (period === "minggu") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
        return tDate >= sevenDaysAgo;
      }
      if (period === "bulan") {
        return tDate.getFullYear() === now.getFullYear() && tDate.getMonth() === now.getMonth();
      }
      if (period === "tahun") {
        return tDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, period]);

  // Category breakdown for Pie Chart
  const pieData = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredTransactions.forEach((t) => {
      if (t.type === "expense") {
        const cat = categories.find((c) => c.id === t.category_id)?.name || "Lain-lain";
        catMap[cat] = (catMap[cat] || 0) + t.amount;
      }
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions, categories]);

  // 6 Months Income vs Expense for Bar Chart
  const barData = useMemo(() => {
    const months = ["Mei", "Jun", "Jul", "Ags", "Sep", "Okt"];
    return [
      { name: "Mei", pemasukan: 7200000, pengeluaran: 4800000 },
      { name: "Jun", pemasukan: 7500000, pengeluaran: 5300000 },
      { name: "Jul", pemasukan: 8000000, pengeluaran: 5900000 },
      { name: "Ags", pemasukan: 8200000, pengeluaran: 6100000 },
      { name: "Sep", pemasukan: 8500000, pengeluaran: 6400000 },
      { name: "Okt", pemasukan: stats.monthlyIncome || 8500000, pengeluaran: stats.monthlyExpense || 5200000 },
    ];
  }, [stats]);

  // Daily Expense Trend Line
  const trendData = useMemo(() => {
    const days = [
      { day: "1 Okt", amount: 150000 },
      { day: "3 Okt", amount: 280000 },
      { day: "5 Okt", amount: 125000 },
      { day: "7 Okt", amount: 450000 },
      { day: "9 Okt", amount: 210000 },
      { day: "11 Okt", amount: 375000 },
      { day: "13 Okt", amount: 185000 },
    ];
    return days;
  }, []);

  // Onboarding steps completion
  const onboardingSteps = [
    {
      id: "telegram",
      label: "Hubungkan Akun Telegram",
      desc: "Link nomor HP untuk mulai catat transaksi via bot",
      completed: telegramAccount.is_connected,
      href: "/dashboard/settings",
    },
    {
      id: "wallet",
      label: "Atur Dompet & Saldo Awal",
      desc: "Buat dompet Cash, BCA, GoPay dan tentukan dompet default",
      completed: wallets.length > 0,
      href: "/dashboard/wallet",
    },
    {
      id: "budget",
      label: "Tetapkan Target Budget Bulanan",
      desc: "Pasang limit pengeluaran untuk dapatkan peringatan otomatis",
      completed: budgets.length > 0,
      href: "/dashboard/budget",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Halo, {user.full_name.split(" ")[0]}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Berikut ringkasan arus kas keuanganmu secara realtime (WIB).
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
          {(["hari", "minggu", "bulan", "tahun"] as const).map((p) => {
            const labels = { hari: "Hari ini", minggu: "7 Hari", bulan: "Bulan ini", tahun: "Tahun ini" };
            const isActive = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition capitalize ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chatbot Quick-Input Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-3xl p-5 sm:p-6 text-white shadow-glow-orange flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping"></span>
            <span className="font-extrabold text-sm sm:text-base tracking-tight flex items-center space-x-1.5">
              <Bot className="w-4 h-4" />
              <span>Chatbot Telegram @TataDanaBot Siap Digunakan</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-orange-100 max-w-xl leading-relaxed">
            Catat pemasukan atau pengeluaranmu cukup dengan mengetik bahasa santai, pesan suara, atau struk.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
            <span className="text-orange-200">Coba:</span>
            <button
              onClick={() => setIsBotOpen(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium transition"
            >
              🍜 beli soto 25rb
            </button>
            <button
              onClick={() => setIsBotOpen(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium transition"
            >
              💰 gajian 8.5jt
            </button>
            <button
              onClick={() => setIsBotOpen(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium transition font-mono"
            >
              /saldo
            </button>
            <button
              onClick={() => setIsBotOpen(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium transition font-mono"
            >
              /budget
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsBotOpen(true)}
          className="px-6 py-3 bg-white text-orange-600 hover:bg-orange-50 rounded-2xl font-extrabold text-xs sm:text-sm transition shadow-lg shrink-0 flex items-center justify-center space-x-2"
        >
          <Bot className="w-4 h-4 text-orange-600" />
          <span>Buka Chatbot Sekarang</span>
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Total</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(stats.totalBalance)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Dari <strong>{wallets.length} dompet</strong> aktif
            </p>
          </div>
        </div>

        {/* Card 2: Pemasukan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pemasukan ({period})</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              +{formatRupiah(stats.monthlyIncome)}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1 flex items-center space-x-1 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Arus kas masuk bulan ini</span>
            </p>
          </div>
        </div>

        {/* Card 3: Pengeluaran */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengeluaran ({period})</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              -{formatRupiah(stats.monthlyExpense)}
            </div>
            <p className="text-[11px] text-rose-600 mt-1 font-medium">
              Tercatat otomatis via bot & web
            </p>
          </div>
        </div>

        {/* Card 4: Sisa Budget */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Tersisa</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-blue-600 tracking-tight">
              {formatRupiah(stats.remainingBudget)}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-orange-500 h-1.5 rounded-full" 
                style={{ width: `${Math.min(100, (stats.monthlyExpense / (stats.totalBudget || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Dari total limit {formatRupiah(stats.totalBudget)}
            </p>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist for Users */}
      {(!telegramAccount.is_connected || wallets.length < 3) && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl p-5 sm:p-6 shadow-glow-orange">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl">Lengkapi Persiapan TataDana Kamu</h3>
              <p className="text-xs sm:text-sm text-orange-100 mt-0.5">
                Hanya butuh 2 menit untuk menikmati kenyamanan catat keuangan otomatis.
              </p>
            </div>
            <span className="text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              Langkah Awal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {onboardingSteps.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl p-3.5 transition flex items-start space-x-3 border border-white/15"
              >
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-white/70 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{step.label}</h4>
                  <p className="text-[11px] text-orange-100/90 mt-1 leading-snug">{step.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart: Pengeluaran per Kategori */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-card-subtle flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Pengeluaran per Kategori</h3>
            <p className="text-xs text-slate-500 mt-0.5">Proporsi pengeluaran periode ini</p>
          </div>

          {pieData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Belum ada data transaksi pengeluaran.
            </div>
          ) : (
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {pieData.slice(0, 4).map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="text-slate-600 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: 6 Bulan Terakhir */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-card-subtle lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Pemasukan vs Pengeluaran</h3>
              <p className="text-xs text-slate-500 mt-0.5">Perbandingan 6 bulan terakhir</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="flex items-center space-x-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Pemasukan</span>
              </span>
              <span className="flex items-center space-x-1 text-orange-600">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>Pengeluaran</span>
              </span>
            </div>
          </div>

          <div className="h-64 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v / 1000000}jt`} />
                <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                <Bar dataKey="pemasukan" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pengeluaran" fill="#F97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Rata-rata rasio tabungan: <strong>34%</strong></span>
            <Link href="/dashboard/laporan" className="text-orange-600 font-bold hover:underline">
              Lihat Laporan Lengkap →
            </Link>
          </div>
        </div>
      </div>

      {/* Trend Line & 10 Transaksi Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line: Pengeluaran Harian */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-card-subtle flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Trend Harian Bulan Ini</h3>
            <p className="text-xs text-slate-500 mt-0.5">Fluktuasi pengeluaran per hari</p>
          </div>

          <div className="h-56 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
                <Area type="monotone" dataKey="amount" stroke="#F97316" strokeWidth={2.5} fillOpacity={1} fill="url(#orangeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Puncak pengeluaran tertinggi terjadi pada <strong>7 Oktober</strong>.
          </p>
        </div>

        {/* 10 Transaksi Terbaru */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-card-subtle lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">10 Transaksi Terbaru</h3>
              <p className="text-xs text-slate-500">Pembaruan realtime dari Telegram & Web</p>
            </div>
            <Link
              href="/dashboard/transaksi"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center space-x-1"
            >
              <span>Semua Transaksi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 10).map((tx) => {
              const cat = categories.find((c) => c.id === tx.category_id);
              const wallet = wallets.find((w) => w.id === tx.wallet_id);
              const isIncome = tx.type === "income";

              return (
                <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-lg shrink-0">
                      {cat?.icon || (isIncome ? "💰" : "🏷️")}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">
                          {tx.notes || cat?.name || "Transaksi"}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {tx.source.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDateWIB(tx.date, true)} • {wallet?.name || "Dompet"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`font-extrabold text-sm block ${isIncome ? "text-emerald-600" : "text-slate-900"}`}>
                      {isIncome ? "+" : "-"}{formatRupiah(tx.amount)}
                    </span>
                    {tx.merchant_name && (
                      <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                        {tx.merchant_name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Telegram Chatbot Simulator Modal */}
      <TelegramSimulatorModal
        isOpen={isBotOpen}
        onClose={() => setIsBotOpen(false)}
      />
    </div>
  );
}
