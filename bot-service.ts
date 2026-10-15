import { 
  getServerDB, 
  saveServerDB, 
  isUpdateProcessed, 
  markUpdateProcessed, 
  getUserForTelegramChat, 
  linkTelegramChat, 
  unlinkTelegramChat, 
  addServerTransaction, 
  getTelegramConfig, 
  updateTelegramConfig 
} from "@/lib/server-store";
import { parseNaturalLanguageInput } from "@/lib/telegram/parser";
import { formatExpenseReply, formatIncomeReply, handleBotCommand } from "@/lib/telegram/bot-reply";
import { formatRupiah, formatDateWIB, renderProgressBar } from "@/lib/utils";

export interface BotTestResult {
  ok: boolean;
  bot?: {
    id: number;
    first_name: string;
    username: string;
    can_join_groups?: boolean;
    can_read_all_group_messages?: boolean;
    supports_inline_queries?: boolean;
  };
  webhook?: {
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    last_error_message?: string;
  };
  message: string;
  error?: string;
}

export async function validateBotToken(token: string): Promise<BotTestResult> {
  const cleanToken = token.trim();

  if (!cleanToken || !cleanToken.includes(":")) {
    return {
      ok: false,
      message: "Format bot token tidak valid. Token biasanya memiliki format seperti: 123456789:ABCdefGhIJKlmNoPqRstuVWXyz",
      error: "invalid_format",
    };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const data = await res.json();

    if (!data.ok || !data.result) {
      return {
        ok: false,
        message: data.description || "Token bot tidak valid atau bot telah dihapus dari Telegram BotFather.",
        error: data.description || "unauthorized",
      };
    }

    // Also fetch webhook info
    let webhookInfo: any = null;
    try {
      const whRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getWebhookInfo`);
      const whData = await whRes.json();
      if (whData.ok) {
        webhookInfo = whData.result;
      }
    } catch {
      // Ignore webhook fetch error
    }

    return {
      ok: true,
      bot: data.result,
      webhook: webhookInfo,
      message: `Bot @${data.result.username} berhasil terverifikasi!`,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Gagal menghubungi server Telegram API: ${err.message}`,
      error: err.message,
    };
  }
}

export async function deleteBotWebhook(token: string, dropPendingUpdates = false): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=${dropPendingUpdates}`,
      { method: "POST" }
    );
    const data = await res.json();
    return Boolean(data.ok);
  } catch (err) {
    console.warn("[bot-service] Failed to delete webhook:", err);
    return false;
  }
}

export async function setBotWebhook(token: string, url: string): Promise<{ ok: boolean; description?: string }> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(url)}`,
      { method: "POST" }
    );
    const data = await res.json();
    return { ok: Boolean(data.ok), description: data.description };
  } catch (err: any) {
    return { ok: false, description: err.message };
  }
}

export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  try {
    const body: Record<string, any> = {
      chat_id: chatId,
      text,
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error(`[bot-service] Telegram sendMessage failed:`, data.description);
    }
    return Boolean(data.ok);
  } catch (err) {
    console.error(`[bot-service] Network error calling sendMessage:`, err);
    return false;
  }
}

/**
 * Unified Telegram update processor for both Polling and Webhook
 */
export async function processTelegramUpdate(
  update: any,
  activeToken: string
): Promise<{ processed: boolean; reason?: string }> {
  const updateId = update.update_id;

  // 1. Idempotency Check
  if (updateId) {
    if (isUpdateProcessed(updateId)) {
      return { processed: false, reason: "duplicate_update_id" };
    }
    markUpdateProcessed(updateId);
  }

  const message = update.message;
  if (!message || !message.chat?.id) {
    return { processed: false, reason: "no_message" };
  }

  const chatId = message.chat.id;
  const telegramUserId = message.from?.id || chatId;
  const telegramUsername = message.from?.username || null;
  const firstName = message.from?.first_name || "Sahabat";
  const text = message.text?.trim();
  const photo = message.photo;
  const voice = message.voice;

  const db = getServerDB();
  const { user } = getUserForTelegramChat(chatId, telegramUserId);

  // 2. Command Handlers
  if (text && text.startsWith("/")) {
    const parts = text.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ").trim();

    // 2.1 /start
    if (command === "/start") {
      linkTelegramChat(chatId, telegramUserId, telegramUsername, firstName, user.id);
      const defaultWallet = db.wallets.find((w) => w.is_default) || db.wallets[0];

      const welcomeMsg = `👋 Halo ${firstName}! Selamat datang di **TataDana Bot**.

Catat keuangan semudah chat — langsung dari Telegram kamu! 🚀

✅ Akun Telegram kamu terhubung dengan:
👤 Nama: ${user.full_name} (${user.phone_number || "081234567890"})
👛 Dompet Default: ${defaultWallet?.icon || "👛"} ${defaultWallet?.name || "Dompet Tunai"} (Saldo: ${formatRupiah(defaultWallet?.balance || 0)})

━━━━━━━━━━━━━━━━━━━━
💡 **Cara Catat Transaksi Instan:**
Cukup ketik kalimat sehari-hari:
• "beli soto 25rb"
• "kopi susu 18rb"
• "bensin pertamax 50k"
• "gajian kantor 8.5jt"

━━━━━━━━━━━━━━━━━━━━
📌 **Daftar Perintah Cepat:**
/saldo — Cek saldo seluruh dompet
/transaksi — Petunjuk format pencatatan
/hari ini — Rekap transaksi hari ini
/minggu ini — Rekap 7 hari terakhir
/bulan ini — Rekap & breakdown bulan ini
/budget — Pantau limit budget kategori
/help — Panduan lengkap TataDana

Ketik sekarang untuk mencoba transaksi pertamamu!`;

      await sendTelegramMessage(activeToken, chatId, welcomeMsg);
      return { processed: true };
    }

    // 2.2 /help or /bantuan
    if (command === "/help" || command === "/bantuan") {
      const helpMsg = `📖 **PANDUAN LENGKAP TATADANA BOT**

TataDana membantu Anda melacak keuangan dengan cerdas, cepat, dan tanpa ribet.

1️⃣ **Mencatat Pengeluaran:**
Ketik santai nama barang & nominalnya:
• \`beli soto ayam 25rb\`
• \`bensin motor 30k\`
• \`kopi kenangan 22.000\`
• \`parkir 5000\`

2️⃣ **Mencatat Pemasukan:**
Gunakan kata gajian, bonus, atau transfer masuk:
• \`gajian bulan ini 7.5jt\`
• \`bonus freelance 1.2jt\`
• \`terima transfer 500k\`

3️⃣ **Foto Struk (Paket Pro):**
Kirimkan foto struk belanjaan Anda, AI Vision kami otomatis mengekstrak rincian belanja per item!

4️⃣ **Voice Note / VN:**
Kirim rekaman suara berbicara pengeluaran Anda (maks 60 detik).

━━━━━━━━━━━━━━━━━━━━
📋 **Perintah Bot Tersedia:**
/saldo — Menampilkan rincian saldo tiap dompet
/transaksi — Petunjuk & format pencatatan
/hari ini — Rekap transaksi & arus kas hari ini
/minggu ini — Rekap transaksi 7 hari terakhir
/bulan ini — Ringkasan pengeluaran & pemasukan bulan ini
/budget — Cek sisa kuota budget per kategori
/link <nohp> — Menghubungkan akun TataDana
/unlink — Putuskan tautan akun dari bot ini
/bantuan — Menampilkan pesan ini`;

      await sendTelegramMessage(activeToken, chatId, helpMsg);
      return { processed: true };
    }

    // 2.3 /saldo
    if (command === "/saldo") {
      let saldoMsg = `👛 **Saldo Dompet TataDana**\nAkun: ${user.full_name}\n\n`;
      let total = 0;
      db.wallets.forEach((w) => {
        saldoMsg += `${w.icon} ${w.name}: ${formatRupiah(w.balance)}${w.is_default ? " ⭐ (Default)" : ""}\n`;
        total += w.balance;
      });
      saldoMsg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      saldoMsg += `💰 **Total Saldo: ${formatRupiah(total)}**\n\n`;
      saldoMsg += `💡 Ketik "beli [nama] [nominal]" untuk mencatat pengeluaran langsung dari dompet default.`;

      await sendTelegramMessage(activeToken, chatId, saldoMsg);
      return { processed: true };
    }

    // 2.4 /transaksi
    if (command === "/transaksi") {
      const txGuide = `📝 **Petunjuk Pencatatan Transaksi TataDana**

Anda bisa mencatat transaksi kapan saja langsung dari chat ini dengan mengetik kalimat bahasa alami Indonesia:

💸 **Pengeluaran:**
• \`beli bakso 15rb\`
• \`isi bensin pertamax 50k\`
• \`makan siang 35.000\`
• \`bayar tagihan listrik 250rb\`

💰 **Pemasukan:**
• \`gajian kantor 8.5jt\`
• \`bonus freelance 1.5jt\`
• \`transfer masuk 300rb\`

🎙️ **Voice Note:**
Cukup tahan tombol mic dan sebutkan: *"Beli martabak manis tiga puluh lima ribu"*

📸 **Foto Struk:**
Kirimkan foto struk belanjaan dari minimarket/supermarket.

Dashboard web: http://localhost:3000/dashboard`;

      await sendTelegramMessage(activeToken, chatId, txGuide);
      return { processed: true };
    }

    // 2.5 /hari ini
    if (command === "/hari ini" || (command === "/hari" && args === "ini")) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayTxs = db.transactions.filter((t) => t.date.slice(0, 10) === todayStr);

      let income = 0;
      let expense = 0;
      todayTxs.forEach((t) => {
        if (t.type === "income") income += t.amount;
        if (t.type === "expense") expense += t.amount;
      });

      let msg = `📅 **Rekap Transaksi Hari Ini**\n${formatDateWIB(new Date(), false)}\n\n`;
      msg += `💰 Pemasukan  : ${formatRupiah(income)}\n`;
      msg += `💸 Pengeluaran: ${formatRupiah(expense)}\n`;
      msg += `📊 Net Arus Kas: ${formatRupiah(income - expense)}\n\n`;

      if (todayTxs.length === 0) {
        msg += `Belum ada transaksi hari ini. Kirim chat untuk mulai mencatat!`;
      } else {
        msg += `Rincian (${todayTxs.length} transaksi):\n`;
        todayTxs.slice(0, 6).forEach((t) => {
          msg += `• ${t.type === "expense" ? "💸" : "💰"} ${formatRupiah(t.amount)} — ${t.notes || "Tanpa catatan"}\n`;
        });
      }

      await sendTelegramMessage(activeToken, chatId, msg);
      return { processed: true };
    }

    // 2.6 /minggu ini
    if (command === "/minggu ini" || (command === "/minggu" && args === "ini")) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
      const weekTxs = db.transactions.filter((t) => new Date(t.date) >= sevenDaysAgo);

      let income = 0;
      let expense = 0;
      weekTxs.forEach((t) => {
        if (t.type === "income") income += t.amount;
        if (t.type === "expense") expense += t.amount;
      });

      let msg = `🗓️ **Rekap 7 Hari Terakhir**\n\n`;
      msg += `💰 Pemasukan   : ${formatRupiah(income)}\n`;
      msg += `💸 Pengeluaran : ${formatRupiah(expense)}\n`;
      msg += `📈 Net Cashflow: ${formatRupiah(income - expense)}\n`;
      msg += `📝 Total Transaksi: ${weekTxs.length} kali`;

      await sendTelegramMessage(activeToken, chatId, msg);
      return { processed: true };
    }

    // 2.7 /bulan ini
    if (command === "/bulan ini" || (command === "/bulan" && args === "ini")) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthTxs = db.transactions.filter((t) => t.date.slice(0, 7) === currentMonth);

      let income = 0;
      let expense = 0;
      const catMap: Record<string, number> = {};

      monthTxs.forEach((t) => {
        if (t.type === "expense") {
          expense += t.amount;
          const cName = db.categories.find((c) => c.id === t.category_id)?.name || "Lain-lain";
          catMap[cName] = (catMap[cName] || 0) + t.amount;
        }
        if (t.type === "income") income += t.amount;
      });

      let msg = `📊 **Rekap Bulan Ini** (${new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })})\n\n`;
      msg += `💰 Pemasukan   : ${formatRupiah(income)}\n`;
      msg += `💸 Pengeluaran : ${formatRupiah(expense)}\n`;
      msg += `📈 Arus Kas Bersih: ${formatRupiah(income - expense)}\n\n`;
      msg += `**Top Kategori Pengeluaran:**\n`;

      const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 4);
      if (sorted.length === 0) {
        msg += `Belum ada pengeluaran bulan ini.`;
      } else {
        sorted.forEach(([name, amt]) => {
          msg += `• ${name}: ${formatRupiah(amt)}\n`;
        });
      }

      await sendTelegramMessage(activeToken, chatId, msg);
      return { processed: true };
    }

    // 2.8 /budget
    if (command === "/budget") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      let msg = `🎯 **Status Budget Bulan Ini**\n\n`;

      if (db.budgets.length === 0) {
        msg += `Belum ada budget bulanan yang disetel. Silakan atur budget di menu Dashboard TataDana!`;
      } else {
        db.budgets.forEach((b) => {
          const cat = db.categories.find((c) => c.id === b.category_id);
          const catTxs = db.transactions.filter(
            (t) => t.category_id === b.category_id && t.date.slice(0, 7) === currentMonth && t.type === "expense"
          );
          const spent = catTxs.reduce((sum, t) => sum + t.amount, 0);
          const pct = Math.min(999, Math.round((spent / b.monthly_limit) * 100));
          const sisa = Math.max(0, b.monthly_limit - spent);
          const bar = renderProgressBar(pct, 8);

          msg += `${cat?.icon || "🏷️"} **${cat?.name || "Kategori"}**\n`;
          msg += `${bar} ${pct}% (${formatRupiah(spent)} / ${formatRupiah(b.monthly_limit)})\n`;
          msg += `Sisa: ${formatRupiah(sisa)}\n\n`;
        });
      }

      await sendTelegramMessage(activeToken, chatId, msg.trim());
      return { processed: true };
    }

    // 2.9 /link
    if (command === "/link") {
      if (!args) {
        await sendTelegramMessage(
          activeToken,
          chatId,
          `ℹ️ Gunakan format: \`/link <nomor_hp_atau_email>\`\nContoh: \`/link 081234567890\` atau \`/link demo@tatadana.id\``
        );
        return { processed: true };
      }

      linkTelegramChat(chatId, telegramUserId, telegramUsername, firstName, db.user.id);
      await sendTelegramMessage(
        activeToken,
        chatId,
        `✅ Akun Telegram kamu berhasil dihubungkan ke TataDana (${db.user.full_name})!\nSekarang setiap pesan transaksi yang kamu kirim akan langsung tersimpan.`
      );
      return { processed: true };
    }

    // 2.10 /unlink
    if (command === "/unlink") {
      unlinkTelegramChat(chatId);
      await sendTelegramMessage(
        activeToken,
        chatId,
        `🔌 Tautan akun Telegram berhasil diputuskan. Data transaksi sebelumnya tetap aman di TataDana. Untuk menghubungkan kembali, ketik \`/start\`.`
      );
      return { processed: true };
    }

    // Unknown command
    await sendTelegramMessage(
      activeToken,
      chatId,
      `❓ Perintah "${command}" tidak dikenali.\nKetik \`/help\` untuk melihat daftar perintah yang tersedia.`
    );
    return { processed: true };
  }

  // 3. Natural Language Transaction Processing
  if (text) {
    const parsed = parseNaturalLanguageInput(text);

    if (!parsed.success || !parsed.amount) {
      const errMsg = `⚠️ Format transaksi belum dikenali: "${text}"\n\n💡 Contoh pencatatan langsung:\n• "beli soto ayam 25rb"\n• "bensin shell 50k"\n• "kopi kenangan 18rb"\n• "gajian kantor 8.5jt"\n\nKetik \`/help\` untuk panduan lengkap.`;
      await sendTelegramMessage(activeToken, chatId, errMsg);
      return { processed: true };
    }

    // Match or create category
    let matchedCategory = db.categories.find(
      (c) => c.name.toLowerCase() === (parsed.categoryName || "").toLowerCase()
    );
    if (!matchedCategory) {
      matchedCategory = db.categories.find((c) => c.type === parsed.type) || db.categories[0];
    }

    // Default wallet
    const defaultWallet = db.wallets.find((w) => w.is_default) || db.wallets[0];

    // Save transaction to server database
    const result = addServerTransaction({
      userId: user.id,
      walletId: defaultWallet.id,
      categoryId: matchedCategory.id,
      type: parsed.type || "expense",
      amount: parsed.amount,
      notes: parsed.notes,
      source: "telegram_text",
    });

    let replyMsg = "";
    if (parsed.type === "expense") {
      replyMsg = formatExpenseReply({
        walletName: result.wallet.name,
        categoryName: matchedCategory.name,
        categoryIcon: matchedCategory.icon,
        amount: parsed.amount,
        notes: parsed.notes || "Pengeluaran harian",
        remainingBalance: result.wallet.balance,
        budget: result.budget,
        categorySpentThisMonth: result.categorySpentThisMonth,
      });
    } else {
      replyMsg = formatIncomeReply({
        walletName: result.wallet.name,
        categoryName: matchedCategory.name,
        categoryIcon: matchedCategory.icon,
        amount: parsed.amount,
        notes: parsed.notes || "Pemasukan rutin",
        remainingBalance: result.wallet.balance,
      });
    }

    await sendTelegramMessage(activeToken, chatId, replyMsg);
    return { processed: true };
  }

  // 4. Photo (Receipt OCR)
  if (photo && photo.length > 0) {
    if (user.plan_tier !== "pro") {
      const upgradeMsg = `📸 Foto struk belanjaan diterima!\n\n🔒 **Fitur OCR Struk Multi-Item khusus untuk Pengguna Paket Pro**.\nPengguna Pro dapat memfoto struk apa pun, dan AI otomatis memecah item belanjaan per baris kategori!\n\n👉 Upgrade sekarang di: http://localhost:3000/dashboard`;
      await sendTelegramMessage(activeToken, chatId, upgradeMsg);
      return { processed: true };
    }

    // Pro receipt processing simulation
    const defaultWallet = db.wallets.find((w) => w.is_default) || db.wallets[0];
    const foodCat = db.categories.find((c) => c.name.includes("Makanan")) || db.categories[0];

    const receiptResult = addServerTransaction({
      userId: user.id,
      walletId: defaultWallet.id,
      categoryId: foodCat.id,
      type: "expense",
      amount: 85000,
      notes: "Belanja Minimarket (Foto Struk)",
      source: "telegram_photo",
      merchantName: "Indomaret Point",
      items: [
        { item_name: "Susu UHT 1L", quantity: 2, price: 38000, category_id: foodCat.id },
        { item_name: "Roti Tawar", quantity: 1, price: 17000, category_id: foodCat.id },
        { item_name: "Sabun Cuci", quantity: 1, price: 30000, category_id: null },
      ],
    });

    const receiptReply = `📸 **Struk Terverifikasi & Tersimpan!**\n` +
      `🏢 Merchant: Indomaret Point\n` +
      `💸 Total: Rp85.000 (3 item)\n` +
      `├ Susu UHT 1L (2x) : Rp38.000\n` +
      `├ Roti Tawar (1x)  : Rp17.000\n` +
      `└ Sabun Cuci (1x)  : Rp30.000\n\n` +
      `👛 Dompet: ${defaultWallet.name}\n` +
      `💰 Sisa Saldo: ${formatRupiah(receiptResult.wallet.balance)}`;

    await sendTelegramMessage(activeToken, chatId, receiptReply);
    return { processed: true };
  }

  // 5. Voice Note
  if (voice) {
    const defaultWallet = db.wallets.find((w) => w.is_default) || db.wallets[0];
    const foodCat = db.categories.find((c) => c.name.includes("Makanan")) || db.categories[0];

    const vnResult = addServerTransaction({
      userId: user.id,
      walletId: defaultWallet.id,
      categoryId: foodCat.id,
      type: "expense",
      amount: 35000,
      notes: "Nasi padang rendang komplit",
      source: "telegram_voice",
    });

    const vnReply = formatExpenseReply({
      transcript: "Beli nasi padang rendang komplit tiga puluh lima ribu",
      walletName: defaultWallet.name,
      categoryName: foodCat.name,
      categoryIcon: foodCat.icon,
      amount: 35000,
      notes: "Nasi padang rendang komplit",
      remainingBalance: vnResult.wallet.balance,
      budget: vnResult.budget,
      categorySpentThisMonth: vnResult.categorySpentThisMonth,
    });

    await sendTelegramMessage(activeToken, chatId, vnReply);
    return { processed: true };
  }

  return { processed: false, reason: "unhandled_message_type" };
}

/**
 * Global Polling Manager (Singleton across the process)
 */
class TelegramPollingManager {
  private isRunning: boolean = false;
  private abortController: AbortController | null = null;
  private currentToken: string | null = null;
  private lastPollAt: string | null = null;
  private lastError: string | null = null;
  private botInfo: any = null;
  private offset: number = 0;
  private consecutiveErrors: number = 0;

  public getStatus() {
    return {
      isRunning: this.isRunning,
      botToken: this.currentToken ? `${this.currentToken.slice(0, 10)}••••••••` : null,
      botInfo: this.botInfo,
      lastPollAt: this.lastPollAt,
      lastError: this.lastError,
      offset: this.offset,
    };
  }

  public async start(token: string): Promise<{ ok: boolean; message: string; bot?: any }> {
    const cleanToken = token.trim();

    // Verify token first
    const testResult = await validateBotToken(cleanToken);
    if (!testResult.ok || !testResult.bot) {
      this.lastError = testResult.message;
      return { ok: false, message: testResult.message };
    }

    this.botInfo = testResult.bot;
    this.currentToken = cleanToken;

    // Save token to server store
    updateTelegramConfig({
      botToken: cleanToken,
      mode: "polling",
      isConnected: true,
      botInfo: testResult.bot,
      lastConnectedAt: new Date().toISOString(),
      lastError: null,
      isPollingActive: true,
    });

    if (this.isRunning) {
      return {
        ok: true,
        message: `Polling sudah berjalan untuk bot @${this.botInfo.username}.`,
        bot: this.botInfo,
      };
    }

    // Step 1: Ensure Webhook is cleared so Telegram allows getUpdates without 409 Conflict
    console.log(`[bot-polling] Clearing webhook for @${this.botInfo.username}...`);
    await deleteBotWebhook(cleanToken, false);

    // Step 2: Start polling loop
    this.isRunning = true;
    this.abortController = new AbortController();
    this.consecutiveErrors = 0;
    this.lastError = null;

    console.log(`[bot-polling] Starting long-polling loop for @${this.botInfo.username}...`);

    this.runPollingLoop(cleanToken, this.abortController.signal).catch((err) => {
      console.error("[bot-polling] Polling loop fatal error:", err);
      this.isRunning = false;
    });

    return {
      ok: true,
      message: `Polling aktif! Bot @${this.botInfo.username} sekarang siap menerima pesan dari Telegram.`,
      bot: this.botInfo,
    };
  }

  public stop(): { ok: boolean; message: string } {
    if (!this.isRunning) {
      return { ok: true, message: "Polling memang belum berjalan." };
    }

    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    updateTelegramConfig({
      isPollingActive: false,
      mode: "idle",
    });

    console.log("[bot-polling] Polling stopped.");
    return { ok: true, message: "Polling bot berhasil dihentikan." };
  }

  private async runPollingLoop(token: string, signal: AbortSignal) {
    while (this.isRunning && !signal.aborted) {
      try {
        this.lastPollAt = new Date().toISOString();

        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.offset}&timeout=20`;
        const res = await fetch(url, { signal });
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
          this.consecutiveErrors = 0;
          this.lastError = null;

          for (const update of data.result) {
            if (update.update_id >= this.offset) {
              this.offset = update.update_id + 1;
            }

            try {
              await processTelegramUpdate(update, token);
            } catch (err: any) {
              console.error(`[bot-polling] Error processing update ${update.update_id}:`, err);
            }
          }
        } else {
          // If Telegram returned error, e.g. 409 Conflict (webhook was re-attached) or unauthorized
          const desc = data.description || "Telegram API error";
          console.warn(`[bot-polling] Telegram API response not ok: ${desc}`);
          this.lastError = desc;

          if (desc.includes("Conflict") || desc.includes("webhook is active")) {
            console.log("[bot-polling] Resolving conflict by calling deleteWebhook...");
            await deleteBotWebhook(token, false);
          }

          this.consecutiveErrors++;
          const waitTime = Math.min(30000, 1000 * Math.pow(2, this.consecutiveErrors));
          await new Promise((r) => setTimeout(r, waitTime));
        }
      } catch (err: any) {
        if (signal.aborted || !this.isRunning) {
          break;
        }

        console.warn(`[bot-polling] Network error during getUpdates: ${err.message}`);
        this.lastError = err.message;
        this.consecutiveErrors++;
        const waitTime = Math.min(15000, 2000 * this.consecutiveErrors);
        await new Promise((r) => setTimeout(r, waitTime));
      }
    }
  }
}

// Global singleton instance across module reloads
const globalForBot = globalThis as unknown as {
  telegramPollingManager?: TelegramPollingManager;
};

export const botPollingManager =
  globalForBot.telegramPollingManager ?? new TelegramPollingManager();

if (process.env.NODE_ENV !== "production") {
  globalForBot.telegramPollingManager = botPollingManager;
}
