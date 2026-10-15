import { Transaction, Wallet, Category, UserProfile } from "@/types";
import { formatRupiah, formatDateWIB } from "@/lib/utils";

/**
 * Generate PDF report for TataDana transactions
 */
export async function generatePDFReport(
  user: UserProfile,
  transactions: Transaction[],
  wallets: Wallet[],
  categories: Category[],
  periodLabel: string
): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(249, 115, 22); // Orange primary (#F97316)
  doc.rect(0, 0, 210, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("TataDana", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Laporan Keuangan Pribadi & Arus Kas", 14, 26);
  doc.text(`Periode: ${periodLabel}`, 14, 31);

  doc.text(`Pengguna: ${user.full_name} (${user.phone_number || "Terhubung"})`, 130, 26);
  doc.text(`Dicetak: ${formatDateWIB(new Date(), true)}`, 130, 31);

  // Summary Metrics
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((t) => {
    if (t.type === "income") totalIncome += t.amount;
    if (t.type === "expense") totalExpense += t.amount;
  });
  const netCashflow = totalIncome - totalExpense;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Ringkasan Keuangan", 14, 48);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Pemasukan  : ${formatRupiah(totalIncome)}`, 14, 56);
  doc.text(`Total Pengeluaran: ${formatRupiah(totalExpense)}`, 80, 56);
  doc.text(`Arus Kas Bersih  : ${formatRupiah(netCashflow)}`, 146, 56);

  // Transaction Table Rows
  const tableData = transactions.map((t) => {
    const w = wallets.find((w) => w.id === t.wallet_id);
    const c = categories.find((c) => c.id === t.category_id);
    return [
      formatDateWIB(t.date, false),
      t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer",
      c?.name || (t.type === "income" ? "Pemasukan" : "-"),
      w?.name || "Dompet",
      t.notes || "-",
      `${t.type === "expense" ? "-" : "+"}${formatRupiah(t.amount)}`,
    ];
  });

  autoTable(doc, {
    startY: 64,
    head: [["Tanggal", "Tipe", "Kategori", "Dompet", "Catatan", "Nominal"]],
    body: tableData,
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  // Footer note
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Dihasilkan otomatis oleh TataDana Fintech Platform • https://tatadana.id",
    14,
    pageHeight - 10
  );

  return doc.output("blob");
}

/**
 * Generate Excel (.xlsx) file for TataDana transactions
 */
export async function generateExcelReport(
  user: UserProfile,
  transactions: Transaction[],
  wallets: Wallet[],
  categories: Category[],
  periodLabel: string
): Promise<Blob> {
  const XLSX = await import("xlsx");

  const rows = transactions.map((t, idx) => {
    const w = wallets.find((w) => w.id === t.wallet_id);
    const c = categories.find((c) => c.id === t.category_id);
    return {
      No: idx + 1,
      Tanggal: formatDateWIB(t.date, true),
      Tipe: t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer",
      Kategori: c?.name || "-",
      Dompet: w?.name || "-",
      Nominal: t.amount,
      Catatan: t.notes || "",
      Sumber: t.source,
      Merchant: t.merchant_name || "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi TataDana");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
