# Rencana Implementasi Backend

## 1. Tujuan, batasan, dan status

Rencana ini menguraikan pembangunan REST API Smart Space Booking kategori Backend berdasarkan Soal, khususnya Bagian II, Bagian III, dan Lampiran B (baris 1145-1179). Dokumen ini **tidak menyatakan implementasi telah tersedia**.

**Asumsi sementara:** satu aplikasi backend modular dan satu basis data relasional adalah pilihan paling sederhana; framework Node.js/Express, Laravel, atau NestJS diperbolehkan oleh Soal, tetapi pilihan aktual belum dikonfirmasi. S3/RDS/EC2 adalah rancangan target produksi sesuai instruksi pengguna, bukan kewajiban eksplisit Soal.

## 2. Prinsip arsitektur

- Modul: `maker`, `auth`, `tenant`, `member`, `space`, `discount`, `reservation`, `report`, `media`, `health`.
- Controller hanya mengurus HTTP/DTO; service memegang aturan bisnis; repository/ORM memegang persistence; serializer memisahkan entity DB dari response publik.
- OpenAPI menjadi kontrak eksplisit 50 endpoint; response mengikuti envelope Soal baris 227-233.
- Semua query data bisnis wajib membawa `maker_id`/tenant scope. Tenant berasal dari kredensial/header tervalidasi, bukan body klien.
- Password memakai hash adaptif; JWT memiliki expiry dan key dari secret manager. Detail refresh/revocation masih keputusan terbuka.
- Reservasi dibuat dalam transaksi. Pencegahan overlap harus ditegakkan atomik di DB/locking strategy, bukan hanya availability pre-check.
- Uang disimpan sebagai integer IDR. Snapshot harga dan potongan disimpan pada reservasi.
- Koleksi menerima `page`/`limit` opsional (default 1/20, maksimum 100), mempertahankan array sumber-compatible, mengirim `X-Page`, `X-Per-Page`, `X-Total-Count`, dan memakai sort deterministik.
- Media produksi disimpan di S3 dengan key server-generated; metadata berada di DB; kebijakan public/private masih terbuka.

## 3. Model data konseptual dan invariant

| Entitas | Data minimum | Constraint/invariant rencana |
|---|---|---|
| AppMaker | name, username, email, password_hash, app_key_hash, app_key_ciphertext, app_key_kek_version/status | username/email dan lookup hash unik; raw app key tidak pernah plaintext at rest atau dicatat ke log; decrypt hanya untuk register/login/me yang berwenang |
| User | maker_id, username, password_hash, role | unik per tenant; role `member`/`admin_space` |
| SpaceOwner | maker_id, user_id, nama_coworking, nama_pemilik, telp | satu profil per akun admin (asumsi) |
| Member | maker_id, user_id, nama, instansi, alamat, telp, foto_key | relasi user-member konsisten |
| Space | maker_id, owner_id, nama, tipe, kapasitas, harga/jam, deskripsi, foto_key | tipe enum; kapasitas > 0; harga >= 0 |
| Discount | maker_id, nama, persen, awal, akhir | nama unik per tenant; persen 1..100; akhir >= awal |
| Reservation | maker_id, member_id, space_id, discount_id?, jadwal, snapshot harga, total, status, timestamps | durasi >= 1; total nonnegatif; kode booking unik; semua FK satu tenant |

Indeks minimum: seluruh FK; `(maker_id, username)`, `(maker_id, nama_diskon)`, `(maker_id, tipe)`, pencarian reservasi `(maker_id, tanggal_reservasi, status, space_id)`, serta mekanisme DB untuk mencegah overlap jadwal aktif. Bentuk constraint overlap bergantung DBMS dan belum final.

## 4. Vertical slices

Setiap slice menghasilkan migration/constraint, DTO/validation, service, endpoint/OpenAPI, serializer, authorization, observability, serta unit/integration/API tests terkait. Status awal seluruh slice: **Direncanakan**.

### VS-00 — Fondasi proyek dan kontrak

- **Dependensi:** tidak ada.
- **Tugas:** pilih stack/DBMS; bootstrap aplikasi; validasi environment; error envelope; structured logging/redaction; request ID; OpenAPI skeleton; test harness; CI skeleton.
- **Output:** aplikasi dapat build; root/liveness/readiness; spesifikasi API memiliki API-EP-001..050.
- **Acceptance:** `REQ-OPS-001`, `REQ-CON-001`; uji `TST-CON-001..005` yang relevan lulus.
- **DoD:** lint/typecheck/unit/build terdokumentasi; tidak ada secret hard-coded.

### VS-01 — App Maker dan tenant isolation

- **Dependensi:** VS-00.
- **Tugas:** schema App Maker; registrasi/login; app key CSPRNG dengan lookup hash + authenticated ciphertext recoverable dan key rotation; middleware tenant; profil/stats/list dengan keputusan akses final.
- **Output:** API-EP-003..007 dan tenant fixture A/B.
- **Acceptance:** request lintas tenant tidak mengembalikan atau memodifikasi data; duplicate register aman terhadap race.
- **DoD:** test API, BOLA, tenant mismatch, rate limit, log redaction lulus.

### VS-02 — Autentikasi user multi-role

- **Dependensi:** VS-01.
- **Tugas:** User/Member/SpaceOwner; register member/admin; login; profile; password hashing; JWT validation; role guard.
- **Output:** API-EP-008..011.
- **Acceptance:** hanya role sah mengakses resource; password/hash tidak pernah diserialisasi.
- **DoD:** test 401/403, duplicate username, expiry, cross-tenant, transaction rollback lulus.

### VS-03 — Katalog space dan profil admin

- **Dependensi:** VS-02.
- **Tugas:** schema/index space; tipe; profil admin; CRUD space; filter/search/pagination; mapping foto URL.
- **Output:** API-EP-012, 014, 015, 025, 026, 032..036.
- **Acceptance:** hanya admin pemilik dapat mutasi; member/publik hanya melihat tenant yang benar; tipe/kapasitas/harga tervalidasi.
- **DoD:** uji CRUD, ownership, list bound, delete yang direferensikan lulus.

### VS-04 — Media

- **Dependensi:** VS-01, keputusan storage; dapat paralel dengan VS-03 setelah kontrak key disepakati.
- **Tugas:** adapter storage lokal-dev/S3-prod; validasi MIME+magic bytes+size; key aman; authorization; cleanup/compensation.
- **Output:** API-EP-048..050 dan URL media environment-aware.
- **Acceptance:** file non-gambar/traversal/oversize ditolak; tenant tidak dapat overwrite object lain.
- **DoD:** `TST-UPL-001..007` lulus; bucket tidak memakai credential statis di aplikasi.

### VS-05 — Member admin CRUD

- **Dependensi:** VS-02, opsional VS-04 untuk foto.
- **Tugas:** list/search/pagination; create/update/delete; transaksi pembuatan User+Member; aturan delete dan histori.
- **Output:** API-EP-027..031.
- **Acceptance:** invariant User-Member tetap utuh pada kegagalan parsial; password optional update di-hash.
- **DoD:** integration/API/security tests lulus; kebijakan delete terdokumentasi.

### VS-06 — Diskon

- **Dependensi:** VS-02.
- **Tugas:** schema/constraint; katalog aktif; check kode; detail; CRUD admin; clock injectable.
- **Output:** API-EP-016..018, 037..041.
- **Acceptance:** periode dan persen valid; promo tenant lain/kedaluwarsa tidak dapat digunakan.
- **DoD:** boundary waktu, duplikasi kode, 1/100%, dan authorization tests lulus.

### VS-07 — Availability dan reservasi inti

- **Dependensi:** VS-03, VS-05, VS-06.
- **Tugas:** availability; transaksi booking; overlap control; snapshot harga/promo; kode booking; idempotency decision; daftar/detail/history/cancel.
- **Output:** API-EP-013, 019..021, 023, 024.
- **Acceptance:** satu slot tidak dapat double-booking pada request konkuren; total uang benar; ownership ditegakkan.
- **DoD:** `TST-BIZ-001..010`, 012..014 dan rollback tests lulus.

### VS-08 — E-ticket dan QR

- **Dependensi:** VS-07.
- **Tugas:** serializer e-ticket; QR payload aman/non-rahasia; authorization member pemilik/admin tenant; format cetak/JSON; dukung jalur operasional scan/input lalu inspeksi EP-022 sebelum EP-044.
- **Output:** API-EP-022; endpoint QR verify khusus tetap OPTIONAL dan tidak menambah operasi wajib.
- **Acceptance:** tidak memasukkan app key atau token rahasia ke QR; object-level authorization lulus; tiket lintas owner/tenant tidak dapat dipakai menuju check-in.
- **DoD:** snapshot contract, BOLA, dan rendering/encoding test lulus.

### VS-09 — Operasi status, check-in, check-out

- **Dependensi:** VS-07.
- **Tugas:** state machine; optimistic locking/version atau row lock; timestamp audit; retry/idempotency; EP-044 memvalidasi ulang owner/tenant/state setelah inspeksi e-ticket EP-022.
- **Output:** API-EP-042..045.
- **Acceptance:** hanya transisi legal; operasi duplikat tidak membuat data inkonsisten.
- **DoD:** `TST-BIZ-011..013`, role, concurrency, filter tests lulus.

### VS-10 — Laporan

- **Dependensi:** VS-09.
- **Tugas:** definisi estimasi/realisasi; agregasi bulanan/per tipe; indeks/query plan; endpoint alias.
- **Output:** API-EP-046..047.
- **Acceptance:** agregat cocok fixture dan terisolasi per tenant; query bounded.
- **DoD:** `TST-BIZ-014..015`, performa baseline, dan contract tests lulus.

### VS-11 — Hardening dan kesiapan rilis

- **Dependensi:** VS-00..10.
- **Tugas:** CORS/header/trusted proxy/rate limit/body limit/timeouts; observability; runbook; backup/restore; Postman/Swagger export; full regression.
- **Output:** release candidate, artefak deploy immutable, dokumentasi ujian.
- **Acceptance:** seluruh `TST-GATE-001..006` terpenuhi.
- **DoD:** tidak ada Blocker/High; rollback dan restore drill menghasilkan bukti; approval release.

## 5. Urutan dependensi kritis

`VS-00 → VS-01 → VS-02 → VS-03/VS-05/VS-06 → VS-07 → VS-08/VS-09 → VS-10 → VS-11`.

VS-04 dapat berjalan setelah VS-01 dan kontrak storage ditetapkan. VS-03, VS-05, dan VS-06 dapat paralel setelah VS-02, tetapi integrasi final menunggu VS-04 bila response foto wajib.

## 6. Task register ringkas

| ID | Task | Dependensi | Output | Acceptance/DoD |
|---|---|---|---|---|
| IMP-001 | Konfirmasi stack, DBMS, kategori | - | ADR/keputusan | seluruh asumsi kritis ditutup |
| IMP-002 | Definisi OpenAPI 50 endpoint | IMP-001 | OpenAPI lint-clean | tiap API-EP terdaftar dan memiliki schema/error |
| IMP-003 | Migration baseline + seed test | IMP-001 | migration repeatable | DB kosong dapat dimigrasi; rollback risk dicatat |
| IMP-004 | Middleware auth/role/tenant | IMP-003 | guard reusable | negative matrix lulus |
| IMP-005 | Domain services per VS | IMP-002..004 | service + tests | invariant backend/DB terjaga |
| IMP-006 | Adapter storage | IMP-001, IMP-004 | local/S3 adapter | upload security tests lulus |
| IMP-007 | Observability dan health | IMP-001 | logs/metrics/checks | tanpa secret/PII; alarm dapat diuji |
| IMP-008 | CI/CD dan IaC | IMP-001 | pipeline/IaC reviewed | staging deploy, smoke, rollback teruji |
| IMP-009 | Postman/Swagger export | IMP-002, IMP-005 | artefak penilaian | 50 endpoint dapat diuji |
| IMP-010 | Full regression/DR drill | IMP-005..009 | evidence pack | semua gate lulus |

## 7. Local setup yang direncanakan

Karena runtime aktual belum dipilih, langkah lokal bersifat teknologi-netral:

1. Pasang runtime/package manager versi yang dipin proyek dan DBMS yang dipilih.
2. Salin template environment menjadi file lokal yang diabaikan VCS; jangan memasukkan nilai ke dokumentasi.
3. Jalankan DB/storage emulator atau layanan development terisolasi.
4. Install dependency dari lockfile.
5. Jalankan migration dan seed fixture nonproduksi.
6. Jalankan aplikasi; verifikasi `/`, `/health`, dokumentasi OpenAPI.
7. Jalankan lint, typecheck, unit, integration, API, dan build.

Nama environment yang diusulkan (nilai sengaja tidak dicantumkan):

- Runtime: `NODE_ENV`, `APP_ENV`, `APP_HOST`, `APP_PORT`, `APP_BASE_URL`, `TRUST_PROXY`, `LOG_LEVEL`, `REQUEST_TIMEOUT_MS`.
- Database: `DATABASE_URL` **atau** `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`, `DB_POOL_MIN`, `DB_POOL_MAX`.
- Auth: `JWT_ACCESS_SECRET`/`JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_TTL`, `PASSWORD_HASH_COST`, `APP_KEY_LOOKUP_SECRET`, `APP_KEY_KEK_ID` (reference only; material dikelola secret manager/KMS).
- CORS/rate limit: `CORS_ALLOWED_ORIGINS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`.
- Storage: `STORAGE_DRIVER`, `AWS_REGION`, `S3_BUCKET_NAME`, `S3_ENDPOINT` (lokal saja), `S3_PUBLIC_BASE_URL`, `UPLOAD_MAX_BYTES`, `UPLOAD_ALLOWED_MIME_TYPES`.
- Operasional: `HEALTH_DB_TIMEOUT_MS`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `ERROR_REPORTING_DSN` bila dipilih.

Di EC2 gunakan IAM role, bukan `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` statis. Secret produksi berada di AWS Secrets Manager/SSM dan tidak masuk `.env`, image, AMI, CI log, atau source control.

## 8. Definition of Done global

Suatu task/slice selesai hanya bila kode, migration, OpenAPI, authorization, validation, serializer, logging aman, dan test positif/negatif selesai; review disetujui; tidak ada TODO kritis; kompatibilitas migrasi dinilai; artefak dapat dibuild reproducibly; serta traceability diperbarui. “Endpoint merespons” saja bukan selesai.

## 9. Checklist penyerahan per kategori

### Backend — kategori target (Soal baris 1145-1179)

- [ ] Source code lengkap.
- [ ] SQL export **atau** migration script yang dapat dijalankan dari DB kosong.
- [ ] Seluruh API-EP-001..050 diimplementasikan sesuai kontrak final.
- [ ] Autentikasi, role, tenant isolation, dan password hashing diuji.
- [ ] Setiap endpoint diuji dengan Postman/Insomnia.
- [ ] Postman collection atau Swagger/OpenAPI export disertakan.
- [ ] Dokumen base URL, port, environment name, migrasi, seed, dan cara menjalankan; tanpa secret.

### Fullstack (bila kategori berubah; Soal baris 1111-1141)

- [ ] Web SSR tanpa konsumsi API eksternal sesuai kategori.
- [ ] Seluruh fitur Member dan Admin.
- [ ] Database/migration, validasi, hashing, dan E2E.
- [ ] Source code dan cara menjalankan.

### Frontend Web (bila kategori berubah; Soal baris 1183-1213)

- [ ] Source code web yang mengonsumsi API panitia.
- [ ] Seluruh halaman/aksi Member dan Admin terhubung ke endpoint.
- [ ] Responsif minimal laptop/tablet.
- [ ] Framework dan cara menjalankan.

### Mobile App (bila kategori berubah; Soal baris 1217-1249)

- [ ] Source code/proyek siap jalan pada Android 10+.
- [ ] Seluruh layar terhubung ke API panitia.
- [ ] Uji emulator/device.
- [ ] APK debug bila tersedia dan cara menjalankan.

### UI/UX Design (bila kategori berubah; Soal baris 1262-1290)

- [ ] Hi-fi 7 layar Member dan 9 layar Admin.
- [ ] Prototype reservasi dan check-in/check-out.
- [ ] Export PDF/PNG seluruh layar.
- [ ] Share link view/comment dan dokumen design system.

Kategori harus dipilih satu; artefak kategori lain bukan kewajiban kecuali diminta penguji.
