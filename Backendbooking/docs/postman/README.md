# Panduan Postman API Collection — Smart Space Booking

Dokumen ini berisi petunjuk import dan pengujian terpadu (chained testing workflow) untuk seluruh endpoint RESTful API Backend Smart Space Booking (UKK Paket B) menggunakan Postman.

---

## 1. Berkas Collection & Environment

Tersedia berkas siap pakai di folder `docs/postman/`:
1. `Smart-Space-Booking.postman_collection.json` — Koleksi seluruh 46 endpoint runtime dengan skenario pengujian bertahap, script ekstraksi variabel otomatis, dan contoh respon lengkap.
2. `Local.postman_environment.example.json` — Template variabel environment lokal yang mendukung request chaining otomatis.

---

## 2. Alur Pengujian Terpadu (Chained Execution Workflow)

Collection ini dirancang agar dapat dijalankan secara manual satu per satu ataupun menggunakan **Postman Collection Runner** secara otomatis:

```text
[00 - System] Root & Health Check
       ↓
[01 - Authentication] Register Admin Space & Member -> Ekstraksi token, userId, ownerId, memberId
       ↓
[02 - Space Master] Admin Tambah & Update Ruangan -> Ekstraksi spaceId
       ↓
[03 - Public Catalog] Publik Telusuri Katalog & Cek Ketersediaan
       ↓
[04 - Promotion Master] Admin Tambah & Update Diskon -> Ekstraksi discountId
       ↓
[05 - Public Promotions] Publik Cek Promo Aktif & Validasi Kupon
       ↓
[06 - Member Reservations] Member Buat Booking & Cek E-Ticket -> Ekstraksi reservationId, bookingCode, qrToken
       ↓
[07 - Admin Operations] Verifikasi QR Code, Check-In, Check-Out, dan Update Status
       ↓
[08 - Admin Members] Assisted Registration & List Member ber-scope reservasi
       ↓
[09 - Financial Reports] Rekapitulasi Laporan Finansial Bulanan
       ↓
[10 - Media Uploads] Upload Foto Member, Space, dan Media Umum
       ↓
[11 - Negative & Security Tests] Validasi pencegahan double booking (409), tolak hapus member global (409), dan proteksi hak akses (401/403)
```

---

## 3. Cara Menggunakan di Postman

1. Buka aplikasi **Postman**.
2. Klik tombol **Import**, lalu pilih berkas `Smart-Space-Booking.postman_collection.json` dan `Local.postman_environment.example.json`.
3. Pilih active environment: **Smart Space Booking (Local Dev - Chained)**.
4. Jalankan request secara berurutan mulai dari folder `00 - System` hingga `11 - Negative & Security Tests`.
5. Script pengujian pada setiap request create/login akan **secara otomatis mengisi variabel environment** (`adminToken`, `memberToken`, `spaceId`, `discountId`, `reservationId`, dll) tanpa perlu copy-paste manual.
6. Untuk pengujian upload file di folder `10 - Media Uploads`, pilih file gambar `.jpg`/`.png` lokal di komputer Anda pada tab `Body -> form-data -> file`.
