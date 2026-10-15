import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to Indonesian Rupiah standard (Rp15.000 / -Rp15.000)
 */
export function formatRupiah(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(absAmount);
  return `${isNegative ? "-" : ""}Rp${formatted}`;
}

/**
 * Format Indonesian date in WIB (Asia/Jakarta)
 */
export function formatDateWIB(dateInput: string | Date, includeTime = true): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Convert to UTC+7 WIB
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

/**
 * Visual progress bar string using █ and ░ (for Telegram bot & previews)
 */
export function renderProgressBar(percentage: number, totalSegments = 10): string {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filledCount = Math.round((clamped / 100) * totalSegments);
  const emptyCount = totalSegments - filledCount;
  return "█".repeat(filledCount) + "░".repeat(emptyCount);
}

/**
 * Parse Indonesian informal currency strings:
 * "15rb" -> 15000, "1.5jt" -> 1500000, "500k" -> 500000, "20 rebu" -> 20000
 */
export function parseIndonesianCurrency(rawText: string): number | null {
  const clean = rawText.toLowerCase().trim().replace(/rp/g, "").trim();
  
  // match patterns like 1.5jt, 1,5jt, 1.5 juta
  const jtMatch = clean.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:jt|juta)$/);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(",", "."));
    return Math.round(val * 1000000);
  }

  // match patterns like 15rb, 15ribu, 15 rebu, 15k
  const rbMatch = clean.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:rb|ribu|rebu|k)$/);
  if (rbMatch) {
    const val = parseFloat(rbMatch[1].replace(",", "."));
    return Math.round(val * 1000);
  }

  // raw number like 15000 or 15.000
  const numOnly = clean.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(numOnly);
  if (!isNaN(num) && num > 0) {
    return Math.round(num);
  }

  return null;
}
