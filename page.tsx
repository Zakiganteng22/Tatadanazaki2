"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Bot, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  ShieldCheck, 
  Zap, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  PieChart as PieIcon, 
  Receipt, 
  Mic, 
  ChevronDown, 
  HelpCircle,
  Crown,
  Check,
  X,
  CreditCard
} from "lucide-react";
import { formatRupiah, renderProgressBar } from "@/lib/utils";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "lifetime">("lifetime");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setFaqOpen(faqOpen === idx ? null : idx);
  };

  const faqs = [
    {
      q: "Apakah bisa pakai foto struk di paket Starter?",
      a: "Fitur pemindaian foto struk dengan AI Vision OCR dirancang khusus untuk pengguna paket Pro. Pengguna paket Starter dapat mencatat transaksi tanpa batas format melalui teks chat dan pesan suara (Voice Note)."
    },
    {
      q: "Bagaimana keamanan data transaksi saya di TataDana?",
      a: "Data Anda 100% aman dan privat. TataDana menggunakan infrastruktur database Supabase PostgreSQL dengan enkripsi tingkat bank dan Row Level Security (RLS). Tidak ada pihak ketiga yang dapat mengakses data transaksi Anda tanpa izin."
    },
    {
      q: "Bagaimana cara menghubungkan akun saya ke Telegram Bot?",
      a: "Sangat mudah! Setelah membuat akun di TataDana dengan nomor HP Anda, cukup buka bot resmi @TataDanaBot di Telegram dan kirim perintah /start. Sistem kami otomatis mengenali akun Anda melalui nomor HP yang terverifikasi."
    },
    {
      q: "Apakah TataDana mendukung banyak rekening bank dan e-wallet?",
      a: "Ya! TataDana mendukung fitur Multi-Wallet. Anda dapat menambahkan dompet Tunai, rekening BCA, Mandiri, BRI, BNI, serta e-wallet seperti GoPay, OVO, Dana, dan ShopeePay, serta menentukan dompet default untuk Telegram."
    },
    {
      q: "Apakah paket Pro benar-benar sekali bayar selamanya (lifetime)?",
      a: "Benar sekali! Dengan biaya Rp99.000 promo perkenalan, Anda mendapatkan akses seumur hidup ke paket Pro tanpa ada biaya langganan bulanan maupun tahunan."
    },
    {
      q: "Bagaimana jika saya salah mencatat nominal di chat Telegram?",
      a: "Anda dapat langsung menghapus atau mengedit transaksi tersebut kapan saja lewat menu Transaksi di dashboard web TataDana. Saldo dompet Anda akan otomatis terkoreksi secara realtime."
    },
    {
      q: "Apakah data laporan keuangan bisa diekspor ke format Excel dan PDF?",
      a: "Ya! Pada dashboard TataDana, Anda dapat mengekspor laporan keuangan on-demand ke file PDF resmi yang rapi dan spreadsheet Excel (.xlsx) lengkap dengan riwayat unduhan."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-800 flex flex-col font-sans">
      {/* 1. Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-extrabold text-xl shadow-glow-orange">
            T
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">TataDana</span>
        </Link>

        <div className="hidden md:flex items-center space-x-7 text-sm font-semibold text-slate-600">
          <a href="#fitur" className="hover:text-orange-600 transition">Fitur</a>
          <a href="#demo" className="hover:text-orange-600 transition">Cara Kerja</a>
          <a href="#pricing" className="hover:text-orange-600 transition">Harga</a>
          <a href="#faq" className="hover:text-orange-600 transition">FAQ</a>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-orange-600 transition"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm"
          >
            Coba Gratis
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 pb-16 px-4 sm:px-8 max-w-6xl mx-auto text-center">
        {/* 2. Pre-headline badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs sm:text-sm font-bold mb-6 animate-in fade-in">
          <span>✨ Catat keuangan langsung dari Telegram</span>
        </div>

        {/* 3. Headline H1 with Orange Gradient */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Gaji habis sebelum akhir bulan? Sudah saatnya kamu{" "}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            tahu ke mana uangmu pergi.
          </span>
        </h1>

        {/* 4. Sub-headline */}
        <p className="mt-5 text-base sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus.
        </p>

        {/* 6. CTA buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-7 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm sm:text-base font-extrabold transition shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2"
          >
            <span>Mulai Gratis Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-sm sm:text-base font-bold transition shadow-sm flex items-center justify-center space-x-2"
          >
            <span>Lihat cara kerjanya →</span>
          </a>
        </div>

        {/* 5. Hero section video placeholder */}
        <div className="mt-12 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-900 relative aspect-video max-w-4xl mx-auto group">
          {/* // TODO: ganti dengan video asli demo TataDana */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent flex flex-col items-center justify-center text-white p-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-500/90 text-white flex items-center justify-center shadow-glow-orange group-hover:scale-105 transition cursor-pointer mb-4">
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
            </div>
            <span className="text-sm sm:text-base font-bold">Tonton Demo Singkat (50 Detik)</span>
            <span className="text-xs text-slate-400 mt-1">Lihat bagaimana bot Telegram mencatat struk dan suara secara realtime</span>
          </div>
        </div>
      </section>

      {/* 7. Bullet point masalah user (problem aware) */}
      <section className="py-16 bg-slate-100/60 border-y border-slate-200/60 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-1">
              Fakta Finansial
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Kenapa 7 dari 10 Orang Gagal Mengatur Keuangan?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-card-subtle">
              <div className="text-2xl mb-3">😩</div>
              <h3 className="font-bold text-base text-slate-900 mb-2 leading-snug">
                &ldquo;Buka aplikasi keuangan? Nanti dulu deh...&rdquo;
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aplikasi keuangan biasa terlalu ribet: harus login, pilih form, ketik tanggal. Ujung-ujungnya kamu malas dan pencatatan terhenti setelah seminggu.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-card-subtle">
              <div className="text-2xl mb-3">💸</div>
              <h3 className="font-bold text-base text-slate-900 mb-2 leading-snug">
                &ldquo;Kok uangnya habis ya? Padahal kayak tidak beli apa-apa&rdquo;
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Jajan kopi Rp25rb, parkir Rp5rb, cemilan online Rp30rb yang tidak tercatat adalah &apos;kebocoran halus&apos; yang menguras setengah gajimu tanpa disadari.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-card-subtle">
              <div className="text-2xl mb-3">📉</div>
              <h3 className="font-bold text-base text-slate-900 mb-2 leading-snug">
                &ldquo;Udah niat bikin budget, tapi seminggu lupa&rdquo;
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Budget yang tidak dipantau secara realtime sama saja tak ada budget. Tanpa sistem yang mengingatkan otomatis, target menabung selalu gagal.
              </p>
            </div>
          </div>

          {/* 8. Solusi dari bullet point */}
          <div className="mt-12 text-center max-w-xl mx-auto">
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Bagaimana kalau mencatat keuangan semudah kirim pesan chat ke teman?
            </p>
            <div className="mt-3 inline-flex items-center space-x-2 text-orange-600 font-extrabold text-lg sm:text-xl">
              <span>Introducing TataDana</span>
              <Sparkles className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>
      </section>

      {/* 9. Interactive Dashboard Preview */}
      <section id="demo" className="py-20 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-1">
            Simulasi Interaktif
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Ketik di Telegram, Muncul di Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Format chat asli yang dibalas langsung oleh @TataDanaBot saat kamu mencatat pengeluaran harian.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Telegram Mockup */}
          <div className="bg-[#242F3D] rounded-3xl p-5 shadow-2xl text-white border border-slate-700">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-700/80 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-bold">
                TD
              </div>
              <div>
                <h4 className="font-bold text-sm">TataDana Bot</h4>
                <p className="text-xs text-emerald-400">online • @TataDanaBot</p>
              </div>
            </div>

            {/* Simulated Chat Bubble */}
            <div className="space-y-3 font-sans text-xs sm:text-sm">
              <div className="flex justify-end">
                <div className="bg-orange-600 text-white rounded-2xl rounded-br-none px-4 py-2.5 max-w-[80%]">
                  beli soto ayam 25rb
                  <div className="text-[10px] text-orange-200 text-right mt-1">12:30 WIB</div>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-white text-slate-900 rounded-2xl rounded-bl-none px-4 py-3 max-w-[90%] whitespace-pre-wrap leading-relaxed shadow-sm font-sans">
                  {`📅 Selasa, 13 Oktober 2026 — 12:30 WIB\n💸 Pengeluaran tercatat!\n├ Nominal : Rp25.000\n├ Kategori : 🍜 Makanan & Minuman\n├ Dompet   : 👛 Dompet Tunai\n├ Catatan  : beli soto ayam\n└ Saldo    : Rp825.000\n\n📊 Budget Makanan bulan ini:\n████████░░ 78% — sisa Rp550.000\n💪 Semangat terus kendalikan keuanganmu!`}
                  <div className="text-[10px] text-slate-400 text-right mt-1">12:30 WIB</div>
                </div>
              </div>
            </div>
          </div>

          {/* Web Dashboard Preview Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">Live Dashboard TataDana</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Tersinkronisasi Realtime
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50/60 p-3.5 rounded-2xl border border-orange-100">
                <span className="text-[10px] font-bold text-orange-700 uppercase">Sisa Budget Makanan</span>
                <div className="text-lg font-extrabold text-orange-600 mt-0.5">Rp550.000</div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Saldo Dompet Tunai</span>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">Rp825.000</div>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 block mb-2">Entri Transaksi Terakhir:</span>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">🍜</span>
                  <div>
                    <span className="font-bold text-slate-900 block">beli soto ayam</span>
                    <span className="text-[10px] text-slate-400">Telegram Bot • 12:30 WIB</span>
                  </div>
                </div>
                <span className="font-extrabold text-slate-900">-Rp25.000</span>
              </div>
            </div>

            <Link
              href="/register"
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition block text-center shadow-sm"
            >
              Coba Sendiri Sekarang Gratis →
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Fitur Section (3 Alternating Layout) */}
      <section id="fitur" className="py-20 bg-slate-100/50 border-y border-slate-200/60 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-20">
          {/* Fitur 1: Catat via Telegram */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1">Fitur 01</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
                Catat Transaksi Semudah Chat — Teks, Voice Note & Struk
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Tidak perlu buka aplikasi rumit setiap kali bayar parkir atau beli makan. Cukup ketik pesan singkat di Telegram, kirim voice note hingga 60 detik, atau foto struk belanjaanmu. AI kami otomatis mengekstrak nominal, kategori, dan rincian item ke database.
              </p>
              <div className="space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Paham bahasa santai Indonesia: &quot;15rb&quot;, &quot;1.5jt&quot;, &quot;500k&quot;</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Voice Note ditranskrip instan dan dicatat otomatis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Scan foto struk belanjaan supermarket item-by-item (Pro)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card-subtle">
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-orange-700 font-bold">
                  <Mic className="w-4 h-4" />
                  <span>Input Pesan Suara / VN:</span>
                </div>
                <p className="text-slate-600 italic bg-white p-2.5 rounded-xl border border-orange-100">
                  &ldquo;Beli bensin pertamax lima puluh ribu di pom shell&rdquo;
                </p>
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Tercatat otomatis: Kategori Transportasi • Rp50.000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fitur 2: Laporan & Export On-demand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="md:order-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Fitur 02</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
                Laporan Lengkap & Ekspor PDF / Excel Sekali Klik
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Semua data keuanganmu tersimpan aman 100% di database privat TataDana. Halaman laporan interaktif memungkinkan kamu menyortir, memfilter per rentang tanggal, kategori, atau dompet, lalu mengekspornya ke format PDF dan Excel (.xlsx) resmi secara instan.
              </p>
              <div className="space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Generate on-demand untuk periode custom apa pun</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Riwayat ekspor tersimpan privat di Supabase Storage</span>
                </div>
              </div>
            </div>

            <div className="md:order-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-card-subtle flex flex-col items-center justify-center py-10 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
              </div>
              <span className="font-extrabold text-slate-900 text-sm">Download PDF & XLSX On-demand</span>
              <span className="text-xs text-slate-400 text-center max-w-xs">
                Laporan keuangan siap cetak untuk evaluasi bulanan atau pengajuan finansial.
              </span>
            </div>
          </div>

          {/* Fitur 3: AI Financial Advisor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">Fitur 03</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
                AI Financial Advisor Proaktif — Asisten Cerdas Finansialmu
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Bukan cuma mencatat, TataDana secara cerdas mendeteksi lonjakan pengeluaran (&gt;50% dari minggu lalu) atau jika total pengeluaran mendekati 80% dari total pemasukanmu. AI Advisor memberikan saran personal yang actionable langsung di chat Telegram.
              </p>
              <div className="space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Deteksi anomali pengeluaran besar otomatis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Saran keuangan spesifik tanpa perlu prompt manual</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card-subtle">
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs font-sans">
                <div className="flex items-center space-x-2 text-amber-400 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>🤖 Financial Advisor</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  &ldquo;Hei Budi! Pengeluaran kopi & jajan minggu ini naik 62% dibanding minggu lalu. Kalau ritme ini diteruskan, sisa gajimu berisiko minus di tanggal 25.&rdquo;
                </p>
                <p className="text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                  💡 Saran: Terapkan batas jajan Rp30.000/hari untuk sisa minggu ini.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Testimoni (Masonry Placeholder) */}
      <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-1">
            Cerita Pengguna
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Dipercaya Ratusan Karyawan & Freelancer
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            // TODO: ganti dengan testimoni asli dari beta user
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card-subtle space-y-3">
            <div className="flex text-amber-400 text-sm">★★★★★</div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              &ldquo;Dulu selalu malas buka aplikasi budgeting. Sekarang cukup chat &apos;beli pecel lele 20rb&apos; di Telegram pas bayar, langsung tercatat. Akhir bulan akhirnya tabunganku surplus!&rdquo;
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
                RS
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">Rizky Setiawan</span>
                <span className="text-[10px] text-slate-400">Software Engineer, Jakarta</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card-subtle space-y-3">
            <div className="flex text-amber-400 text-sm">★★★★★</div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              &ldquo;Fitur scan foto struk di paket Pro bener-bener gila. Belanja bulanan Indomaret tinggal difoto, semua itemnya dipecah rapi. Gak ada lagi struk numpuk di dompet.&rdquo;
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                DA
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">Dinda Anggraini</span>
                <span className="text-[10px] text-slate-400">Freelance Designer, Surabaya</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card-subtle space-y-3">
            <div className="flex text-amber-400 text-sm">★★★★★</div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              &ldquo;Voice note pencatatan sangat membantu pas lagi bawa motor atau buru-buru. Tinggal kirim VN, bot langsung balas rekap dan sisa budget. Sangat rekomendasi.&rdquo;
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                BP
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">Bambang Pamungkas</span>
                <span className="text-[10px] text-slate-400">Marketing Lead, Bandung</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Pricing Section (Toggle Bulanan / Sekali Bayar) */}
      <section id="pricing" className="py-20 bg-slate-100/60 border-y border-slate-200/60 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-1">
              Pilihan Paket
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              Investasi Kecil untuk Keuangan yang Terkontrol
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Bebas pilih paket sesuai kebutuhan pengelolaan keuanganmu.
            </p>

            {/* Toggle Switch */}
            <div className="mt-6 inline-flex items-center p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  billingCycle === "monthly" ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Langganan Bulanan
              </button>
              <button
                onClick={() => setBillingCycle("lifetime")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-1.5 ${
                  billingCycle === "lifetime" ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Sekali Bayar (Lifetime)</span>
                <span className="bg-amber-300 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  HEMAT
                </span>
              </button>
            </div>
          </div>

          {/* Pricing 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-card-subtle flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Paket Pemula</span>
                <h3 className="text-2xl font-extrabold text-slate-900">Starter</h3>
                <div className="mt-3 flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-slate-900">Rp49.000</span>
                  <span className="text-xs text-slate-400">/ bulan</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Cocok untuk yang baru ingin membiasakan mencatat keuangan harian lewat chat.
                </p>

                <div className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Catat transaksi via teks Telegram</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Dashboard web lengkap realtime</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Maksimal 50 transaksi / bulan</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Maksimal 3 dompet & 5 kategori budget</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400 line-through">
                    <X className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>Input foto struk AI OCR</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400 line-through">
                    <X className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>AI Financial Advisor proaktif</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400 line-through">
                    <X className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>Export unlimited PDF / Excel</span>
                  </div>
                </div>
              </div>

              <Link
                href="/register"
                className="mt-8 w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm text-center transition block"
              >
                Pilih Starter
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-3xl p-7 border-2 border-orange-500 shadow-xl shadow-orange-500/10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-amber-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl tracking-wider">
                PALING POPULER
              </div>

              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1">Fitur Lengkap</span>
                <h3 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-1.5">
                  <span>Pro Lifetime</span>
                  <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />
                </h3>
                <div className="mt-3 flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-orange-600">Rp99.000</span>
                  <span className="text-xs text-slate-500 font-semibold">/ sekali bayar selamanya</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Solusi komprehensif tanpa batasan untuk kendali keuangan total seumur hidup.
                </p>

                <div className="mt-6 space-y-2.5 text-xs text-slate-700 font-medium">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span><strong>Semua fitur Starter</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span><strong>Unlimited</strong> transaksi, wallet, & kategori</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Input foto struk dengan AI Vision OCR</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Laporan lengkap + filter & export PDF/Excel</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>AI Financial Advisor proaktif</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Jadwal pengingat kustom</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Dukungan prioritas tim TataDana</span>
                  </div>
                </div>
              </div>

              <Link
                href="/register"
                className="mt-8 w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm text-center transition shadow-md shadow-orange-500/20 block"
              >
                Dapatkan Akses Pro Sekarang →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 13. FAQ Section (Minimal 7 Pertanyaan Relevan) */}
      <section id="faq" className="py-20 px-4 sm:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-1">
            Tanya Jawab
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Segala hal yang perlu kamu ketahui tentang TataDana dan integrasi Telegram.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, idx) => {
            const isOpen = faqOpen === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-card-subtle transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-orange-600 transition"
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-orange-500" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 14. Final CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-5">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Mulai Kendalikan Keuanganmu Hari Ini
          </h2>
          <p className="text-sm sm:text-base text-orange-100 max-w-xl mx-auto leading-relaxed">
            Gabung bersama ratusan profesional muda yang tidak lagi pusing memikirkan ke mana gajinya pergi. Daftar gratis dalam 30 detik.
          </p>
          <div className="pt-3">
            <Link
              href="/register"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-orange-600 hover:bg-orange-50 rounded-2xl text-sm sm:text-base font-extrabold transition shadow-xl"
            >
              <span>Daftar Sekarang — 100% Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 15. Footer (4 Kolom Sesuai Spesifikasi) */}
      <footer className="bg-slate-950 text-slate-400 py-14 px-4 sm:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Kolom 1: Logo + tagline + sosmed */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white font-extrabold text-sm">
                T
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">TataDana</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Catat keuangan semudah chat — langsung dari Telegram kamu.
            </p>
            <div className="flex items-center space-x-3 pt-2 text-slate-400">
              <span className="hover:text-white cursor-pointer transition">Telegram</span>
              <span className="hover:text-white cursor-pointer transition">Instagram</span>
              <span className="hover:text-white cursor-pointer transition">LinkedIn</span>
            </div>
          </div>

          {/* Kolom 2: Produk */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Produk</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#fitur" className="hover:text-white transition">Fitur Utama</a></li>
              <li><a href="#demo" className="hover:text-white transition">Telegram Bot</a></li>
              <li><a href="#fitur" className="hover:text-white transition">AI Financial Advisor</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Harga Langganan</a></li>
            </ul>
          </div>

          {/* Kolom 3: Perusahaan */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Perusahaan</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/" className="hover:text-white transition">Tentang Kami</Link></li>
              <li><Link href="/" className="hover:text-white transition">Karir</Link></li>
              <li><Link href="/" className="hover:text-white transition">Blog Finansial</Link></li>
              <li><Link href="/admin" className="hover:text-orange-400 transition font-mono">Portal Superadmin</Link></li>
            </ul>
          </div>

          {/* Kolom 4: Legal & Kontak */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Legal & Bantuan</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/" className="hover:text-white transition">Kebijakan Privasi</Link></li>
              <li><Link href="/" className="hover:text-white transition">Syarat & Ketentuan</Link></li>
              <li><Link href="/" className="hover:text-white transition">Keamanan Data</Link></li>
              <li><span className="text-slate-500">support@tatadana.id</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-slate-900 text-center text-slate-500 text-[11px]">
          © 2026 TataDana Indonesia. Hak Cipta Dilindungi Undang-Undang. Waktu Sistem: WIB (Asia/Jakarta).
        </div>
      </footer>
    </div>
  );
}
