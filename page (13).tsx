"use client";

import React, { useState } from "react";
import { Target, Plus, AlertTriangle, AlertCircle, CheckCircle, Trash2, Edit3, X } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatRupiah, renderProgressBar } from "@/lib/utils";

export default function BudgetPage() {
  const { categories, budgets, transactions, setCategoryBudget, deleteBudget } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || "");
  const [limitAmount, setLimitAmount] = useState("");

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Compute spent amount per budget
  const budgetList = budgets.map((b) => {
    const cat = categories.find((c) => c.id === b.category_id);
    const spent = transactions
      .filter((t) => t.category_id === b.category_id && t.date.slice(0, 7) === currentMonth && t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    const percentage = Math.round((spent / b.monthly_limit) * 100);
    const remaining = Math.max(0, b.monthly_limit - spent);

    return {
      ...b,
      category: cat,
      spent,
      percentage,
      remaining,
    };
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(limitAmount.replace(/[^0-9]/g, ""));
    if (!num || num <= 0) return;

    setCategoryBudget(selectedCatId, num);
    setIsModalOpen(false);
    setLimitAmount("");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Target Budget Bulanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kendalikan pengeluaran dengan limit per kategori dan peringatan instan via Telegram.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm transition shadow-sm flex items-center space-x-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Atur Target Baru</span>
        </button>
      </div>

      {/* Budget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgetList.map((b) => {
          const isOver = b.percentage >= 100;
          const isWarning = b.percentage >= 80 && !isOver;

          return (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-card-subtle flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Accent bar based on status */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-xl">
                      {b.category?.icon || "🏷️"}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{b.category?.name}</h3>
                      <span className="text-[11px] text-slate-400">Periode: Bulan ini</span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteBudget(b.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition rounded-lg"
                    title="Hapus Budget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-1.5 my-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Terpakai {b.percentage}%</span>
                    <span className="text-slate-400">Limit: {formatRupiah(b.monthly_limit)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-orange-500"
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {renderProgressBar(b.percentage, 12)}
                  </div>
                </div>
              </div>

              {/* Status Alert Badge */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Sisa Alokasi</span>
                  <span className={`font-extrabold ${isOver ? "text-rose-600" : "text-slate-800"}`}>
                    {formatRupiah(b.remaining)}
                  </span>
                </div>

                {isOver ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Over Budget (100%)</span>
                  </span>
                ) : isWarning ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Waspada (80%)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Aman</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Set Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 mb-4">Set Target Budget Kategori</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kategori</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                >
                  {categories
                    .filter((c) => c.type === "expense")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Limit Bulanan (Rp)</label>
                <input
                  type="text"
                  required
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  placeholder="Contoh: 1.500.000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                />
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                TataDana akan otomatis memantau transaksi dari Telegram dan mengirim pesan alert saat pemakaian mencapai 80% dan 100%.
              </p>

              <button
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition shadow-sm"
              >
                Simpan Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
