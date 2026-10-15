"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  Receipt, 
  Calendar,
  Wallet as WalletIcon,
  X
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatRupiah, formatDateWIB } from "@/lib/utils";

export default function TransaksiPage() {
  const { 
    wallets, 
    categories, 
    transactions, 
    transactionItems, 
    addTransaction, 
    deleteTransaction 
  } = useAppData();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedWallet, setSelectedWallet] = useState<string>("all");
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formType, setFormType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState<string>("");
  const [walletId, setWalletId] = useState<string>(wallets[0]?.id || "");
  const [transferToWalletId, setTransferToWalletId] = useState<string>(wallets[1]?.id || "");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered list
  const filtered = transactions.filter((t) => {
    if (selectedType !== "all" && t.type !== selectedType) return false;
    if (selectedWallet !== "all" && t.wallet_id !== selectedWallet) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNotes = t.notes?.toLowerCase().includes(q);
      const matchMerchant = t.merchant_name?.toLowerCase().includes(q);
      const matchCat = categories.find((c) => c.id === t.category_id)?.name.toLowerCase().includes(q);
      if (!matchNotes && !matchMerchant && !matchCat) return false;
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(amount.replace(/[^0-9]/g, ""));
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError("Nominal transaksi harus lebih dari 0.");
      return;
    }

    if (formType === "transfer" && walletId === transferToWalletId) {
      setFormError("Dompet asal dan tujuan transfer tidak boleh sama.");
      return;
    }

    const res = addTransaction({
      wallet_id: walletId,
      category_id: formType === "transfer" ? null : categoryId,
      type: formType,
      amount: parsedAmount,
      date: new Date(formDate).toISOString(),
      notes: notes.trim() || undefined,
      transfer_to_wallet_id: formType === "transfer" ? transferToWalletId : undefined,
      source: "web",
    });

    if (res.error) {
      setFormError(res.error);
      return;
    }

    setIsModalOpen(false);
    setAmount("");
    setNotes("");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Transaksi Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola pemasukan, pengeluaran, transfer antar dompet, dan struk belanja.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm transition shadow-sm flex items-center space-x-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Transaksi Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/70 shadow-card-subtle flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari catatan, merchant, kategori..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {/* Filter Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Tipe</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer</option>
          </select>

          {/* Filter Wallet */}
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.icon} {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/70 shadow-card-subtle overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Tidak ada transaksi ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Coba sesuaikan filter pencarianmu atau tambahkan transaksi baru via tombol di atas atau lewat Telegram.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((tx) => {
              const cat = categories.find((c) => c.id === tx.category_id);
              const wallet = wallets.find((w) => w.id === tx.wallet_id);
              const targetWallet = wallets.find((w) => w.id === tx.transfer_to_wallet_id);
              const isIncome = tx.type === "income";
              const isTransfer = tx.type === "transfer";
              const isExpanded = expandedTxId === tx.id;
              const items = transactionItems.filter((it) => it.transaction_id === tx.id);

              return (
                <div key={tx.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-xl shrink-0">
                        {isTransfer ? "🔄" : cat?.icon || (isIncome ? "💰" : "🏷️")}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {tx.notes || (isTransfer ? `Transfer ke ${targetWallet?.name}` : cat?.name || "Transaksi")}
                          </h4>
                          {tx.is_receipt_parent && (
                            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                              <Receipt className="w-3 h-3" />
                              <span>Struk Multi-item</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 flex-wrap">
                          <span>{formatDateWIB(tx.date, true)}</span>
                          <span>•</span>
                          <span>{wallet?.name || "Dompet"}</span>
                          {isTransfer && targetWallet && (
                            <>
                              <span>➔</span>
                              <span>{targetWallet.name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="capitalize">{tx.source.replace("_", " ")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`font-extrabold text-base block ${
                            isIncome
                              ? "text-emerald-600"
                              : isTransfer
                              ? "text-blue-600"
                              : "text-slate-900"
                          }`}
                        >
                          {isIncome ? "+" : isTransfer ? "⇄ " : "-"}
                          {formatRupiah(tx.amount)}
                        </span>
                        {tx.merchant_name && (
                          <span className="text-[11px] text-slate-500 block">
                            {tx.merchant_name}
                          </span>
                        )}
                      </div>

                      {/* Expand Button for multi-item receipt */}
                      {tx.is_receipt_parent && items.length > 0 && (
                        <button
                          onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition"
                          title="Lihat rincian item struk"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition"
                        title="Hapus transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Multi-Item Details */}
                  {isExpanded && items.length > 0 && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-100 pl-14">
                      <div className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100/70">
                        <h5 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                          <Receipt className="w-3.5 h-3.5 text-orange-600" />
                          <span>Rincian Item Struk Belanja ({items.length} item)</span>
                        </h5>
                        <div className="space-y-1.5">
                          {items.map((it) => (
                            <div
                              key={it.id}
                              className="flex items-center justify-between text-xs text-slate-600 py-1 border-b border-orange-100/40 last:border-0"
                            >
                              <span>
                                {it.item_name} <strong className="text-slate-400 font-normal">x{it.quantity}</strong>
                              </span>
                              <span className="font-semibold text-slate-800">
                                {formatRupiah(it.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Catat Transaksi Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 mb-4">Catat Transaksi Baru</h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                {formError}
              </div>
            )}

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setFormType("expense")}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  formType === "expense" ? "bg-white text-orange-600 shadow-sm" : "text-slate-600"
                }`}
              >
                💸 Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setFormType("income")}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  formType === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600"
                }`}
              >
                💰 Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setFormType("transfer")}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  formType === "transfer" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
                }`}
              >
                🔄 Transfer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="text"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Contoh: 50.000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                />
              </div>

              {formType !== "transfer" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                  >
                    {categories
                      .filter((c) => c.type === formType)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formType === "transfer" ? "Dari Dompet" : "Dompet"}
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.icon} {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formType === "transfer" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ke Dompet</label>
                    <select
                      value={transferToWalletId}
                      onChange={(e) => setTransferToWalletId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.icon} {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan singkat pengeluaran..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition shadow-sm"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
