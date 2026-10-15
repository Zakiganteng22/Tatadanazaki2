# TataDana — Personal Finance SaaS & Telegram Bot Integration

> **Tagline**: *Catat keuangan semudah chat — langsung dari Telegram kamu.*

TataDana adalah platform Software-as-a-Service (SaaS) manajemen keuangan pribadi pasar Indonesia yang terintegrasi secara *real-time* dengan Telegram Bot (@TataDanaBot) dan didukung oleh database Supabase (PostgreSQL).

---

## 🌟 Fitur Utama

1. **Integrasi Telegram Bot Multi-Modal (Inti Produk)**:
   - **Input Teks Bahasa Alami**: Parsing denominasi santai Indonesia (`15rb`, `1.5jt`, `500k`, `30 rebu`) menjadi data terstruktur JSON `{ jenis, nominal, kategori, catatan }`.
   - **Input Pesan Suara (Voice Note)**: Transkripsi audio STT otomatis (maksimal 60 detik) dengan respons format transkrip `🎙️ Transkrip: "[hasil]"`.
   - **Input Foto Struk (Paket Pro)**: Pemindaian struk belanja dengan Vision OCR yang memecah transaksi menjadi beberapa item detail (nama item, qty, harga, kategori).
   - **Format Reply Standar**: Format pengeluaran & pemasukan lengkap dengan visual progress bar (`████░░░░ 78%`), sisa budget, dan motivasi keuangan.
   - **Daftar Perintah Cepat**: `/saldo`, `/hari ini`, `/minggu ini`, `/bulan ini`, `/budget`, `/sheet`, `/bantuan`.
   - **Built-in Telegram Bot Simulator**: Pengujian interaktif langsung di browser tanpa memerlukan tunnel lokal.

2. **Dashboard Web App Modern (Orange & Putih Fintech)**:
   - **Multi-Wallet**: Dukungan banyak rekening & dompet (Tunai, BCA, Mandiri, GoPay, OVO) dengan opsi menentukan 1 dompet default untuk Telegram.
   - **Budgeting Realtime**: Alokasi limit bulanan per kategori dengan indikator visual dan peringatan otomatis saat mencapai 80% dan 100%.
   - **Statistik & Visualisasi**: 4 kartu metrik utama, diagram lingkaran kategori, perbandingan arus kas 6 bulan, dan garis tren pengeluaran harian.
   - **Laporan & Ekspor In-App**: Tabel transaksi sortable, multi-filter & search, serta generator file PDF dan Excel (.xlsx) on-demand dengan riwayat tersimpan.

3. **Admin Console & Superadmin**:
   - **Mode Impersonasi**: Masuk ke tampilan akun pengguna mana pun secara instan tanpa perlu password.
   - **Manajemen AI Multi-Provider**: Pengaturan Google Gemini 1.5 Flash, OpenAI GPT-4o Mini, dan DeepSeek V3 dalam mode *Single* atau *Failover (Paralel)*.
   - **Monitoring & Log AI**: Audit latensi, token terpakai, dan diagnosis error pemanggilan AI.
   - **Manajemen Pembayaran**: Verifikasi Midtrans (QRIS/VA) dan persetujuan transfer manual.
   - **Audit Log Privasi**: Pencatatan riwayat setiap kali admin melihat data transaksi pengguna demi perlindungan privasi.

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat
- Node.js v20+
- npm v10+

### 2. Instalasi & Menjalankan Server
```bash
# Masuk ke direktori proyek
cd tatadana

# Install dependensi (wajib setelah download dari GitHub)
npm install

# Jalankan server produksi
npm run start
# Atau mode development:
npm run dev
```
Akses aplikasi melalui browser di: `http://localhost:3000`

### 3. Rute Halaman
- **Landing Page**: `http://localhost:3000/`
- **Register & Onboarding AI**: `http://localhost:3000/register`
- **Login**: `http://localhost:3000/login`
- **Dashboard Beranda**: `http://localhost:3000/dashboard`
- **Transaksi**: `http://localhost:3000/dashboard/transaksi`
- **Laporan & Export**: `http://localhost:3000/dashboard/laporan`
- **Budget**: `http://localhost:3000/dashboard/budget`
- **Wallet**: `http://localhost:3000/dashboard/wallet`
- **Settings & Bot Link**: `http://localhost:3000/dashboard/settings`
- **Superadmin Console**: `http://localhost:3000/admin`
- **Webhook Endpoint**: `http://localhost:3000/api/telegram/webhook`
- **Test Connection**: `http://localhost:3000/api/telegram/test-connection`

---

## 🗄️ Skema Database Supabase

Seluruh skema database telah didefinisikan secara rapi di folder `supabase/migrations/`:
1. `20261013000000_tatadana_core_schema.sql` (Tabel profil, dompet, kategori, budget, transaksi, item struk, telegram, payment, export)
2. `20261013000001_tatadana_seed_defaults.sql` (Trigger otomatis handle_new_user dan sinkronisasi saldo dompet)
3. `20261013000002_tatadana_storage_buckets.sql` (Konfigurasi storage privat bucket tatadana-exports dan tatadana-receipts)

