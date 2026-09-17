# Project Brief — Smart Space Booking

## 1. Status dokumen

- **Actual state:** hanya dokumen kebutuhan/rancangan yang tersedia; implementasi aplikasi dan database belum dapat diverifikasi.
- **REQUIRED:** backend menyediakan RESTful API kategori Backend sesuai Bagian III soal UKK Paket B.
- **DESIGN DECISION:** rancangan diarahkan sebagai modular monolith agar scope UKK dapat diselesaikan tanpa kompleksitas terdistribusi.

## 2. Latar belakang

Pengelola coworking space membutuhkan layanan pemesanan ruangan dan workstation secara online. Sistem harus mengurangi proses manual ketika member mencari slot, menghitung tarif dan promo, memperoleh bukti reservasi, serta menjalani check-in/check-out. Pengelola membutuhkan katalog, kontrol reservasi, dan rekap pendapatan dalam satu boundary data yang aman.

## 3. Problem statement

Tanpa sistem terpusat:

1. ketersediaan space sulit dipercaya dan rentan double booking;
2. harga/promo dapat dihitung tidak konsisten;
3. status reservasi dan proses kedatangan tidak terlacak;
4. member tidak memiliki histori dan e-ticket yang konsisten;
5. pengelola tidak memiliki rekap transaksi per bulan/tipe space;
6. pada skenario App Maker, data antar-tenant dapat bercampur bila tenant scope tidak ditegakkan.

## 4. Sasaran produk

| ID | Sasaran |
|---|---|
| OBJ-001 | Menyediakan katalog dan availability space yang akurat. |
| OBJ-002 | Membuat reservasi secara atomik dengan kalkulasi harga server-side. |
| OBJ-003 | Menegakkan lifecycle `belum_dikonfirm`, `disetujui`, `aktif`, `selesai`, `dibatalkan`. |
| OBJ-004 | Menyediakan e-ticket dan QR yang aman untuk alur operasional. |
| OBJ-005 | Memberi admin kontrol terhadap profil, member, space, diskon, reservasi, dan laporan. |
| OBJ-006 | Menjaga autentikasi, role, ownership, dan—jika digunakan—isolasi tenant. |
| OBJ-007 | Menyediakan kontrak OpenAPI, migration, test, health check, dan prosedur operasi yang dapat diverifikasi. |

## 5. Aktor

### Member/Pengunjung

Mendaftar dan login; melihat tipe, detail, fasilitas, foto, kapasitas, harga, dan availability; memakai promo; membuat serta membatalkan reservasi sesuai state; melihat status/histori; mencetak e-ticket.

### Admin Pengelola Space

Mendaftar dan login; mengelola profil coworking; CRUD member, space, dan diskon; melihat serta memfilter reservasi; mengonfirmasi status; check-in/check-out; melihat laporan pendapatan.

### App Maker/Guru-Penguji

- **REQUIRED untuk kompatibilitas kontrak soal:** App Maker memperoleh `app_key` untuk isolasi data ujian.
- **OPEN QUESTION:** role dan autentikasi Guru/Penguji belum aman/tegas dalam sumber; endpoint daftar maker tidak boleh diasumsikan aman untuk produksi.

## 6. Ruang lingkup

### In scope

- 50 endpoint pada [Requirements Traceability](requirements-traceability.md).
- Registrasi/login multi-role dan profil.
- Katalog, availability, CRUD administrasi, promo, reservasi, e-ticket, status, check-in/out, laporan, upload foto.
- Database relational, constraint, index, migration, seed nonproduksi.
- OpenAPI/Postman, validation, security controls, observability, health/readiness, dan deployment plan.

### Out of scope

- Payment gateway dan bukti pembayaran aktual.
- Notifikasi email/SMS/WhatsApp.
- Kalender berulang, waitlist, membership subscription, invoice pajak.
- Multi-currency.
- Microservice, message broker, atau distributed cache.
- Aplikasi web/mobile pada kategori Backend.

### OPTIONAL

- Audit log perubahan status.
- Endpoint verifikasi QR khusus.
- Signed/private media delivery.
- Idempotency key standar untuk operasi mutasi.

## 7. Nilai bisnis dan indikator keberhasilan

| ID | Indikator | Cara verifikasi |
|---|---|---|
| KPI-001 | Tidak ada dua reservasi pemblokir pada space dan interval yang beririsan | integration test dua transaksi konkuren |
| KPI-002 | Harga, diskon, dan total dapat direkonsiliasi | unit/integration test formula dan fixture laporan |
| KPI-003 | Tidak ada akses lintas member/admin/tenant | negative authorization matrix |
| KPI-004 | Seluruh 50 endpoint terdokumentasi dan dapat diuji | OpenAPI lint dan Postman/API suite |
| KPI-005 | Histori tetap valid setelah master data berubah/diarsipkan | snapshot dan archive tests |
| KPI-006 | Artefak dapat dibuild dan dimigrasi dari DB kosong | CI build dan migration test |

Target angka latency, availability, dan volume data belum diberikan. Target RTO/RPO dilacak sebagai **OPEN QUESTION `OQ-011`** dengan Product Owner + Operations Owner dan closure criteria pada [Decisions & Open Questions](decisions-and-open-questions.md).

## 8. Batasan dan invariant utama

- **REQUIRED:** nilai uang dalam integer IDR; durasi minimal 1 jam; tanggal/jam mengikuti format sumber.
- **REQUIRED:** tipe space hanya `desk`, `meeting_room`, `private_office`.
- **REQUIRED:** status hanya `belum_dikonfirm`, `disetujui`, `aktif`, `selesai`, `dibatalkan`.
- **REQUIRED:** baseline ERD mempertahankan tabel/field dari transkripsi pengguna.
- **DESIGN DECISION:** satu reservasi memiliki tepat satu `detail_reservasi`; enforcement memakai FK unik dan transaksi.
- **DESIGN DECISION:** availability endpoint bersifat informatif; POST reservasi selalu memeriksa konflik lagi secara atomik.
- **ASSUMPTION:** interval waktu setengah-terbuka `[mulai, selesai)` sehingga booking yang bersentuhan tepat di batas tidak overlap.
- **OPEN QUESTION:** jam operasional, durasi maksimum, timezone bisnis, aturan cancel, dan pembulatan diskon harus disetujui.

## 9. Risiko utama

1. Kontrak sumber memuat konflik keamanan pada `/api/maker/list`, upload tanpa bearer, dan QR yang mencantumkan app key.
2. ERD baseline belum memiliki field tenant, kode booking, snapshot harga lengkap, timestamp, atau data check-in/out.
3. `reservasi.id_owner` dapat berbeda dari owner `space` bila tidak divalidasi.
4. Availability rentan race jika hanya dicek di aplikasi.
5. Hard delete master data dapat merusak histori.
6. Istilah realisasi pendapatan tidak didukung payment gateway.

Mitigasi dirinci pada [Database Design](database-design.md), [Business Rules](business-rules.md), dan [Security & Validation](security-and-validation.md).

## 10. Dependensi keberhasilan

- keputusan stack/DBMS dan business timezone;
- kontrak OpenAPI final;
- kebijakan tenant dan matriks otorisasi final;
- migration yang repeatable;
- storage media per environment;
- test data deterministik dan test concurrency;
- keputusan keamanan sebelum deployment produksi.

## 11. Kriteria selesai tingkat proyek

Proyek baru dapat dinyatakan selesai bila semua requirement wajib di [PRD](PRD.md) memiliki implementasi dan bukti test, seluruh 50 endpoint sesuai OpenAPI, migration dari DB kosong lulus, tidak ada temuan Blocker/High, backup/restore dan rollback tervalidasi untuk target produksi, serta dokumentasi cara menjalankan tidak memuat secret.