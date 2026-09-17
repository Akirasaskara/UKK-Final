# Panduan Postman API Collection — Smart Space Booking

Dokumen ini berisi petunjuk import dan pengujian manual API Backend Smart Space Booking (UKK Paket B) menggunakan Postman.

---

## 1. Berkas Collection & Environment

Tersedia berkas siap pakai di folder `docs/postman/`:
1. `Smart-Space-Booking.postman_collection.json` — Koleksi seluruh request API.
2. `Local.postman_environment.example.json` — Template variabel environment lokal.

---

## 2. Cara Menggunakan

1. Buka aplikasi **Postman**.
2. Klik tombol **Import**, lalu pilih kedua berkas JSON di atas.
3. Pilih environment **Smart Space Booking (Local Dev)**.
4. Jalankan alur pengujian berurutan:
   - **Step 1:** Registrasi Admin Space & Member.
   - **Step 2:** Login untuk mendapatkan Bearer Access Token.
   - **Step 3:** Salin token ke variabel environment `adminToken` dan `memberToken`.
   - **Step 4:** Buat Space & Promo diskon baru via Admin.
   - **Step 5:** Cek Availability & Buat Reservasi via Member.
   - **Step 6:** Ambil E-Ticket & QR code payload.
   - **Step 7:** Verifikasi QR Ticket dan lakukan Check-In / Check-Out via Admin.
   - **Step 8:** Buka Laporan Pendapatan Bulanan.
