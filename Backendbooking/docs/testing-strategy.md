# Strategi Pengujian

## 1. Status dan ruang lingkup

Dokumen ini adalah **rencana pengujian**, bukan bukti bahwa pengujian telah dijalankan. Sumber kebutuhan adalah `Rev_Soal_UKK_2026-2027_Paket_B (1).md` (selanjutnya disebut **Soal**) dan instruksi pengguna. Cakupan utama adalah kategori Backend, tetapi checklist lintas kategori tetap dicatat agar artefak penyerahan tidak tertukar.

**Asumsi A-TST-01:** teknologi implementasi, test runner, ORM, dan DBMS belum dikonfirmasi. Nama perintah di bawah adalah kontrak yang perlu dipetakan ke script proyek aktual, bukan klaim script tersebut sudah tersedia.

## 2. Sasaran mutu dan gerbang kelulusan

| ID | Sasaran | Gerbang minimum |
|---|---|---|
| TST-GATE-001 | Kontrak 50 endpoint | API-EP-001..050 masing-masing memiliki uji sukses, validasi, autentikasi/otorisasi sesuai role, tenant isolation, dan struktur envelope; seluruhnya lulus |
| TST-GATE-002 | Aturan reservasi | Tidak ada double booking pada rentang waktu yang beririsan, termasuk request konkuren |
| TST-GATE-003 | Keamanan | Tidak ada temuan Blocker/High terbuka; password tidak pernah keluar dari API/log; object-level authorization dan tenant isolation lulus |
| TST-GATE-004 | Data | Migrasi dari DB kosong dan constraint/integritas lulus; backup dapat direstore pada lingkungan terisolasi |
| TST-GATE-005 | Build/operasi | typecheck, lint, unit, integration, API/E2E, build, smoke test, dan health/readiness test lulus |
| TST-GATE-006 | Dokumentasi ujian | Postman collection atau Swagger/OpenAPI tervalidasi dan dapat dipakai menguji seluruh endpoint |

Tidak ditetapkan target coverage arbitrer sebagai pengganti pengujian perilaku. Setelah stack terkonfirmasi, coverage branch untuk domain kritis (reservasi, diskon, status, otorisasi, tenant) ditargetkan minimal 90%; bagian lain minimal 80%, sambil tetap mewajibkan skenario di dokumen ini.

## 3. ID suite dan lapisan pengujian

| ID | Lapisan | Fokus | Dependensi |
|---|---|---|---|
| TST-UNIT-001 | Unit | kalkulasi jam selesai, harga kotor, diskon, total bayar | tanpa jaringan/DB |
| TST-UNIT-002 | Unit | state machine reservasi dan aturan pembatalan/check-in/check-out | tanpa jaringan/DB |
| TST-UNIT-003 | Unit | validasi tanggal, waktu, durasi, tipe space, persentase | tanpa jaringan/DB |
| TST-UNIT-004 | Unit | normalisasi kode promo, username, telepon, nama file | tanpa jaringan/DB |
| TST-INT-001 | Integrasi DB | constraint unik/FK/check/index, transaksi, rollback | DB disposable |
| TST-INT-002 | Integrasi DB | overlap reservation dan konkurensi | DB disposable, dua koneksi |
| TST-INT-003 | Integrasi storage | upload, pembacaan, penghapusan, kegagalan S3 | bucket/pengganti lokal terisolasi |
| TST-API-001 | API contract | API-EP-001..050 dan envelope response | aplikasi + DB disposable |
| TST-SEC-001 | Security | authn/authz, BOLA, tenant isolation, abuse, upload | aplikasi + DB + storage disposable |
| TST-E2E-001 | E2E member | register → login → katalog → availability → promo → reservasi → status/history → e-ticket → cancel sesuai state | sistem terintegrasi |
| TST-E2E-002 | E2E admin | register/login → profil → CRUD → konfirmasi → check-in/out → laporan | sistem terintegrasi |
| TST-E2E-003 | E2E App Maker | register/login → app key → data tenant → stats | sistem terintegrasi |
| TST-OPS-001 | Operasional | startup, liveness, readiness, graceful shutdown, timeout | artefak deploy |
| TST-DR-001 | Disaster recovery | backup RDS, object S3, restore dan verifikasi konsistensi | lingkungan restore terisolasi |
| TST-DOC-001 | Dokumentasi | OpenAPI lint dan Postman smoke seluruh endpoint | spesifikasi API |

## 4. Matriks skenario wajib

### 4.1 Autentikasi, role, dan tenant

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| TST-SEC-002 | token hilang, rusak, kedaluwarsa, signature salah | 401; tanpa detail rahasia |
| TST-SEC-003 | member mengakses endpoint admin; admin mengakses operasi khusus member yang dilarang | 403 |
| TST-SEC-004 | token tenant A dipasangkan dengan `x-maker-key` tenant B | ditolak; tidak ada data bocor |
| TST-SEC-005 | akses ID member/space/diskon/reservasi tenant lain | 404 atau 403 secara konsisten; tidak ada enumerasi data |
| TST-SEC-006 | member membaca e-ticket/detail reservasi member lain dalam tenant sama | ditolak kecuali admin pemilik berwenang |
| TST-SEC-007 | login berulang dengan kredensial salah | rate limit/lockout sesuai keputusan keamanan; response tidak mengungkap username valid |
| TST-SEC-008 | register username/email duplikat dan race dua request | hanya satu berhasil; constraint DB tetap menjaga invariant |
| TST-SEC-009 | password pada response, exception, log, telemetry | tidak muncul; hanya hash adaptif di DB |
| TST-SEC-009A | storage/lifecycle App Maker key | DB hanya memuat unique lookup digest + authenticated ciphertext/version, bukan raw key; register/login/me mengembalikan key yang sama hanya kepada Maker sah; lookup tidak decrypt-scan; log/trace/error bersih; decrypt failure fail-closed; rotasi key teruji |
| TST-SEC-010 | `/api/maker/list` tanpa autentikasi | diuji sesuai keputusan final; secara provisional harus ditutup atau diredaksi |

### 4.2 Reservasi, waktu, uang, promo, dan status

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| TST-BIZ-001 | durasi 0, negatif, pecahan, sangat besar | 400; hanya integer minimal 1 dan batas maksimum terkonfirmasi |
| TST-BIZ-002 | format tanggal/jam invalid, tanggal lampau, `24:00`, lintas tengah malam | 400 atau perilaku terdokumentasi; tidak ada perhitungan ambigu |
| TST-BIZ-003 | booking berdampingan `[09:00,10:00)` dan `[10:00,11:00)` | tidak dianggap overlap |
| TST-BIZ-004 | overlap parsial/penuh/melingkupi booking lama | ditolak secara atomik |
| TST-BIZ-005 | dua POST reservasi simultan pada slot sama | tepat satu sukses; satu conflict/validation error |
| TST-BIZ-006 | availability dinyatakan tersedia lalu slot diambil sebelum POST | POST tetap menolak; availability bukan lock |
| TST-BIZ-007 | promo tidak ada, belum berlaku, tepat batas awal/akhir, kedaluwarsa, tenant lain | nominal benar atau ditolak |
| TST-BIZ-008 | `id_diskon` dan `kode_promo` menunjuk promo berbeda | ditolak sampai precedence dikonfirmasi |
| TST-BIZ-009 | persentase 1, 100, 0, 101; pembulatan IDR | hanya 1..100; aturan pembulatan deterministik |
| TST-BIZ-010 | harga space berubah setelah booking | snapshot `harga_per_jam` dan total reservasi lama tidak berubah |
| TST-BIZ-011 | transisi belum_dikonfirm→disetujui→aktif→selesai | sukses; timestamp check-in/out konsisten |
| TST-BIZ-012 | transisi ilegal, check-in dua kali, check-out sebelum check-in, cancel setelah aktif/selesai | ditolak tanpa perubahan parsial |
| TST-BIZ-013 | retry request setelah timeout | tidak menggandakan reservasi/check-in/check-out; strategi idempotensi harus ditetapkan |
| TST-BIZ-013A | admin scan/input tiket lalu check-in | EP-022 lebih dahulu mengembalikan e-ticket yang cocok dan terotorisasi; EP-044 baru mengubah `disetujui→aktif`; tiket lintas owner/tenant atau state salah ditolak; endpoint QR verify khusus tidak wajib |
| TST-BIZ-014 | filter month 0/13, year invalid, kombinasi tanggal, batas zona waktu | 400 dan batas kalender konsisten |
| TST-BIZ-015 | laporan bulanan | hanya status yang disepakati dihitung; total = rincian tipe; nominal integer IDR |

### 4.3 CRUD, koleksi, dan penghapusan

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| TST-DATA-001 | payload kosong/null/field ekstra/tipe salah/batas panjang | 400 dengan error aman dan deterministik |
| TST-DATA-002 | ID path non-integer, nol, negatif, tidak ada | 400/404 konsisten |
| TST-DATA-003 | delete member/space/diskon yang direferensikan reservasi | perilaku FK/soft-delete terdefinisi; histori tidak rusak |
| TST-DATA-004 | daftar kosong dan filter tanpa hasil | 200; body array source-compatible kosong (atau `data.items:[]` untuk history); header `X-Page`, `X-Per-Page`, `X-Total-Count: 0` benar |
| TST-DATA-005 | page/limit absent, nol/negatif/di atas maksimum, halaman melewati akhir | absent memakai 1/20; invalid 400 (tidak clamp diam-diam); maksimum 100; urutan deterministik dan ketiga header cocok total/query |
| TST-DATA-006 | search berisi wildcard, Unicode, string panjang, payload injeksi | tidak terjadi injection/error internal; limit diterapkan |
| TST-DATA-007 | N+1 dan payload besar | jumlah query terkontrol; tidak ada query/koleksi tak terbatas |

### 4.4 Upload

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| TST-UPL-001 | tanpa file, multipart rusak, banyak file saat hanya satu diizinkan | 400 |
| TST-UPL-002 | ekstensi gambar tetapi magic bytes non-gambar; MIME palsu; SVG/script | ditolak |
| TST-UPL-003 | ukuran tepat batas dan melewati batas | batas diterapkan sebelum konsumsi memori berlebih |
| TST-UPL-004 | nama file traversal, Unicode aneh, duplikat | key server-generated; tidak ada traversal/overwrite |
| TST-UPL-005 | user/tenant tidak berwenang | ditolak sebelum persist |
| TST-UPL-006 | DB gagal setelah upload atau S3 gagal | kompensasi/cleanup mencegah object yatim atau referensi rusak |
| TST-UPL-007 | URL object | HTTPS; akses publik/private sesuai keputusan; tidak memakai hostname localhost di produksi |

### 4.5 Envelope, error, health, dan observability

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| TST-CON-001 | sukses 200/201 | `status`, `statusCode`, `message`, `data`, `timestamp` sesuai Soal baris 227-231 |
| TST-CON-002 | error 400/401/403/404/409/413/429/500 | envelope konsisten; tidak ada stack trace, SQL, token, password, raw app key, lookup digest, atau ciphertext |
| TST-CON-003 | liveness saat proses hidup dan DB mati | liveness tetap sesuai definisi; readiness gagal |
| TST-CON-004 | readiness saat DB/storage wajib tidak siap | non-2xx agar instance tidak menerima traffic |
| TST-CON-005 | correlation/request ID | tersedia di log dan response/header tanpa PII |

## 5. Cakupan per endpoint

`requirements-traceability.md` memetakan API-EP-001..050 ke test ID. Untuk **setiap** endpoint, turunkan kasus berikut sesuai relevansi:

1. `TST-EP-<NNN>-S`: sukses dan status code.
2. `TST-EP-<NNN>-V`: body/query/path/header invalid dan boundary.
3. `TST-EP-<NNN>-A`: tanpa token, role salah, ownership/BOLA.
4. `TST-EP-<NNN>-T`: `x-maker-key` hilang/salah/cross-tenant.
5. `TST-EP-<NNN>-C`: response schema/envelope cocok OpenAPI.
6. `TST-EP-<NNN>-F`: dependency failure/rollback bila endpoint menulis data.

Pengecualian harus dicatat eksplisit, misalnya endpoint publik tidak memiliki uji token wajib tetapi tetap memiliki uji abuse dan tenant-header menurut kontrak final.

## 6. Data uji dan isolasi

- Gunakan fixture deterministik: tenant A dan B; App Maker; member A1/A2/B1; admin A/B; ketiga tipe space; promo aktif/belum aktif/kedaluwarsa; reservasi tiap status.
- Setiap test suite memakai schema/database disposable atau transaction rollback; test paralel tidak berbagi identifier.
- Waktu dikendalikan dengan injected clock; zona waktu aplikasi/DB ditetapkan eksplisit setelah keputusan dibuat.
- Password/token/app key fixture hanya dummy dan tidak boleh merupakan kredensial lingkungan nyata.
- File uji dibuat sintetis dan kecil; sertakan polyglot/magic-byte mismatch untuk security test.

## 7. Strategi otomatisasi dan CI

Urutan fail-fast yang direncanakan:

1. install dependency menggunakan lockfile;
2. secret scan dan dependency audit;
3. format check, lint, typecheck;
4. unit test;
5. migrasi DB disposable dari kosong;
6. integration/API/security test;
7. OpenAPI lint + Postman/Newman collection test;
8. build production;
9. container/image scan bila container dipakai;
10. deploy staging, smoke/E2E, lalu approval produksi.

Nama perintah generik yang harus diwujudkan oleh proyek: `lint`, `typecheck`, `test:unit`, `test:integration`, `test:api`, `test:e2e`, `build`, `migration:check`, `openapi:lint`. CI harus gagal jika satu langkah gagal; tidak boleh memakai `continue-on-error` untuk gerbang wajib.

## 8. Pengujian nonfungsional

- **Kinerja (`TST-NFR-001`)**: baseline p95 untuk katalog, availability, reservasi, dan laporan dengan volume terkonfirmasi; uji pagination maksimum dan query plan/index. Angka SLA belum ditetapkan.
- **Beban konkurensi (`TST-NFR-002`)**: burst reservasi slot sama dan login/upload untuk menilai lock, pool DB, limit body, dan rate limit.
- **Reliability (`TST-NFR-003`)**: timeout DB/S3, koneksi terputus, SIGTERM saat request, restart process; tidak ada partial commit.
- **Security (`TST-NFR-004`)**: SAST, dependency audit, secret scan, DAST staging; verifikasi CORS, header keamanan, trusted proxy, payload limit.
- **Aksesibilitas/responsif (`TST-NFR-005`)**: hanya relevan bila kategori Frontend/Mobile/Fullstack dipilih; Soal mewajibkan responsif laptop/tablet untuk Frontend (baris 1193-1205) dan emulator/device Android 10+ untuk Mobile (baris 1227-1239).

## 9. Backup/restore dan rollback test

`TST-DR-001` dinyatakan lulus hanya jika:

1. snapshot/backup RDS ditemukan dan dienkripsi;
2. point-in-time restore dilakukan ke instance terisolasi;
3. migrasi/version marker, jumlah record, FK, sampel reservasi, total finansial, dan tenant isolation diverifikasi;
4. versi object S3 terkait sampel foto dapat dipulihkan;
5. RTO/RPO aktual dicatat dan dibandingkan dengan target setelah `OQ-011` ditutup; sebelum itu hasil hanya baseline dan tidak boleh diklaim memenuhi target;
6. kredensial sementara dicabut dan resource restore dibersihkan.

`TST-OPS-002`: lakukan rollback artefak aplikasi ke versi sebelumnya tanpa rollback destruktif schema. Migrasi breaking wajib memakai pola expand/migrate/contract dan diuji kompatibel minimal satu versi aplikasi sebelum/sesudah.

## 10. Bukti uji dan Definition of Done pengujian

Artefak bukti: laporan CI, JUnit/coverage, hasil OpenAPI lint, Postman/Newman report, migration log, security scan, smoke report, dan catatan restore. Bukti tidak boleh memuat secret/PII.

Pengujian dianggap selesai jika semua requirement `REQ-*` dan endpoint `API-EP-*` memiliki test yang dapat ditelusuri, seluruh gerbang lulus, defect Blocker/High nol, defect Medium memiliki keputusan risiko, dan hasil ditandatangani reviewer. Sampai bukti tersebut tersedia, status seluruh test pada dokumen ini adalah **Direncanakan**.
