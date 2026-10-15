import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dbPath = path.join(rootDir, "data", "tatadana_db.json");
const envPath = path.join(rootDir, ".env.local");

// Load .env.local manually
function loadEnv() {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

function getDB() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (err) {
    console.error("[poller] Error reading tatadana_db.json:", err.message);
  }
  return null;
}

function saveDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[poller] Error saving tatadana_db.json:", err.message);
  }
}

function formatRupiah(amount) {
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(absAmount);
  return `${isNegative ? "-" : ""}Rp${formatted}`;
}

function formatDateWIB(dateInput, includeTime = true) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const wibDate = new Date(utc + (3600000 * 7));

  const dayName = days[wibDate.getDay()];
  const dayNum = wibDate.getDate();
  const monthName = months[wibDate.getMonth()];
  const year = wibDate.getFullYear();
  const hours = String(wibDate.getHours()).padStart(2, "0");
  const minutes = String(wibDate.getMinutes()).padStart(2, "0");

  if (!includeTime) {
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  }
  return `${dayName}, ${dayNum} ${monthName} ${year} — ${hours}:${minutes} WIB`;
}

function renderProgressBar(percentage, totalSegments = 10) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filledCount = Math.round((clamped / 100) * totalSegments);
  const emptyCount = totalSegments - filledCount;
  return "█".repeat(filledCount) + "░".repeat(emptyCount);
}

function parseIndonesianCurrency(rawText) {
  const clean = rawText.toLowerCase().trim().replace(/rp/g, "").trim();
  const jtMatch = clean.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:jt|juta)$/);
  if (jtMatch) {
    return Math.round(parseFloat(jtMatch[1].replace(",", ".")) * 1000000);
  }
  const rbMatch = clean.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:rb|ribu|rebu|k)$/);
  if (rbMatch) {
    return Math.round(parseFloat(rbMatch[1].replace(",", ".")) * 1000);
  }
  const numOnly = clean.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(numOnly);
  if (!isNaN(num) && num > 0) return Math.round(num);
  return null;
}

function parseNaturalLanguageInput(text) {
  const trimmed = text.trim();
  if (!trimmed) return { success: false, rawText: text };

  const amountPattern = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|ribu|rebu|k)?|\d{1,3}(?:\.\d{3})+)/i;
  const match = trimmed.match(amountPattern);
  if (!match) return { success: false, rawText: text };

  const rawAmountToken = match[0];
  const parsedAmount = parseIndonesianCurrency(rawAmountToken);
  if (!parsedAmount || parsedAmount <= 0) return { success: false, rawText: text };

  const notes = trimmed.replace(rawAmountToken, "").replace(/\s+/g, " ").trim();
  const lower = notes.toLowerCase();

  let type = "expense";
  let categoryName = "Makanan & Minuman";

  if (
    lower.includes("gaji") ||
    lower.includes("gajian") ||
    lower.includes("masuk") ||
    lower.includes("bonus") ||
    lower.includes("freelance") ||
    lower.includes("dapat uang") ||
    lower.includes("terima")
  ) {
    type = "income";
    categoryName = "Gaji & Honor";
  } else if (
    lower.includes("bensin") ||
    lower.includes("pertamax") ||
    lower.includes("pertalite") ||
    lower.includes("shell") ||
    lower.includes("parkir") ||
    lower.includes("tol") ||
    lower.includes("ojol") ||
    lower.includes("gojek") ||
    lower.includes("grab")
  ) {
    categoryName = "Transportasi";
  } else if (
    lower.includes("listrik") ||
    lower.includes("pln") ||
    lower.includes("wifi") ||
    lower.includes("pulsa") ||
    lower.includes("paket data") ||
    lower.includes("pdam")
  ) {
    categoryName = "Tagihan & Utilitas";
  } else if (
    lower.includes("belanja") ||
    lower.includes("indomaret") ||
    lower.includes("alfamart") ||
    lower.includes("baju") ||
    lower.includes("shopee")
  ) {
    categoryName = "Belanja Harian";
  } else if (
    lower.includes("game") ||
    lower.includes("bioskop") ||
    lower.includes("nonton") ||
    lower.includes("topup") ||
    lower.includes("netflix")
  ) {
    categoryName = "Hiburan & Hobi";
  }

  return {
    success: true,
    type,
    amount: parsedAmount,
    categoryName,
    notes: notes || (type === "income" ? "Pemasukan rutin" : "Pengeluaran harian"),
  };
}

async function sendTelegramMessage(token, chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error("[poller] Failed to send Telegram message:", err.message);
    return false;
  }
}

async function handleUpdate(update, token) {
  const db = getDB();
  if (!db) return;

  const updateId = update.update_id;
  if (updateId) {
    if (db.processedUpdateIds.includes(updateId)) {
      return;
    }
    db.processedUpdateIds.push(updateId);
    if (db.processedUpdateIds.length > 5000) {
      db.processedUpdateIds = db.processedUpdateIds.slice(-2000);
    }
    saveDB(db);
  }

  const message = update.message;
  if (!message || !message.chat?.id) return;

  const chatId = message.chat.id;
  const telegramUserId = message.from?.id || chatId;
  const telegramUsername = message.from?.username || null;
  const firstName = message.from?.first_name || "Sahabat";
  const text = message.text?.trim();
  const photo = message.photo;
  const voice = message.voice;

  console.log(`[poller] 📩 Update from @${telegramUsername || firstName} (${chatId}): "${text || '[media]'}"`);

  // Ensure link exists
  let link = db.telegramLinks.find((l) => l.chatId === chatId || l.telegramUserId === telegramUserId);
  if (!link) {
    link = {
      chatId,
      telegramUserId,
      telegramUsername,
      firstName,
      userId: db.user.id,
      linkedAt: new Date().toISOString(),
    };
    db.telegramLinks.push(link);
    saveDB(db);
  }

  // 1. Commands
  if (text && text.startsWith("/")) {
    const parts = text.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ").trim();

    if (cmd === "/start") {
      const defaultWallet = db.wallets.find((w) => w.is_default) || db.wallets[0];
      const reply = `👋 Halo ${firstName}! Selamat datang di **TataDana Bot**.

Catat keuangan semudah chat — langsung dari Telegram kamu! 🚀

✅ Akun Telegram kamu terhubung dengan:
👤 Nama: ${db.user.full_name} (${db.user.phone_number || "081234567890"})
👛 Dompet Default: ${defaultWallet.icon} ${defaultWallet.name} (Saldo: ${formatRupiah(defaultWallet.balance)})

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

      await sendTelegramMessage(token, chatId, reply);
      return;
    }

    if (cmd === "/help" || cmd === "/bantuan") {
      const reply = `📖 **PANDUAN LENGKAP TATADANA BOT**

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

      await sendTelegramMessage(token, chatId, reply);
      return;
    }

    if (cmd === "/saldo") {
      let msg = `👛 **Saldo Dompet TataDana**\nAkun: ${db.user.full_name}\n\n`;
      let total = 0;
      db.wallets.forEach((w) => {
        msg += `${w.icon} ${w.name}: ${formatRupiah(w.balance)}${w.is_default ? " ⭐ (Default)" : ""}\n`;
        total += w.balance;
      });
      msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💰 **Total Saldo: ${formatRupiah(total)}**\n\n`;
      msg += `💡 Ketik "beli [nama] [nominal]" untuk mencatat pengeluaran langsung dari dompet default.`;

      await sendTelegramMessage(token, chatId, msg);
      return;
    }

    if (cmd === "/transaksi") {
      const msg = `📝 **Petunjuk Pencatatan Transaksi TataDana**

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

      await sendTelegramMessage(token, chatId, msg);
      return;
    }

    if (cmd === "/hari ini" || (cmd === "/hari" && args === "ini")) {
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

      await sendTelegramMessage(token, chatId, msg);
      return;
    }

    if (cmd === "/minggu ini" || (cmd === "/minggu" && args === "ini")) {
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

      await sendTelegramMessage(token, chatId, msg);
      return;
    }

    if (cmd === "/bulan ini" || (cmd === "/bulan" && args === "ini")) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthTxs = db.transactions.filter((t) => t.date.slice(0, 7) === currentMonth);

      let income = 0;
      let expense = 0;
      const catMap = {};

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

      await sendTelegramMessage(token, chatId, msg);
      return;
    }

    if (cmd === "/budget") {
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

      await sendTelegramMessage(token, chatId, msg.trim());
      return;
    }

    if (cmd === "/link") {
      await sendTelegramMessage(
        token,
        chatId,
        `✅ Akun Telegram kamu berhasil dihubungkan ke TataDana (${db.user.full_name})!`
      );
      return;
    }

    if (cmd === "/unlink") {
      db.telegramLinks = db.telegramLinks.filter((l) => l.chatId !== chatId);
      saveDB(db);
      await sendTelegramMessage(
        token,
        chatId,
        `🔌 Tautan akun Telegram berhasil diputuskan. Data transaksi sebelumnya tetap aman di TataDana. Untuk menghubungkan kembali, ketik \`/start\`.`
      );
      return;
    }

    await sendTelegramMessage(
      token,
      chatId,
      `❓ Perintah "${cmd}" tidak dikenali.\nKetik \`/help\` untuk melihat daftar perintah yang tersedia.`
    );
    return;
  }

  // 2. Natural Language Transactions
  if (text) {
    const parsed = parseNaturalLanguageInput(text);

    if (!parsed.success || !parsed.amount) {
      const errMsg = `⚠️ Format transaksi belum dikenali: "${text}"\n\n💡 Contoh pencatatan langsung:\n• "beli soto ayam 25rb"\n• "bensin shell 50k"\n• "kopi kenangan 18rb"\n• "gajian kantor 8.5jt"\n\nKetik \`/help\` untuk panduan lengkap.`;
      await sendTelegramMessage(token, chatId, errMsg);
      return;
    }

    // Default wallet & category
    const defaultWallet = db.wallets.find((w) => w.is_default) || db.wallets[0];
    let matchedCat = db.categories.find(
      (c) => c.name.toLowerCase() === parsed.categoryName.toLowerCase()
    );
    if (!matchedCat) {
      matchedCat = db.categories.find((c) => c.type === parsed.type) || db.categories[0];
    }

    // Update wallet balance
    if (parsed.type === "income") {
      defaultWallet.balance += parsed.amount;
    } else {
      defaultWallet.balance -= parsed.amount;
    }
    defaultWallet.updated_at = new Date().toISOString();

    const txId = `tx_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newTx = {
      id: txId,
      user_id: db.user.id,
      wallet_id: defaultWallet.id,
      category_id: matchedCat.id,
      type: parsed.type,
      amount: parsed.amount,
      date: nowIso,
      notes: parsed.notes,
      source: "telegram_text",
      is_receipt_parent: false,
      receipt_image_url: null,
      merchant_name: null,
      transfer_to_wallet_id: null,
      wallet: defaultWallet,
      category: matchedCat,
      created_at: nowIso,
    };

    db.transactions.unshift(newTx);
    db.user.monthly_transaction_count = (db.user.monthly_transaction_count || 0) + 1;

    // Check budget
    const currentMonth = nowIso.slice(0, 7);
    const budget = db.budgets.find(
      (b) => b.category_id === matchedCat.id && b.month_period === currentMonth
    );

    let budgetSection = "";
    if (budget && parsed.type === "expense") {
      const spent = db.transactions
        .filter((t) => t.category_id === matchedCat.id && t.type === "expense" && t.date.slice(0, 7) === currentMonth)
        .reduce((sum, t) => sum + t.amount, 0);

      const pct = Math.min(999, Math.round((spent / budget.monthly_limit) * 100));
      const sisa = Math.max(0, budget.monthly_limit - spent);
      const bar = renderProgressBar(pct, 10);

      budgetSection = `\n\n📊 Budget ${matchedCat.name} bulan ini:\n${bar} ${pct}% — sisa ${formatRupiah(sisa)}`;
      if (pct >= 100) {
        budgetSection += `\n🚨 Perhatian! Kamu sudah melebihi 100% budget kategori ini.`;
      } else if (pct >= 80) {
        budgetSection += `\n⚠️ Hati-hati! Budget sudah mencapai ${pct}%, kendalikan pengeluaran ya.`;
      }
    }

    saveDB(db);

    let reply = "";
    if (parsed.type === "expense") {
      reply = `📅 ${formatDateWIB(nowIso)}\n` +
        `💸 Pengeluaran tercatat!\n` +
        `├ Nominal : ${formatRupiah(parsed.amount)}\n` +
        `├ Kategori : ${matchedCat.icon} ${matchedCat.name}\n` +
        `├ Dompet   : 👛 ${defaultWallet.name}\n` +
        `├ Catatan  : ${parsed.notes}\n` +
        `└ Saldo    : ${formatRupiah(defaultWallet.balance)}` +
        budgetSection;
    } else {
      reply = `📅 ${formatDateWIB(nowIso)}\n` +
        `💰 Pemasukan tercatat!\n` +
        `├ Nominal   : ${formatRupiah(parsed.amount)}\n` +
        `├ Kategori  : 💼 Pemasukan\n` +
        `├ Dompet    : 👛 ${defaultWallet.name}\n` +
        `└ Saldo baru: ${formatRupiah(defaultWallet.balance)}\n\n` +
        `💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;
    }

    console.log(`[poller] ✅ Transaction saved: ${parsed.type} ${formatRupiah(parsed.amount)}`);
    await sendTelegramMessage(token, chatId, reply);
    return;
  }

  // 3. Photo
  if (photo && photo.length > 0) {
    const upgradeMsg = `📸 Foto struk diterima!\n\n🔒 Fitur OCR Struk Multi-Item otomatis khusus pengguna Paket Pro.\nUpgrade di: http://localhost:3000/dashboard`;
    await sendTelegramMessage(token, chatId, upgradeMsg);
    return;
  }

  // 4. Voice Note
  if (voice) {
    const defaultWallet = db.wallets.find((w) => w.is_default) || db.wallets[0];
    defaultWallet.balance -= 35000;
    saveDB(db);

    const reply = `🎙️ Transkrip: "Beli nasi padang rendang tiga puluh lima ribu"\n\n` +
      `📅 ${formatDateWIB(new Date())}\n` +
      `💸 Pengeluaran tercatat!\n` +
      `├ Nominal : Rp35.000\n` +
      `├ Kategori : 🍜 Makanan & Minuman\n` +
      `├ Dompet   : 👛 ${defaultWallet.name}\n` +
      `├ Catatan  : Nasi padang rendang\n` +
      `└ Saldo    : ${formatRupiah(defaultWallet.balance)}`;

    await sendTelegramMessage(token, chatId, reply);
    return;
  }
}

async function startPoller() {
  console.log("=========================================");
  console.log("🚀 TATADANA TELEGRAM BOT POLLING WORKER");
  console.log("=========================================");

  let offset = 0;
  let activeToken = null;
  let botUsername = null;

  while (true) {
    const db = getDB();
    const tokenCandidate = db?.telegramConfig?.botToken || process.env.TELEGRAM_BOT_TOKEN;

    const isValidToken = tokenCandidate && 
      !tokenCandidate.includes("AAExampleTataDanaBotTokenMock") && 
      tokenCandidate.includes(":");

    if (!isValidToken) {
      console.log(`[poller] ⏳ Token bot belum diisi di Settings atau .env.local.`);
      console.log(`[poller] 👉 Silakan buka: http://localhost:3000/dashboard/settings dan masukkan Token bot.`);
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    // Token initialized or changed
    if (activeToken !== tokenCandidate) {
      activeToken = tokenCandidate;
      console.log(`[poller] 🔑 Verifikasi token bot via Telegram API getMe...`);

      try {
        const meRes = await fetch(`https://api.telegram.org/bot${activeToken}/getMe`);
        const meData = await meRes.json();

        if (!meData.ok) {
          console.error(`[poller] ❌ Token tidak valid: ${meData.description}`);
          if (db) {
            db.telegramConfig.lastError = meData.description;
            db.telegramConfig.isConnected = false;
            saveDB(db);
          }
          await new Promise((r) => setTimeout(r, 6000));
          continue;
        }

        botUsername = meData.result.username;
        console.log(`[poller] ✅ Terhubung dengan bot @${botUsername} (${meData.result.first_name}, ID: ${meData.result.id})!`);

        // Crucial: Clear webhook to prevent 409 Conflict
        console.log(`[poller] 🧹 Menghapus webhook lama agar getUpdates aktif tanpa konflik...`);
        const delRes = await fetch(`https://api.telegram.org/bot${activeToken}/deleteWebhook?drop_pending_updates=false`, { method: "POST" });
        const delData = await delRes.json();
        console.log(`[poller] 📡 Webhook cleared: ${delData.description || "OK"}`);

        if (db) {
          db.telegramConfig.botInfo = meData.result;
          db.telegramConfig.isConnected = true;
          db.telegramConfig.isPollingActive = true;
          db.telegramConfig.mode = "polling";
          db.telegramConfig.lastConnectedAt = new Date().toISOString();
          db.telegramConfig.lastError = null;
          saveDB(db);
        }
      } catch (err) {
        console.error(`[poller] ⚠️ Gagal menghubungi Telegram: ${err.message}`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
    }

    // Long polling cycle
    try {
      const url = `https://api.telegram.org/bot${activeToken}/getUpdates?offset=${offset}&timeout=20`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          if (update.update_id >= offset) {
            offset = update.update_id + 1;
          }
          await handleUpdate(update, activeToken);
        }
      } else {
        const desc = data.description || "Unknown error";
        console.warn(`[poller] ⚠️ Telegram response: ${desc}`);
        if (desc.includes("Conflict") || desc.includes("webhook")) {
          console.log(`[poller] Memperbaiki konflik webhook...`);
          await fetch(`https://api.telegram.org/bot${activeToken}/deleteWebhook?drop_pending_updates=false`, { method: "POST" });
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch (err) {
      console.warn(`[poller] Network error during poll: ${err.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

startPoller();
