import { parseIndonesianCurrency } from "@/lib/utils";

export interface ParsedFinancialInput {
  success: boolean;
  type?: 'expense' | 'income' | 'transfer';
  amount?: number;
  categoryName?: string;
  notes?: string;
  transferToWalletName?: string;
  rawText: string;
  errorMessage?: string;
  items?: Array<{ item_name: string; quantity: number; price: number; categoryName?: string }>;
  merchantName?: string;
  isReceipt?: boolean;
  transcript?: string; // For Voice Note
}

// Category keyword mapping for natural Indonesian inference
const CATEGORY_MAP: Record<string, { name: string; type: 'expense' | 'income' }> = {
  // Makanan
  "makan": { name: "Makanan & Minuman", type: "expense" },
  "minum": { name: "Makanan & Minuman", type: "expense" },
  "bakso": { name: "Makanan & Minuman", type: "expense" },
  "kopi": { name: "Makanan & Minuman", type: "expense" },
  "nasi": { name: "Makanan & Minuman", type: "expense" },
  "mie": { name: "Makanan & Minuman", type: "expense" },
  "ayam": { name: "Makanan & Minuman", type: "expense" },
  "soto": { name: "Makanan & Minuman", type: "expense" },
  "cemilan": { name: "Makanan & Minuman", type: "expense" },
  "sarapan": { name: "Makanan & Minuman", type: "expense" },
  "lunch": { name: "Makanan & Minuman", type: "expense" },
  "dinner": { name: "Makanan & Minuman", type: "expense" },
  "gofood": { name: "Makanan & Minuman", type: "expense" },
  "grabfood": { name: "Makanan & Minuman", type: "expense" },
  "shopeefood": { name: "Makanan & Minuman", type: "expense" },

  // Transport
  "bensin": { name: "Transportasi", type: "expense" },
  "pertalite": { name: "Transportasi", type: "expense" },
  "pertamax": { name: "Transportasi", type: "expense" },
  "shell": { name: "Transportasi", type: "expense" },
  "parkir": { name: "Transportasi", type: "expense" },
  "toll": { name: "Transportasi", type: "expense" },
  "tol": { name: "Transportasi", type: "expense" },
  "ojol": { name: "Transportasi", type: "expense" },
  "gojek": { name: "Transportasi", type: "expense" },
  "grab": { name: "Transportasi", type: "expense" },
  "kereta": { name: "Transportasi", type: "expense" },
  "krl": { name: "Transportasi", type: "expense" },
  "mrt": { name: "Transportasi", type: "expense" },

  // Tagihan
  "listrik": { name: "Tagihan & Utilitas", type: "expense" },
  "pln": { name: "Tagihan & Utilitas", type: "expense" },
  "wifi": { name: "Tagihan & Utilitas", type: "expense" },
  "indihome": { name: "Tagihan & Utilitas", type: "expense" },
  "pdam": { name: "Tagihan & Utilitas", type: "expense" },
  "air": { name: "Tagihan & Utilitas", type: "expense" },
  "pulsa": { name: "Tagihan & Utilitas", type: "expense" },
  "paket data": { name: "Tagihan & Utilitas", type: "expense" },
  "bpjs": { name: "Tagihan & Utilitas", type: "expense" },

  // Belanja
  "belanja": { name: "Belanja Harian", type: "expense" },
  "indomaret": { name: "Belanja Harian", type: "expense" },
  "alfamart": { name: "Belanja Harian", type: "expense" },
  "superindo": { name: "Belanja Harian", type: "expense" },
  "baju": { name: "Belanja Harian", type: "expense" },
  "sepatu": { name: "Belanja Harian", type: "expense" },
  "shopee": { name: "Belanja Harian", type: "expense" },
  "tokopedia": { name: "Belanja Harian", type: "expense" },

  // Hiburan
  "bioskop": { name: "Hiburan & Hobi", type: "expense" },
  "nonton": { name: "Hiburan & Hobi", type: "expense" },
  "game": { name: "Hiburan & Hobi", type: "expense" },
  "topup": { name: "Hiburan & Hobi", type: "expense" },
  "netflix": { name: "Hiburan & Hobi", type: "expense" },
  "spotify": { name: "Hiburan & Hobi", type: "expense" },

  // Kesehatan
  "obat": { name: "Kesehatan", type: "expense" },
  "dokter": { name: "Kesehatan", type: "expense" },
  "apotek": { name: "Kesehatan", type: "expense" },
  "vitamin": { name: "Kesehatan", type: "expense" },

  // Pendapatan
  "gaji": { name: "Gaji & Honor", type: "income" },
  "gajian": { name: "Gaji & Honor", type: "income" },
  "salary": { name: "Gaji & Honor", type: "income" },
  "bonus": { name: "Bonus & Freelance", type: "income" },
  "freelance": { name: "Bonus & Freelance", type: "income" },
  "proyek": { name: "Bonus & Freelance", type: "income" },
  "side job": { name: "Bonus & Freelance", type: "income" },
  "jual": { name: "Bonus & Freelance", type: "income" },
};

/**
 * Parse natural language financial chat message into structured financial data
 */
export function parseNaturalLanguageInput(text: string): ParsedFinancialInput {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      success: false,
      rawText: text,
      errorMessage: "Pesan kosong. Silakan ketik transaksi Anda, contoh: `beli soto 25rb` atau `gajian 5jt`",
    };
  }

  // Regex pattern to extract currency tokens like "15rb", "1.5jt", "500k", "25.000", "Rp150.000"
  const amountPattern = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|ribu|rebu|k)?|\d{1,3}(?:\.\d{3})+)/i;
  const match = trimmed.match(amountPattern);

  if (!match) {
    return {
      success: false,
      rawText: text,
      errorMessage: `⚠️ Kami belum mengenali nominal pada pesan Anda: "${trimmed}"\n\n💡 Contoh format yang benar:\n• "beli bakso 15rb"\n• "isi bensin shell 50k"\n• "gajian kantor 6.5jt"\n• "bayar listrik 250000"`,
    };
  }

  const rawAmountToken = match[0];
  const parsedAmount = parseIndonesianCurrency(rawAmountToken);

  if (!parsedAmount || parsedAmount <= 0) {
    return {
      success: false,
      rawText: text,
      errorMessage: `⚠️ Nominal "${rawAmountToken}" tidak valid. Harap gunakan format seperti "15rb", "500k", atau "1.5jt".`,
    };
  }

  // Clean the notes (remove the matched amount)
  const notes = trimmed.replace(rawAmountToken, "").replace(/\s+/g, " ").trim();
  const lowerNotes = notes.toLowerCase();

  // Determine Type & Category
  let type: 'expense' | 'income' = 'expense';
  let categoryName = "Makanan & Minuman";

  // Check income indicators
  if (
    lowerNotes.includes("gaji") ||
    lowerNotes.includes("gajian") ||
    lowerNotes.includes("masuk") ||
    lowerNotes.includes("bonus") ||
    lowerNotes.includes("freelance") ||
    lowerNotes.includes("dapat uang") ||
    lowerNotes.includes("terima uang") ||
    lowerNotes.includes("transfer masuk")
  ) {
    type = "income";
    categoryName = "Gaji & Honor";
  }

  // Find most matching category from keywords
  for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
    if (lowerNotes.includes(kw)) {
      type = cat.type;
      categoryName = cat.name;
      break;
    }
  }

  return {
    success: true,
    type,
    amount: parsedAmount,
    categoryName,
    notes: notes || (type === "income" ? "Pemasukan rutin" : "Pengeluaran harian"),
    rawText: text,
  };
}

/**
 * Simulate / parse Voice Note with 60 second limit enforcement
 */
export function parseVoiceNoteInput(
  simulatedTranscript: string, 
  durationSeconds: number
): ParsedFinancialInput {
  if (durationSeconds > 60) {
    return {
      success: false,
      rawText: "[Voice Note]",
      errorMessage: "⏱️ Durasi voice note melebihi 60 detik. Mohon persingkat rekaman suara Anda untuk efisiensi pemrosesan.",
    };
  }

  const result = parseNaturalLanguageInput(simulatedTranscript);
  return {
    ...result,
    transcript: simulatedTranscript,
  };
}

/**
 * Parse Photo Receipt (Vision AI OCR simulation/handler for Pro plan)
 */
export function parseReceiptImageInput(
  imageSource: string, 
  userPlan: 'starter' | 'pro'
): ParsedFinancialInput {
  if (userPlan !== 'pro') {
    return {
      success: false,
      rawText: "[Foto Struk]",
      errorMessage: "🔒 Fitur pencatatan otomatis via foto struk khusus untuk pengguna paket Pro! Upgrade akun Anda untuk nikmati kemudahan foto struk multi-item.",
    };
  }

  // Realistic mock receipt extraction output
  return {
    success: true,
    type: 'expense',
    amount: 145000,
    categoryName: "Belanja Harian",
    notes: "Struk Belanja Supermarket",
    merchantName: "Supermarket Grand Lucky",
    rawText: "[Foto Struk Terverifikasi]",
    isReceipt: true,
    items: [
      { item_name: "Susu Segar Pasteur 1L", quantity: 2, price: 54000, categoryName: "Makanan & Minuman" },
      { item_name: "Roti Brioche Toast", quantity: 1, price: 32000, categoryName: "Makanan & Minuman" },
      { item_name: "Sabun Mandi Refill 800ml", quantity: 1, price: 38000, categoryName: "Belanja Harian" },
      { item_name: "Air Mineral Botol 600ml", quantity: 3, price: 21000, categoryName: "Makanan & Minuman" },
    ],
  };
}
