"use client";

import React, { useState, useMemo } from "react";
import { 
  FileDown, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  Crown, 
  Lock, 
  ArrowUpDown, 
  Clock, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  PieChart as PieIcon
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatRupiah, formatDateWIB } from "@/lib/utils";
import { generatePDFReport, generateExcelReport } from "@/lib/export/generator";

export default function LaporanPage() {
  const { 
    user, 
    transactions, 
    wallets, 
    categories, 
    exportHistory, 
    addExportRecord 
  } = useAppData();

  const isPro = user.plan_tier === "pro";

  // Filter & Search
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [walletFilter, setWalletFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Filtered & Sorted Transactions
  const filteredData = useMemo(() => {
    let result = transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.category_id !== categoryFilter) return false;
      if (walletFilter !== "all" && t.wallet_id !== walletFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const noteMatch = t.notes?.toLowerCase().includes(q);
        const merchantMatch = t.merchant_name?.toLowerCase().includes(q);
        if (!noteMatch && !merchantMatch) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortField === "date") {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      } else {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
    });

    return result;
  }, [transactions, typeFilter, categoryFilter, walletFilter, search, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Financial Summary
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catMap: Record<string, number> = {};

    filteredData.forEach((t) => {
      if (t.type === "income") income += t.amount;
      if (t.type === "expense") {
        expense += t.amount;
        const cat = categories.find((c) => c.id === t.category_id)?.name || "Lain-lain";
        catMap[cat] = (catMap[cat] || 0) + t.amount;
      }
    });

    const top5Cats = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      income,
      expense,
      net: income - expense,
      top5Cats,
    };
  }, [filteredData, categories]);

  // Export PDF Handler
  const handleExportPDF = async () => {
    if (!isPro) {
      alert("Fitur Export PDF & Excel khusus untuk paket Pro. Silakan upgrade paket Anda!");
      return;
    }

    const periodLabel = "Oktober 2026 (Semua Transaksi)";
    const blob = await generatePDFReport(user, filteredData, wallets, categories, periodLabel);
    const fileName = `TataDana_Laporan_${Date.now()}.pdf`;

    // Download file
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    // Save record to export history
    addExportRecord({
      user_id: user.id,
      file_name: fileName,
      file_type: "pdf",
      period_range: periodLabel,
      storage_path: `tatadana-exports/${user.id}/${fileName}`,
      file_size_kb: Math.round(blob.size / 1024),
    });
  };

  // Export Excel Handler
  const handleExportExcel = async () => {
    if (!isPro) {
      alert("Fitur Export PDF & Excel khusus untuk paket Pro. Silakan upgrade paket Anda!");
      return;
    }

    const periodLabel = "Oktober 2026 (Semua Transaksi)";
    const blob = await generateExcelReport(user, filteredData, wallets, categories, periodLabel);
    const fileName = `TataDana_Transaksi_${Date.now()}.xlsx`;

    // Download file
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    // Save record to export history
    addExportRecord({
      user_id: user.id,
      file_name: fileName,
      file_type: "xlsx",
      period_range: periodLabel,
      storage_path: `tatadana-exports/${user.id}/${fileName}`,
      file_size_kb: Math.round(blob.size / 1024),
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analisis arus kas mendalam, tabel sortable, dan generator ekspor PDF/Excel on-demand.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportPDF}
            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 shadow-sm ${
              isPro
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
            {!isPro && <Lock className="w-3.5 h-3.5 ml-1 text-slate-400" />}
          </button>

          <button
            onClick={handleExportExcel}
            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 shadow-sm ${
              isPro
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
            {!isPro && <Lock className="w-3.5 h-3.5 ml-1 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card-subtle">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Pemasukan</span>
          <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            +{formatRupiah(summary.income)}
          </div>
          <span className="text-[11px] text-emerald-700/80 font-medium">Akumulasi sesuai filter</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card-subtle">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Pengeluaran</span>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            -{formatRupiah(summary.expense)}
          </div>
          <span className="text-[11px] text-rose-500 font-medium">Akumulasi belanja & tagihan</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card-subtle">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Arus Kas Bersih (Net)</span>
          <div className={`text-2xl font-extrabold tracking-tight ${summary.net >= 0 ? "text-orange-600" : "text-rose-600"}`}>
            {formatRupiah(summary.net)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {summary.net >= 0 ? "Surplus kas positif 🎉" : "Defisit pengeluaran"}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/70 shadow-card-subtle flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700"
          >
            <option value="all">Semua Tipe</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>

          <select
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Report Table with Column Sorting */}
      <div className="bg-white rounded-3xl border border-slate-200/70 shadow-card-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200/60 text-slate-600 font-bold">
              <tr>
                <th
                  onClick={() => {
                    setSortField("date");
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  }}
                  className="py-3.5 px-4 cursor-pointer hover:text-orange-600 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Tanggal & Jam (WIB)</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Tipe</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Dompet</th>
                <th className="py-3.5 px-4">Catatan</th>
                <th
                  onClick={() => {
                    setSortField("amount");
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  }}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-orange-600 transition"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Nominal</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((t) => {
                const cat = categories.find((c) => c.id === t.category_id);
                const w = wallets.find((w) => w.id === t.wallet_id);
                const isIncome = t.type === "income";

                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                      {formatDateWIB(t.date, true)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isIncome
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {isIncome ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">
                      {cat?.icon} {cat?.name || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {w?.name || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {t.notes || "-"}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-extrabold ${
                        isIncome ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {isIncome ? "+" : "-"}{formatRupiah(t.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan halaman {page} dari {totalPages} ({filteredData.length} total)</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Riwayat Export Tersimpan */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-card-subtle">
        <h3 className="font-bold text-slate-900 text-base mb-1">Riwayat Ekspor Laporan</h3>
        <p className="text-xs text-slate-500 mb-4">
          File tersimpan privat di Supabase Storage. Dapat diunduh ulang sewaktu-waktu.
        </p>

        {exportHistory.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Belum ada riwayat export laporan.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {exportHistory.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${exp.file_type === "pdf" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                    {exp.file_type === "pdf" ? <FileText className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">{exp.file_name}</span>
                    <span className="text-[11px] text-slate-400">
                      {formatDateWIB(exp.created_at, true)} • {exp.file_size_kb} KB
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Mengunduh file: ${exp.file_name} dari storage`)}
                  className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
                  title="Unduh ulang"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
