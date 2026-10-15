import { formatRupiah, formatDateWIB, renderProgressBar } from "@/lib/utils";
import { Wallet, Category, Budget, Transaction, UserProfile } from "@/types";

export interface BotReplyOptions {
  date?: string | Date;
  walletName: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  notes: string;
  remainingBalance: number;
  budget?: Budget;
  categorySpentThisMonth?: number;
  transcript?: string;
}

/**
 * Format 4.4: Reply Bot untuk Pengeluaran
 */
export function formatExpenseReply(opts: BotReplyOptions): string {
  const dateFormatted = formatDateWIB(opts.date || new Date());
  const nominalFormatted = formatRupiah(opts.amount);
  const saldoFormatted = formatRupiah(opts.remainingBalance);

  let reply = "";
  if (opts.transcript) {
    reply += `🎙️ Transkrip: "${opts.transcript}"\n\n`;
  }

  reply += `📅 ${dateFormatted}\n`;
  reply += `💸 Pengeluaran tercatat!\n`;
  reply += `├ Nominal : ${nominalFormatted}\n`;
  reply += `├ Kategori : ${opts.categoryIcon} ${opts.categoryName}\n`;
  reply += `├ Dompet   : 👛 ${opts.walletName}\n`;
  reply += `├ Catatan  : ${opts.notes}\n`;
  reply += `└ Saldo    : ${saldoFormatted}\n\n`;

  // Budget progress section
  if (opts.budget && opts.categorySpentThisMonth !== undefined) {
    const limit = opts.budget.monthly_limit;
    const spent = opts.categorySpentThisMonth;
    const pct = Math.min(999, Math.round((spent / limit) * 100));
    const sisa = Math.max(0, limit - spent);
    const bar = renderProgressBar(pct, 10);

    reply += `📊 Budget ${opts.categoryName} bulan ini:\n`;
    reply += `${bar} ${pct}% — sisa ${formatRupiah(sisa)}\n`;

    if (pct >= 100) {
      reply += `🚨 Perhatian! Kamu sudah melebihi 100% budget kategori ini.\n`;
    } else if (pct >= 80) {
      reply += `⚠️ Hati-hati! Budget sudah mencapai ${pct}%, kendalikan pengeluaran ya.\n`;
    }
  }

  return reply;
}

/**
 * Format 4.5: Reply Bot untuk Pemasukan
 */
export function formatIncomeReply(opts: BotReplyOptions): string {
  const dateFormatted = formatDateWIB(opts.date || new Date());
  const nominalFormatted = formatRupiah(opts.amount);
  const saldoBaruFormatted = formatRupiah(opts.remainingBalance);

  let reply = "";
  if (opts.transcript) {
    reply += `🎙️ Transkrip: "${opts.transcript}"\n\n`;
  }

  reply += `📅 ${dateFormatted}\n`;
  reply += `💰 Pemasukan tercatat!\n`;
  reply += `├ Nominal   : ${nominalFormatted}\n`;
  reply += `├ Kategori  : 💼 Pemasukan\n`;
  reply += `├ Dompet    : 👛 ${opts.walletName}\n`;
  reply += `└ Saldo baru: ${saldoBaruFormatted}\n\n`;
  reply += `💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;

  return reply;
}

/**
 * Format 4.6: Bot Commands Handlers
 */
export function handleBotCommand(
  command: string,
  user: UserProfile,
  wallets: Wallet[],
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[]
): string {
  const cmd = command.toLowerCase().trim();

  // /saldo
  if (cmd === "/saldo") {
    let text = `👛 Saldo Dompet TataDana (${user.full_name}):\n\n`;
    let total = 0;
    wallets.forEach((w) => {
      text += `${w.icon} ${w.name}: ${formatRupiah(w.balance)}${w.is_default ? " (Utama)" : ""}\n`;
      total += w.balance;
    });
    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 Total Semua Dompet: ${formatRupiah(total)}`;
    return text;
  }

  // /hari ini
  if (cmd === "/hari ini") {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTxs = transactions.filter((t) => t.date.slice(0, 10) === todayStr);

    let expense = 0;
    let income = 0;
    todayTxs.forEach((t) => {
      if (t.type === "expense") expense += t.amount;
      if (t.type === "income") income += t.amount;
    });

    let text = `📅 Rekap Transaksi Hari Ini (${formatDateWIB(new Date(), false)}):\n\n`;
    text += `💰 Total Masuk : ${formatRupiah(income)}\n`;
    text += `💸 Total Keluar: ${formatRupiah(expense)}\n`;
    text += `📊 Arus Kas Bersih: ${formatRupiah(income - expense)}\n\n`;

    if (todayTxs.length === 0) {
      text += `Belum ada transaksi hari ini. Kirim chat untuk mulai mencatat!`;
    } else {
      text += `Rincian (${todayTxs.length} transaksi):\n`;
      todayTxs.slice(0, 5).forEach((t) => {
        text += `• ${t.type === "expense" ? "💸" : "💰"} ${formatRupiah(t.amount)} — ${t.notes || "Tanpa catatan"}\n`;
      });
      if (todayTxs.length > 5) {
        text += `...dan ${todayTxs.length - 5} transaksi lainnya di dashboard.`;
      }
    }
    return text;
  }

  // /minggu ini
  if (cmd === "/minggu ini") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const weekTxs = transactions.filter((t) => new Date(t.date) >= sevenDaysAgo);

    let expense = 0;
    let income = 0;
    weekTxs.forEach((t) => {
      if (t.type === "expense") expense += t.amount;
      if (t.type === "income") income += t.amount;
    });

    let text = `🗓️ Rekap 7 Hari Terakhir:\n\n`;
    text += `💰 Pemasukan   : ${formatRupiah(income)}\n`;
    text += `💸 Pengeluaran : ${formatRupiah(expense)}\n`;
    text += `📈 Net Cashflow: ${formatRupiah(income - expense)}\n`;
    text += `📝 Total Transaksi: ${weekTxs.length} kali`;
    return text;
  }

  // /bulan ini
  if (cmd === "/bulan ini") {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTxs = transactions.filter((t) => t.date.slice(0, 7) === currentMonth);

    let expense = 0;
    let income = 0;
    const catMap: Record<string, number> = {};

    monthTxs.forEach((t) => {
      if (t.type === "expense") {
        expense += t.amount;
        const cName = categories.find((c) => c.id === t.category_id)?.name || "Lain-lain";
        catMap[cName] = (catMap[cName] || 0) + t.amount;
      }
      if (t.type === "income") income += t.amount;
    });

    let text = `📊 Rekap Bulan Ini (${new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}):\n\n`;
    text += `💰 Pemasukan   : ${formatRupiah(income)}\n`;
    text += `💸 Pengeluaran : ${formatRupiah(expense)}\n`;
    text += `📈 Selisih Kas : ${formatRupiah(income - expense)}\n\n`;
    text += `Top Kategori Pengeluaran:\n`;

    const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 4);
    if (sortedCats.length === 0) {
      text += `Belum ada pengeluaran tercatat bulan ini.`;
    } else {
      sortedCats.forEach(([name, amt]) => {
        text += `• ${name}: ${formatRupiah(amt)}\n`;
      });
    }
    return text;
  }

  // /budget
  if (cmd === "/budget") {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let text = `🎯 Status Budget Bulan Ini:\n\n`;

    if (budgets.length === 0) {
      text += `Belum ada budget yang disetel. Silakan atur budget bulanan di dashboard TataDana!`;
    } else {
      budgets.forEach((b) => {
        const cat = categories.find((c) => c.id === b.category_id);
        const catTxs = transactions.filter(
          (t) => t.category_id === b.category_id && t.date.slice(0, 7) === currentMonth && t.type === "expense"
        );
        const spent = catTxs.reduce((acc, t) => acc + t.amount, 0);
        const pct = Math.min(999, Math.round((spent / b.monthly_limit) * 100));
        const sisa = Math.max(0, b.monthly_limit - spent);
        const bar = renderProgressBar(pct, 8);

        text += `${cat?.icon || "🏷️"} ${cat?.name || "Kategori"}\n`;
        text += `${bar} ${pct}% (${formatRupiah(spent)} / ${formatRupiah(b.monthly_limit)})\n`;
        text += `Sisa: ${formatRupiah(sisa)}\n\n`;
      });
    }
    return text.trim();
  }

  // /sheet
  if (cmd === "/sheet") {
    return `📊 Akses Data Laporan TataDana:\n\nSemua transaksi Anda tersimpan aman dan terintegrasi di database TataDana. Anda dapat mengakses tabel lengkap dan mengekspor laporan on-demand ke Excel (.xlsx) atau PDF kapan saja melalui:\n👉 https://tatadana.id/dashboard/laporan`;
  }

  // /bantuan
  if (cmd === "/bantuan" || cmd === "/help" || cmd === "/start") {
    return `👋 Halo ${user.full_name}! Selamat datang di TataDana Bot.

Cara mencatat keuangan super cepat:
1. Ketik pesan santai:
   • "beli soto 25rb"
   • "bensin pertamax 50k"
   • "gajian kantor 8.5jt"
2. Kirim Voice Note: Bicara pengeluaranmu (maks 60 detik)
3. Kirim Foto Struk (khusus paket Pro): Struk otomatis di-scan & dipecah per item!

Daftar Command Cepat:
/saldo — Cek saldo seluruh dompet
/hari ini — Rekap transaksi hari ini
/minggu ini — Rekap 7 hari terakhir
/bulan ini — Rekap & breakdown bulan ini
/budget — Pantau persentase budget aktif
/sheet — Link laporan & ekspor Excel/PDF
/bantuan — Lihat panduan ini`;
  }

  return `Perintah tidak dikenal. Ketik /bantuan untuk melihat daftar perintah yang tersedia.`;
}

/**
 * Format 4.7: AI Financial Advisor (Fitur Pro)
 */
export function generateAIAdvisorAdvice(user: UserProfile, transactions: Transaction[]): string | null {
  if (user.plan_tier !== "pro") return null;

  // Analisa transaksi terkini
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTxs = transactions.filter((t) => t.date.slice(0, 7) === currentMonth);
  
  let totalIncome = 0;
  let totalExpense = 0;
  monthTxs.forEach((t) => {
    if (t.type === "income") totalIncome += t.amount;
    if (t.type === "expense") totalExpense += t.amount;
  });

  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  let advice = "";
  if (expenseRatio > 80) {
    advice = `total pengeluaranmu bulan ini sudah mencapai ${Math.round(expenseRatio)}% dari pemasukan. Pengeluaran di kategori F&B dan Belanja cukup tinggi minggu ini.\n\n💡 Saran: Coba terapkan aturan 50/30/20 dan batasi jajan di luar untuk sisa minggu ini agar arus kas tetap surplus.`;
  } else {
    advice = `arus kas keuanganmu minggu ini sangat stabil. Rasio belanja terhadap tabungan berada di angka sehat (${Math.round(expenseRatio)}%).\n\n💡 Saran: Jangan lupa segera alokasikan 15-20% surplus bulan ini ke instrumen investasi reksadana atau dana daruratmu!`;
  }

  return `🤖 Financial Advisor\nHei ${user.full_name}! ${advice}`;
}

/**
 * Format 4.8: Reminder Harian
 */
export function formatDailyReminder(): string {
  return `⏰ Reminder Keuangan!
Jangan lupa catat pengeluaran hari ini ya 📝
Pencatatan rutin = keuangan lebih terkontrol 💪
Ketik transaksimu sekarang!`;
}
