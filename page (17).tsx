"use client";

import React, { useState } from "react";
import { 
  Wallet as WalletIcon, 
  Plus, 
  Check, 
  ArrowLeftRight, 
  Trash2, 
  Star, 
  CreditCard, 
  Smartphone, 
  Coins, 
  Building2,
  X 
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatRupiah, formatDateWIB } from "@/lib/utils";

const ICONS = ["💵", "🏦", "📱", "💳", "🪙", "👛", "💼", "💰"];
const COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#EF4444", "#14B8A6"];

export default function WalletPage() {
  const { wallets, addWallet, deleteWallet, setDefaultWallet, addTransaction } = useAppData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Add Wallet State
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💵");
  const [color, setColor] = useState("#F97316");
  const [initialBalance, setInitialBalance] = useState("");

  // Transfer State
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || "");
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || "");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(initialBalance.replace(/[^0-9]/g, "")) || 0;
    if (!name.trim()) return;

    addWallet(name.trim(), icon, color, balance);
    setIsAddModalOpen(false);
    setName("");
    setInitialBalance("");
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    const amount = parseFloat(transferAmount.replace(/[^0-9]/g, ""));
    if (!amount || amount <= 0) {
      setTransferError("Nominal transfer harus lebih dari 0.");
      return;
    }

    if (fromWalletId === toWalletId) {
      setTransferError("Dompet asal dan tujuan tidak boleh sama.");
      return;
    }

    const sourceWallet = wallets.find((w) => w.id === fromWalletId);
    if (sourceWallet && sourceWallet.balance < amount) {
      setTransferError("Saldo dompet asal tidak mencukupi untuk transfer ini.");
      return;
    }

    addTransaction({
      wallet_id: fromWalletId,
      transfer_to_wallet_id: toWalletId,
      type: "transfer",
      amount,
      date: new Date().toISOString(),
      notes: transferNotes.trim() || "Transfer antar dompet",
      source: "web",
    });

    setIsTransferModalOpen(false);
    setTransferAmount("");
    setTransferNotes("");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dompet & Rekening (Multi-Wallet)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola uang tunai, bank, dan e-wallet. Tentukan dompet default untuk integrasi Telegram Bot.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 shadow-sm"
          >
            <ArrowLeftRight className="w-4 h-4 text-slate-500" />
            <span>Transfer Saldo</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dompet</span>
          </button>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {wallets.map((w) => (
          <div
            key={w.id}
            className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-card-subtle flex flex-col justify-between relative overflow-hidden"
          >
            {/* Top Color Accent */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: w.color }}
            />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl shadow-inner">
                    {w.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">{w.name}</h3>
                    {w.is_default && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-full mt-1">
                        <Star className="w-3 h-3 fill-orange-500" />
                        <span>Default Telegram</span>
                      </span>
                    )}
                  </div>
                </div>

                {wallets.length > 1 && (
                  <button
                    onClick={() => deleteWallet(w.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition rounded-lg"
                    title="Hapus dompet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="my-3">
                <span className="text-xs text-slate-400 block font-medium">Saldo Saat Ini</span>
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {formatRupiah(w.balance)}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Update realtime
              </span>

              {!w.is_default && (
                <button
                  onClick={() => setDefaultWallet(w.id)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Jadikan Default Bot
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Wallet Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 mb-4">Tambah Dompet Baru</h3>

            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Dompet</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bank Jago, OVO, Brankas..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Ikon</label>
                <div className="flex items-center space-x-2 overflow-x-auto py-1">
                  {ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition ${
                        icon === i ? "border-orange-500 bg-orange-50 scale-105" : "border-slate-200 bg-white"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warna Aksen</label>
                <div className="flex items-center space-x-2 py-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition ${color === c ? "ring-2 ring-offset-2 ring-slate-800 scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Saldo Awal (Rp)</label>
                <input
                  type="text"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="Contoh: 1.000.000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition shadow-sm"
              >
                Buat Dompet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Saldo Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 mb-4">Transfer Antar Dompet</h3>

            {transferError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dari Dompet</label>
                  <select
                    value={fromWalletId}
                    onChange={(e) => setFromWalletId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>{w.icon} {w.name} ({formatRupiah(w.balance)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ke Dompet</label>
                  <select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Transfer (Rp)</label>
                <input
                  type="text"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Contoh: 250.000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Tarik tunai ATM / Top up e-wallet..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition shadow-sm"
              >
                Kirim Transfer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
