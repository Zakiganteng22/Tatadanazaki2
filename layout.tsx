import type { Metadata } from "next";
import "./globals.css";
import { AppDataProvider } from "@/context/AppDataContext";

export const metadata: Metadata = {
  title: "TataDana — Catat Keuangan Semudah Chat Langsung dari Telegram",
  description:
    "Aplikasi manajemen keuangan pribadi terintegrasi Telegram Bot. Catat pemasukan, pengeluaran & struk dengan bahasa natural langsung dari chat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="font-sans antialiased min-h-screen flex flex-col bg-[#FDFCFB] text-slate-800">
        <AppDataProvider>
          {children}
        </AppDataProvider>
      </body>
    </html>
  );
}
