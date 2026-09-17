# Product Requirements Document (PRD)

## 1. Status, sumber, dan konvensi

Dokumen ini mendefinisikan target produk; bukan klaim implementasi.

- **Actual state:** belum ada aplikasi/API/database yang dapat diverifikasi.
- **REQUIRED:** berasal dari soal UKK atau instruksi pengguna.
- **DESIGN DECISION:** proposal yang diperlukan untuk konsistensi/keamanan.
- **ASSUMPTION:** default aman yang harus dikonfirmasi.
- **OPTIONAL:** bukan syarat minimum.
- **OPEN QUESTION:** keputusan belum final.

ID `PRD-*` bersifat stabil. ID tidak digunakan ulang ketika requirement dihapus; statusnya diubah menjadi deprecated dan penggantinya ditautkan.

## 2. Tujuan dan non-tujuan

Tujuan: menyediakan backend reservasi coworking yang akurat, aman, dapat diuji, dan kompatibel dengan kontrak 50 endpoint. Non-tujuan: payment gateway, notifikasi, subscription, multi-currency, microservice, dan UI kategori lain.

## 3. Functional requirements

### 3.1 Akun dan tenant

| ID | Requirement | Prioritas |
|---|---|---|
| PRD-ACT-001 | App Maker dapat register/login, melihat profil dan statistik tenant sesuai kontrak. | REQUIRED |
| PRD-ACT-002 | Data bisnis diisolasi berdasarkan App Maker/tenant jika mode kontrak panitia diterapkan. | REQUIRED |
| PRD-ACT-003 | User dapat register sebagai `member` dengan field sumber dan login. | REQUIRED |
| PRD-ACT-004 | User dapat register sebagai `admin_space` dengan profil owner dan login. | REQUIRED |
| PRD-ACT-005 | User terautentikasi dapat membaca profilnya tanpa hash/secret. | REQUIRED |
| PRD-ACT-006 | Daftar App Maker hanya tersedia bagi Guru/Penguji terautentikasi dan diredaksi. | DESIGN DECISION |

### 3.2 Katalog, owner, member, dan space

| ID | Requirement | Prioritas |
|---|---|---|
| PRD-CAT-001 | Client dapat melihat tiga tipe: `desk`, `meeting_room`, `private_office`. | REQUIRED |
| PRD-CAT-002 | Client dapat melihat katalog/detail space dengan foto, kapasitas, fasilitas/deskripsi, harga, dan owner. | REQUIRED |
| PRD-CAT-003 | Client dapat memeriksa availability berdasarkan space, tanggal, jam mulai, dan durasi. | REQUIRED |
| PRD-ADM-001 | Admin dapat melihat/mengubah profil coworking miliknya. | REQUIRED |
| PRD-ADM-002 | Admin dapat CRUD member dalam scope otorisasinya. | REQUIRED |
| PRD-ADM-003 | Admin dapat CRUD space miliknya. | REQUIRED |
| PRD-ADM-004 | Delete tidak boleh merusak histori reservasi. | DESIGN DECISION |

### 3.3 Diskon

| ID | Requirement | Prioritas |
|---|---|---|
| PRD-DSC-001 | Client dapat melihat promo aktif, memeriksa kode, dan melihat detail. | REQUIRED |
| PRD-DSC-002 | Admin dapat CRUD diskon dengan kode, persen 1–100, awal, dan akhir. | REQUIRED |
| PRD-DSC-003 | Promo hanya berlaku dalam periode dan owner/tenant yang sama; server menjadi sumber kalkulasi. | DESIGN DECISION |

### 3.4 Reservasi

| ID | Requirement | Prioritas |
|---|---|---|
| PRD-RSV-001 | Member membuat reservasi dengan `id_space`, tanggal, jam, durasi, dan promo opsional. | REQUIRED |
| PRD-RSV-002 | Sistem menghitung jam selesai, harga awal, potongan, dan total bayar server-side. | REQUIRED |
| PRD-RSV-003 | Sistem mencegah overlap secara atomik, termasuk request konkuren. | REQUIRED |
| PRD-RSV-004 | Satu reservasi memiliki tepat satu detail reservasi. | DESIGN DECISION |
| PRD-RSV-005 | Member melihat daftar/status, detail, dan histori berdasarkan bulan/tahun. | REQUIRED |
| PRD-RSV-006 | Member hanya dapat membatalkan reservasinya pada state yang diizinkan. | REQUIRED |
| PRD-RSV-007 | Admin melihat/filter reservasi miliknya berdasarkan bulan, tahun, status, space, tanggal. | REQUIRED |
| PRD-RSV-008 | Admin mengonfirmasi status dan melakukan check-in/check-out sesuai state machine. | REQUIRED |
| PRD-RSV-009 | Retry mutasi tidak menimbulkan duplikasi atau state korup. | DESIGN DECISION |

### 3.5 Ticket, laporan, media

| ID | Requirement | Prioritas |
|---|---|---|
| PRD-TKT-001 | Member pemilik/admin berwenang dapat memperoleh e-ticket/nota dengan kode booking dan QR. | REQUIRED |
| PRD-TKT-002 | QR tidak mengandung app key, JWT, atau PII berlebih. | DESIGN DECISION |
| PRD-RPT-001 | Admin memperoleh rekap bulanan dan distribusi pendapatan per tipe space. | REQUIRED |
| PRD-RPT-002 | Endpoint `reports/income` menjadi alias konsisten laporan income. | REQUIRED |
| PRD-MED-001 | Sistem menerima upload gambar general/space/member sesuai tipe, ukuran, dan otorisasi. | REQUIRED |

## 4. User stories dan acceptance criteria

### US-MEM-001 — Registrasi member

**Sebagai** pengunjung, **saya ingin** mendaftar agar dapat memesan space.

- Given tenant context valid dan username belum digunakan, When payload `username`, `password`, `nama_member`, `instansi`, `alamat`, `telp`, serta `foto` opsional valid dikirim, Then user dan profil member dibuat atomik dan response tidak memuat password/hash.
- Given username duplikat termasuk dua request konkuren, When registrasi diproses, Then hanya satu berhasil dan lainnya gagal konsisten.
- Given pembuatan profil gagal, When transaksi selesai, Then tidak ada user orphan.

### US-MEM-002 — Menemukan space tersedia

**Sebagai** member, **saya ingin** melihat katalog dan availability agar dapat memilih slot.

- Given filter tipe/search valid, When katalog diminta, Then hasil dibatasi, diurutkan deterministik, dan hanya scope tenant yang benar.
- Given slot tidak beririsan dengan reservasi pemblokir, When availability dicek, Then `available=true` dan estimasi berasal dari harga server.
- Given availability sempat true tetapi slot diambil sebelum booking, When POST reservasi dilakukan, Then booking ditolak; pre-check tidak menjamin lock.

### US-MEM-003 — Membuat reservasi

**Sebagai** member, **saya ingin** memesan space dengan promo agar memperoleh total yang benar.

- Given space/promo valid dan slot bebas, When request valid dibuat, Then satu reservasi + satu detail dibuat dalam transaksi dengan status `belum_dikonfirm`.
- Given interval overlap, When booking dibuat, Then response konflik dan tidak ada partial row.
- Given `id_diskon` dan `kode_promo` berbeda, When request dibuat, Then request ditolak.
- Given harga master berubah setelah booking, When reservasi lama dibaca, Then snapshot finansial tidak berubah.

### US-MEM-004 — Histori, pembatalan, dan e-ticket

- Given member login, When daftar/detail/history diminta, Then hanya reservasi miliknya terlihat.
- Given reservasi `belum_dikonfirm` atau `disetujui`, When member membatalkan, Then status menjadi `dibatalkan` sesuai policy final.
- Given reservasi `aktif`, `selesai`, atau sudah `dibatalkan`, When cancel diminta, Then ditolak tanpa perubahan.
- Given e-ticket berwenang, When tiket diminta, Then kode booking/QR tersedia tanpa secret tenant.

### US-ADM-001 — Mengelola master data

- Given admin login, When CRUD profile/member/space/diskon dilakukan, Then hanya resource dalam scope admin/tenant berubah.
- Given space direferensikan histori, When delete diminta, Then resource diarsipkan atau operasi dibatasi; histori tidak rusak.
- Given payload harga/kapasitas/persen/periode invalid, When disimpan, Then API menolak dan DB constraint tetap utuh.

### US-ADM-002 — Operasi reservasi

- Given status `belum_dikonfirm`, When admin menyetujui, Then status menjadi `disetujui`.
- Given status `disetujui`, When check-in valid, Then status `aktif` dan timestamp dicatat sekali.
- Given status `aktif`, When check-out valid, Then status `selesai` dan timestamp dicatat sekali.
- Given admin owner lain atau transisi ilegal, When operasi diminta, Then ditolak.

### US-ADM-003 — Laporan

- Given bulan/tahun valid, When laporan diminta, Then agregat hanya mencakup owner/tenant dan tanggal bisnis pada periode itu.
- Given fixture transaksi, When laporan dihitung, Then total global sama dengan jumlah rincian tipe dan formula [Business Rules](business-rules.md).
- Given month 0/13 atau year invalid, When diminta, Then 400.

### US-SEC-001 — Isolasi dan upload aman

- Given token tenant A dan header tenant B, When request dibuat, Then ditolak.
- Given member meminta object member lain, When ID ditebak, Then data tidak bocor.
- Given file berekstensi gambar tetapi magic bytes bukan gambar/oversize, When upload, Then ditolak sebelum dipublikasi.

## 5. User paths

### PATH-MEM-001 — Pemesanan

`register → login → list/detail space → availability → promo check → create reservasi → lihat status → e-ticket → hadir/check-in admin → selesai/check-out admin → history`

Jalur gagal wajib: credential salah, space hilang/diarsipkan, promo invalid, overlap, timeout/retry, unauthorized e-ticket.

### PATH-MEM-002 — Pembatalan

`login → my reservations → pilih reservasi → cancel → status dibatalkan` dengan penolakan state ilegal.

### PATH-ADM-001 — Setup dan operasi

`register admin → login → update profile → create/upload space → create promo → lihat reservasi → approve → scan/input QR → inspect e-ticket (API-EP-022) → check-in (API-EP-044) → check-out → laporan`. Inspeksi e-ticket lalu EP-044 adalah jalur wajib dalam 50 operasi; endpoint QR verify khusus tetap OPTIONAL.

### PATH-ADM-002 — CRUD member

`login admin → list/search → create → detail → update → archive/delete` dengan rollback jika user/profile write gagal.

## 6. NFR dan metode verifikasi

| ID | Requirement | Target/ketentuan | Verifikasi |
|---|---|---|---|
| PRD-NFR-001 | Correctness | invariant booking/harga/state dijaga service+DB | unit + DB concurrency test |
| PRD-NFR-002 | Security | tidak ada Blocker/High; auth/ownership/tenant/upload aman | SAST/DAST/dependency + API negative tests |
| PRD-NFR-003 | Performance | pagination wajib; p95 target belum ditetapkan | load test + query plan |
| PRD-NFR-004 | Reliability | transaksi rollback; timeout; graceful shutdown | fault injection/integration/ops test |
| PRD-NFR-005 | Availability | liveness/readiness; target SLA belum ditetapkan | staging health/failover test |
| PRD-NFR-006 | Scalability | stateless API, external DB/storage, bounded query | multi-instance smoke/load test |
| PRD-NFR-007 | Maintainability | strict types, module boundary, OpenAPI, migration | lint/typecheck/architecture review |
| PRD-NFR-008 | Observability | request ID, structured logs/metrics tanpa secret | log/metric assertions |
| PRD-NFR-009 | Recoverability | backup/restore dan rollback teruji; target RTO/RPO dikelola oleh `OQ-011` (owner: Product Owner + Operations Owner; tutup saat target angka, retention, approval, dan restore drill terhadap target tercatat) | restore drill |
| PRD-NFR-010 | Compatibility | 50 endpoint dan envelope sumber terjaga | OpenAPI/Postman contract suite |

## 7. Data and API requirements

- Baseline field/enum tidak dihapus atau diganti nama secara diam-diam.
- Database usulan wajib mengikuti [Database Design](database-design.md).
- Aturan domain wajib mengikuti [Business Rules](business-rules.md).
- Endpoint menggunakan DTO; entity ORM bukan response contract.
- Collection tidak boleh unbounded: `page`/`limit` opsional dengan default 1/20 dan maksimum 100; body mempertahankan array sumber-compatible dan response wajib mengirim `X-Page`, `X-Per-Page`, `X-Total-Count`.
- Error tidak memuat stack, SQL, password, token, raw app key, lookup digest/ciphertext, atau PII yang tidak perlu; raw app key hanya diizinkan pada sukses maker register/login/me.

## 8. Definition of Done

Sebuah requirement selesai hanya jika:

1. implementasi, migration/constraint, OpenAPI, dan serializer tersedia;
2. authorization dan tenant scope diuji positif/negatif;
3. validation/boundary/failure/concurrency test terkait lulus;
4. lint, typecheck, unit, integration, API/E2E, dan production build lulus;
5. log/metric/error behavior diverifikasi;
6. backward compatibility dan migration/rollback risk direview;
7. traceability `PRD-* → API-EP-* → TST-*` diperbarui;
8. tidak ada Blocker/High terbuka;
9. bukti CI/test tersedia tanpa secret/PII.

## 9. Open questions

- **OPEN QUESTION:** apakah App Maker/multi-tenancy wajib untuk backend peserta atau khusus API panitia?
- **OPEN QUESTION:** timezone bisnis, jam operasional, durasi maksimum, booking tanggal lampau, dan grace period check-in.
- **OPEN QUESTION:** pembulatan diskon dan arti “realisasi” tanpa payment.
- **OPEN QUESTION:** `OQ-016` hanya memvalidasi default 20/maksimum 100 terhadap SLA/volume; shape body array dan tiga response header pagination telah final.
- **OPEN QUESTION:** TTL/refresh/revocation JWT dan role Guru/Penguji.
- **OPEN QUESTION:** public/private media, retention PII/media, serta endpoint verifikasi QR.
- **OPEN QUESTION:** apakah alamat/deskripsi profil owner harus ditambahkan meski tidak ada pada baseline DTO.