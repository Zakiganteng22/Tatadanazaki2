"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Bot, 
  Bell, 
  Tags, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Copy, 
  Plus, 
  Trash2, 
  Check, 
  Smartphone,
  Save,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  Radio,
  Play,
  Square,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatDailyReminder } from "@/lib/telegram/bot-reply";
import { TelegramSimulatorModal } from "@/components/telegram/TelegramSimulatorModal";

export default function SettingsPage() {
  const { 
    user, 
    setUser, 
    telegramAccount, 
    updateTelegramAccount, 
    unlinkTelegram, 
    reminder, 
    updateReminder, 
    categories, 
    addCategory, 
    deleteCategory,
    resetToEmptyState,
    resetToDemoState
  } = useAppData();

  const [activeTab, setActiveTab] = useState<"profile" | "telegram" | "reminder" | "categories">("telegram");

  // Profile Form
  const [fullName, setFullName] = useState(user.full_name);
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || "");
  const [currency, setCurrency] = useState(user.currency || "IDR");
  const [profileSaved, setProfileSaved] = useState(false);

  // Telegram Form & Real Server Status
  const [botToken, setBotToken] = useState(telegramAccount.custom_bot_token || "");
  const [showToken, setShowToken] = useState(false);
  const [testingStatus, setTestingStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testResultMsg, setTestResultMsg] = useState<string>("");
  const [connectingStatus, setConnectingStatus] = useState<"idle" | "connecting" | "success" | "error">("idle");
  const [connectResultMsg, setConnectResultMsg] = useState<string>("");
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Live Server Status
  const [serverStatus, setServerStatus] = useState<{
    is_configured: boolean;
    token_masked: string | null;
    is_polling_active: boolean;
    mode: string;
    bot: { id: number; username: string; first_name: string } | null;
    last_poll_at: string | null;
    last_error: string | null;
  }>({
    is_configured: false,
    token_masked: null,
    is_polling_active: false,
    mode: "idle",
    bot: null,
    last_poll_at: null,
    last_error: null,
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Reminder Form
  const [reminderEnabled, setReminderEnabled] = useState(reminder.is_enabled);
  const [frequency, setFrequency] = useState<1 | 2>(reminder.frequency);
  const [time1, setTime1] = useState(reminder.time_1);
  const [time2, setTime2] = useState(reminder.time_2);
  const [reminderSaved, setReminderSaved] = useState(false);

  // Categories Form
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");
  const [newCatIcon, setNewCatIcon] = useState("🏷️");
  const [newCatColor, setNewCatColor] = useState("#F97316");

  // Fetch real bot status from backend
  const fetchBotStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch("/api/telegram/status");
      const data = await res.json();
      if (data.ok) {
        setServerStatus({
          is_configured: data.is_configured,
          token_masked: data.token_masked,
          is_polling_active: data.is_polling_active,
          mode: data.mode,
          bot: data.bot,
          last_poll_at: data.last_poll_at,
          last_error: data.last_error,
        });

        // Update local state if token or bot exists
        if (data.bot?.username) {
          updateTelegramAccount({
            is_connected: data.is_polling_active,
            telegram_username: data.bot.username,
          });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch Telegram status:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser((prev) => ({
      ...prev,
      full_name: fullName,
      phone_number: phoneNumber,
      currency,
    }));
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // Test Telegram Connection (getMe check)
  const handleTestConnection = async () => {
    const tokenToTest = botToken.trim();
    if (!tokenToTest) {
      setTestingStatus("error");
      setTestResultMsg("Harap masukkan token bot terlebih dahulu.");
      return;
    }

    setTestingStatus("testing");
    setTestResultMsg("Menghubungi Telegram API untuk memverifikasi token...");

    try {
      const res = await fetch("/api/telegram/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToTest }),
      });
      const data = await res.json();

      if (data.ok && data.bot) {
        setTestingStatus("success");
        setTestResultMsg(`✅ Token Valid! Terhubung ke bot @${data.bot.username} (${data.bot.first_name}, ID: ${data.bot.id}).`);
      } else {
        setTestingStatus("error");
        setTestResultMsg(data.message || "Token bot tidak valid atau ditolak oleh Telegram API.");
      }
    } catch (e: any) {
      setTestingStatus("error");
      setTestResultMsg(`Gagal menghubungi server: ${e.message}`);
    }
  };

  // Connect & Start Polling
  const handleConnectAndStartPolling = async () => {
    const tokenToUse = botToken.trim();
    if (!tokenToUse) {
      setConnectingStatus("error");
      setConnectResultMsg("Harap masukkan token bot sebelum menyambungkan.");
      return;
    }

    setConnectingStatus("connecting");
    setConnectResultMsg("Memulai background polling service & sinkronisasi dengan Telegram...");

    try {
      const res = await fetch("/api/telegram/polling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", token: tokenToUse }),
      });
      const data = await res.json();

      if (data.ok) {
        setConnectingStatus("success");
        setConnectResultMsg(data.message || "Bot berhasil diaktifkan dengan mode Polling!");
        updateTelegramAccount({
          is_connected: true,
          custom_bot_token: tokenToUse,
          telegram_username: data.bot?.username || "TelegramBot",
          connected_at: new Date().toISOString(),
        });
        await fetchBotStatus();
      } else {
        setConnectingStatus("error");
        setConnectResultMsg(data.message || "Gagal mengaktifkan bot.");
      }
    } catch (e: any) {
      setConnectingStatus("error");
      setConnectResultMsg(`Error: ${e.message}`);
    }
  };

  // Disconnect & Stop Polling
  const handleDisconnectBot = async () => {
    try {
      await fetch("/api/telegram/polling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      unlinkTelegram();
      setBotToken("");
      setTestingStatus("idle");
      setConnectingStatus("idle");
      setTestResultMsg("");
      setConnectResultMsg("Bot berhasil diputuskan.");
      await fetchBotStatus();
    } catch (e: any) {
      alert(`Gagal memutuskan koneksi: ${e.message}`);
    }
  };

  // Save Reminder Settings
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    updateReminder({
      is_enabled: reminderEnabled,
      frequency,
      time_1: time1,
      time_2: time2,
    });
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 2500);
  };

  // Add Custom Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory(newCatName.trim(), newCatType, newCatIcon, newCatColor);
    setNewCatName("");
  };

  const activeBotUsername = serverStatus.bot?.username || telegramAccount.telegram_username;
  const isBotActive = serverStatus.is_polling_active;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pengaturan Akun & Sistem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola integrasi Telegram Bot nyata, profil akun, jadwal reminder, dan kategori transaksi TataDana.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("telegram")}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "telegram"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Telegram Bot</span>
          {isBotActive ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1 animate-pulse"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-300 ml-1"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "profile"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil</span>
        </button>

        <button
          onClick={() => setActiveTab("reminder")}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "reminder"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Pengingat (Reminder)</span>
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "categories"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Tags className="w-4 h-4" />
          <span>Kategori Custom</span>
        </button>
      </div>

      {/* Tab Content: Telegram Bot */}
      {activeTab === "telegram" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Card 1: Real Live Status Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-card-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isBotActive ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
              }`}>
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h3 className="font-bold text-base text-slate-900">
                    {activeBotUsername ? `@${activeBotUsername}` : "Telegram Bot"}
                  </h3>
                  
                  {isBotActive ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Aktif (Long Polling)</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>Belum Aktif</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {isBotActive ? (
                    <span>
                      Bot aktif mendengarkan pesan langsung dari Telegram. Setiap chat seperti <strong>&quot;beli soto 25rb&quot;</strong> atau <strong>/saldo</strong> langsung tersinkron ke dashboard akun <strong>{user.full_name}</strong>.
                    </span>
                  ) : (
                    <span>
                      Bot belum aktif menerima pesan. Masukkan token bot Telegram Anda di bawah lalu klik <strong>&quot;Sambungkan &amp; Aktifkan Bot&quot;</strong>.
                    </span>
                  )}
                </p>

                {serverStatus.last_error && !isBotActive && (
                  <p className="text-xs text-rose-600 font-medium mt-1 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Catatan: {serverStatus.last_error}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={fetchBotStatus}
                disabled={isLoadingStatus}
                title="Refresh Status"
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? "animate-spin" : ""}`} />
              </button>

              {isBotActive && (
                <button
                  onClick={handleDisconnectBot}
                  className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold transition"
                >
                  Putuskan Sambungan
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Configuration & Connection Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-card-subtle space-y-5">
            <div>
              <h3 className="font-bold text-base text-slate-900">Konfigurasi Bot Token Telegram</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan API Token dari <strong>@BotFather</strong> untuk menghubungkan akun bot Telegram Anda ke TataDana.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telegram Bot API Token
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showToken ? "text" : "password"}
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder={serverStatus.token_masked || "Contoh: 7891234567:AAExampleTataDanaBotTokenMock"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      title={showToken ? "Sembunyikan Token" : "Tampilkan Token"}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingStatus === "testing"}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-1.5"
                    >
                      {testingStatus === "testing" ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <span>Test Koneksi</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleConnectAndStartPolling}
                      disabled={connectingStatus === "connecting"}
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 shadow-sm"
                    >
                      {connectingStatus === "connecting" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyambungkan...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Sambungkan &amp; Aktifkan Bot</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status & Feedback Banners */}
              {testResultMsg && (
                <div className={`p-3.5 rounded-2xl border text-xs font-medium flex items-start space-x-2.5 animate-in fade-in ${
                  testingStatus === "success" 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                  {testingStatus === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testResultMsg}</span>
                </div>
              )}

              {connectResultMsg && (
                <div className={`p-3.5 rounded-2xl border text-xs font-medium flex items-start space-x-2.5 animate-in fade-in ${
                  connectingStatus === "success" 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                  {connectingStatus === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{connectResultMsg}</span>
                </div>
              )}
            </div>

            {/* Architecture Explainer */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                <span>Mekanisme Penerimaan Update Telegram:</span>
              </div>
              <p className="leading-relaxed">
                Di lingkungan lokal (localhost), aplikasi menggunakan <strong>Long-Polling</strong>. Backend TataDana memanggil Telegram API secara langsung sehingga bot dapat merespons pesan secara real-time <strong>tanpa memerlukan tunnel HTTPS (ngrok)</strong> atau konfigurasi router rumit.
              </p>
            </div>
          </div>

          {/* Card 3: Live Test & Action Links */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-card-subtle space-y-4">
            <h3 className="font-bold text-base text-slate-900">Uji Coba Langsung di Telegram</h3>
            <p className="text-xs text-slate-500">
              Setelah bot disambungkan, Anda dapat menguji pesan secara langsung di Telegram maupun melalui Simulator:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Option A: Real Telegram Bot */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-orange-50/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">1</span>
                    <h4 className="font-bold text-sm text-slate-900">Buka di Telegram Sungguhan</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Kirim pesan ke bot di Telegram Web atau aplikasi Telegram. Coba kirim:
                  </p>
                  <ul className="text-xs font-mono text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 mt-2 space-y-1">
                    <li>• <span className="font-bold text-orange-600">/start</span> (Mulai &amp; cek akun)</li>
                    <li>• <span className="font-bold text-orange-600">/saldo</span> (Lihat saldo dompet)</li>
                    <li>• <span className="font-bold text-orange-600">beli soto 25rb</span> (Catat transaksi)</li>
                  </ul>
                </div>

                {activeBotUsername ? (
                  <a
                    href={`https://t.me/${activeBotUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <span>Buka @{activeBotUsername} di Telegram</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl font-bold text-xs cursor-not-allowed"
                  >
                    Sambungkan Bot Terlebih Dahulu
                  </button>
                )}
              </div>

              {/* Option B: Local Simulator */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">2</span>
                    <h4 className="font-bold text-sm text-slate-900">Buka Bot Simulator (In-App)</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Simulator visual bawaan browser untuk mencoba parsing bahasa alami, voice note, dan struk tanpa membuka aplikasi Telegram.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSimulatorOpen(true)}
                  className="w-full py-2.5 border border-slate-300 hover:bg-white text-slate-700 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1.5"
                >
                  <Bot className="w-3.5 h-3.5 text-orange-500" />
                  <span>Buka Bot Simulator (In-App)</span>
                </button>
              </div>
            </div>

            {/* Step-by-step BotFather guide */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-2">Panduan Cepat Setup via @BotFather:</h4>
              <ol className="list-decimal list-inside text-xs text-slate-500 space-y-1 leading-relaxed">
                <li>Buka aplikasi Telegram dan cari bot resmi <strong>@BotFather</strong></li>
                <li>Ketik <code>/newbot</code> lalu ikuti instruksi untuk menentukan nama dan username bot</li>
                <li>Salin (copy) HTTP API token yang diberikan oleh BotFather</li>
                <li>Tempel (paste) token ke kolom input di atas, lalu klik <strong>Sambungkan &amp; Aktifkan Bot</strong></li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Profile */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-card-subtle max-w-xl animate-in fade-in duration-150">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Handphone (WhatsApp)</label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Nomor ini dipakai sebagai verifikasi identitas di bot Telegram.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Uang Default</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
              >
                <option value="IDR">IDR — Rupiah Indonesia (Rp)</option>
                <option value="USD">USD — US Dollar ($)</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition shadow-sm flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Profil</span>
              </button>

              {profileSaved && (
                <span className="text-xs font-bold text-emerald-600 animate-in fade-in flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>Profil berhasil diperbarui!</span>
                </span>
              )}
            </div>
          </form>

          {/* Reset / Data Management Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="font-bold text-sm text-slate-900 mb-1">Pengaturan Data Aplikasi</h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Anda dapat mengosongkan seluruh data untuk memulai pencatatan dari nol, atau memulihkan data demo kapan saja.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Yakin ingin mengosongkan data transaksi dan saldo? Ini akan mengatur saldo ke Rp0 agar Anda bisa menguji catat dari awal.")) {
                    resetToEmptyState();
                    fetch("/api/app-data", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "reset_empty" }),
                    });
                    alert("Data berhasil direset ke kondisi bersih!");
                  }
                }}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition text-center"
              >
                🗑️ Reset Data Bersih (Mulai dari Nol)
              </button>

              <button
                type="button"
                onClick={() => {
                  resetToDemoState();
                  alert("Data demo berhasil dipulihkan!");
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition text-center"
              >
                🔄 Pulihkan Data Demo Lengkap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Reminder */}
      {activeTab === "reminder" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-card-subtle max-w-xl">
            <form onSubmit={handleSaveReminder} className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Pengingat Keuangan Harian</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kirim pesan notifikasi otomatis via Telegram agar rutin mencatat pengeluaran.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {reminderEnabled && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Frekuensi Pengingat (Maksimal 2x/hari sesuai kebijakan)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFrequency(1)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                          frequency === 1
                            ? "bg-orange-50 border-orange-500 text-orange-600"
                            : "border-slate-200 text-slate-600 bg-white"
                        }`}
                      >
                        1x Sehari
                      </button>
                      <button
                        type="button"
                        onClick={() => setFrequency(2)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                          frequency === 2
                            ? "bg-orange-50 border-orange-500 text-orange-600"
                            : "border-slate-200 text-slate-600 bg-white"
                        }`}
                      >
                        2x Sehari (Siang &amp; Malam)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jam Reminder 1 (WIB)
                      </label>
                      <input
                        type="time"
                        value={time1}
                        onChange={(e) => setTime1(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none"
                      />
                    </div>
                    {frequency === 2 && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Jam Reminder 2 (WIB)
                        </label>
                        <input
                          type="time"
                          value={time2}
                          onChange={(e) => setTime2(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition shadow-sm"
                >
                  Simpan Jadwal
                </button>
                {reminderSaved && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                    <Check className="w-4 h-4" />
                    <span>Jadwal tersimpan!</span>
                  </span>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-card-subtle max-w-xl">
            <h4 className="font-bold text-sm text-slate-900 mb-2">Preview Pesan Reminder di Telegram:</h4>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm whitespace-pre-wrap font-sans text-slate-700">
              {formatDailyReminder()}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Kategori Custom */}
      {activeTab === "categories" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-card-subtle max-w-xl">
            <h3 className="font-bold text-base text-slate-900 mb-3">Tambah Kategori Baru</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Contoh: Langganan SaaS"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe</label>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  >
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-24">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emoji</label>
                  <input
                    type="text"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-lg focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aksi</label>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-sm"
                  >
                    Tambahkan Kategori
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-card-subtle max-w-xl">
            <h4 className="font-bold text-sm text-slate-900 mb-3">Daftar Kategori Aktif</h4>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {categories.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">{c.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.type === "expense" ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {c.type === "expense" ? "Pengeluaran" : "Pemasukan"}
                    </span>
                  </div>

                  {categories.length > 3 && (
                    <button
                      onClick={() => deleteCategory(c.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      <TelegramSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}
