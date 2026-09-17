# Keputusan dan Open Questions

## 1. Fakta terkonfirmasi

- Produk adalah aplikasi web frontend yang mengonsumsi API panitia.
- Kontrak mencantumkan 50 endpoint, dua role user (`member`, `admin_space`), serta domain App Maker terpisah.
- Endpoint tenant-scoped membawa `x-maker-key` atau alias `x-app-key`; desain memilih `x-maker-key` sebagai kanonik. Root, health, Maker register/login, dan Maker me tidak membawa tenant key.
- Endpoint authenticated memakai JWT Bearer.
- Response memakai envelope `status`, `statusCode`, `message`, `data`/`error`, `timestamp`.
- Enum tipe adalah `desk`, `meeting_room`, `private_office`.
- Enum status adalah `belum_dikonfirm`, `disetujui`, `aktif`, `selesai`, `dibatalkan`.
- Repository frontend saat dokumentasi dibuat hanya memiliki direktori docs; tidak ada framework, source, package manifest, test, atau deployment config yang dapat diverifikasi.
- Baseline lokal tersedia sebagai [kontrak API backend](../../backend/docs/api-contract.md) dan [OpenAPI backend](../../backend/docs/openapi.yaml), didukung [autentikasi/otorisasi](../../backend/docs/authentication-and-authorization.md), [keamanan/validasi](../../backend/docs/security-and-validation.md), dan [deployment](../../backend/docs/deployment.md). Kontrak ini target desain, bukan bukti runtime.

## 2. Keputusan arsitektur

| ID | Keputusan | Alasan/dampak |
|---|---|---|
| D-01 | Model frontend adalah request/response DTO dan runtime schema, bukan DB entity. | Memisahkan API contract dari persistence/ORM. |
| D-02 | `x-maker-key` menjadi header alias kanonik. | Menghindari variasi cache/client; `x-app-key` hanya compatibility fallback bila terbukti perlu. |
| D-03 | Cache key selalu memuat tenant dan subject sesi untuk data privat. | Mencegah kebocoran cache lintas App Maker/user. |
| D-04 | URL memiliki filter/shareable state; query cache memiliki server state; form/UI state tetap lokal. | Mencegah duplikasi sumber kebenaran. |
| D-05 | Availability selalu stale (`staleTime: 0`) dan direfresh sebelum reservasi. | Availability response bukan lock dan dapat berubah karena concurrency. |
| D-06 | Tidak ada retry otomatis umum untuk POST/PUT/PATCH/DELETE; create reservasi memakai `Idempotency-Key` stabil per intent. | Mencegah duplikasi; timeout tetap direkonsiliasi dan key hanya digunakan ulang untuk payload/intent yang sama. |
| D-07 | Tidak ada optimistic update untuk workflow reservasi/status/check-in/out. | State transition dan ketersediaan harus dikonfirmasi server. |
| D-08 | `/api/admin/reports/monthly` adalah laporan utama; `/income` alias hanya fallback/use case sempit. | Response alias hanya memiliki `month`, `year`, `realisasi_pendapatan_bersih`. |
| D-09 | `/api/maker/list` tidak diekspos pada UI aplikasi umum. | Profil lokal membatasinya ke Bearer Guru/Penguji dan meredaksi email/key; sumber panitia yang publik/key utuh sengaja tidak diikuti. |
| D-10 | Root/health hanya diagnostik, tidak dipoll tiap browser. | Menghindari beban/noise; health dependency milik monitoring operasional. |
| D-11 | Upload dan penyimpanan entity adalah dua state berbeda. | Upload dapat sukses sementara entity save gagal; API tidak menyediakan delete media. |
| D-12 | BFF + HttpOnly cookie adalah preferensi keamanan; SPA fallback memakai token in-memory, bukan Web Storage. | Mengurangi dampak XSS; keputusan final bergantung framework dan persistence requirement. |
| D-13 | App Maker token dan User token dipisahkan. | Audience dan endpoint berbeda; mencegah salah header/session overwrite. |
| D-14 | Semua collection memakai `page?`/`limit?`, default `1`/`20`, maksimum `100`, dan membaca `X-Page`/`X-Per-Page`/`X-Total-Count`. | Mengikuti ekstensi backward-compatible kontrak lokal; body array sumber dipertahankan. |
| D-15 | EC2 doc adalah rancangan Opsi static atau SSR/BFF, bukan klaim infrastruktur. | Belum ada bukti cloud/runtime aktual. |

## 3. Konflik dan gap requirement

### C-01 — Profil admin: gap sumber diselesaikan lokal

**Sumber fitur:** admin dapat update nama coworking, nama pemilik, alamat, telepon, deskripsi fasilitas.
**Kontrak asli panitia:** DTO hanya memuat `nama_coworking`, `nama_pemilik`, `telp`.
**Resolusi lokal mengikat:** request register/update dan response owner menerima `alamat?` serta `deskripsi_fasilitas?`. Frontend menampilkan field ini sebagai opsional dan tetap menoleransi absent/null untuk kompatibilitas.

### C-02 — “Semua request” vs endpoint non-tenant

Ketentuan sumber yang menyatakan key pada semua request bertentangan dengan bootstrap Maker sebelum key tersedia.

**Resolusi lokal mengikat:** root, health, Maker register/login, dan Maker me tidak menerima tenant key. Maker list juga tidak memakai tenant key karena Bearer Guru/Penguji menentukan akses. Endpoint bisnis tenant tetap memakai tepat satu alias tenant key.

### C-03 — Upload auth kontradiktif

Ringkasan sumber memberi scope User/Admin, sedangkan detail menyebut tanpa Bearer.

**Resolusi lokal mengikat:** seluruh upload wajib Bearer + tenant key. General menerima Member/Admin, spaces hanya Admin, members menerima Member/Admin dengan ownership/scope saat attachment. Frontend guard tetap bukan kontrol keamanan.

### C-04 — Upload format WebP tidak konsisten

Sumber membatasi WebP secara tidak konsisten. **Resolusi lokal mengikat:** ketiga endpoint menerima JPEG/PNG/WebP, satu file maksimum 5 MiB; client memakai allowlist yang sama dan backend memvalidasi magic byte, MIME, extension, ukuran, dan path.

### C-05 — URL media localhost

Kontrak base URL remote HTTPS, tetapi contoh `foto_url` adalah `http://localhost:3000`. Di browser produksi ini menunjuk mesin pengguna dan dapat diblok mixed content.

**Keputusan:** jangan rewrite tanpa konfigurasi resmi. Perlu URL media publik/relative dari backend.

### C-06 — Promo ganda

`CreateReservasiDto` mengizinkan `id_diskon` dan `kode_promo`, contoh mengirim keduanya, tetapi prioritas/mismatch tidak didefinisikan.

**Keputusan:** frontend mengirim satu saja sampai backend mendefinisikan precedence; nilai final tetap dari server.

### C-07 — Status update terlalu bebas

`UpdateReservasiStatusDto` menerima semua status, sementara fitur juga memiliki endpoint check-in/out khusus. State machine/transisi valid tidak dijelaskan.

**Keputusan:** aksi check-in/out menggunakan endpoint khusus; status umum hanya untuk transisi yang dikonfirmasi backend. UI tidak boleh mengasumsikan bahwa enum berarti semua transisi valid.

### C-08 — Pagination collection

Sumber panitia mengembalikan array tanpa metadata. **Resolusi lokal mengikat:** setiap collection menerima `page?`/`limit?` dengan default `1`/`20`, maksimum `100`, dan response mengirim `X-Page`, `X-Per-Page`, `X-Total-Count` yang diekspos CORS. Bentuk body tetap kompatibel sumber; khusus history, `data.items` tetap array. Frontend menyimpan page/limit di URL/query key dan membaca header.

### C-09 — App Maker list mengekspos app keys

Sumber panitia menjadikan `/api/maker/list` publik dan mengembalikan email/app key utuh. **Resolusi lokal mengikat:** endpoint memerlukan Bearer Guru/Penguji, diaudit, dipaginasi, dan hanya mengembalikan `email_masked`/`app_key_masked`. Aplikasi umum tidak memiliki route, navigasi, atau fetch untuk endpoint ini.

### C-10 — Requirement “real-time” tanpa mekanisme push

Narasi menyebut transaksi real-time, tetapi kontrak hanya HTTP request/response dan tidak menyediakan WebSocket/SSE.

**Keputusan:** refetch on focus/after mutation dan stale interval terbatas; jangan mengklaim real-time push.

### C-11 — Idempotency create vs concurrency update

Sumber panitia tidak menetapkan idempotency/concurrency. **Resolusi lokal:** `POST /api/reservasi` mendukung `Idempotency-Key` opsional 8–128 karakter dan mengembalikan 409 untuk konflik/idempotency mismatch. Frontend membuat satu key per intent, menggunakannya kembali hanya untuk payload sama, tetap mencegah double submit, dan merekonsiliasi timeout. ETag/version untuk update lain tetap belum tersedia, sehingga stale-write handling masih bergantung 409/refetch.

### C-12 — Error field-level tidak tersedia

Envelope error hanya memberi satu `message` dan `error`, tidak ada map field.

**Keputusan:** validasi client memberi field errors; backend error menjadi form-level kecuali format resmi ditambah. Jangan parsing pesan natural-language.

### C-13 — Kontrak response vs “entity”

Requirement menyebut “Reservasi & Payment Entity”, tetapi frontend tidak boleh menganggap itu tabel/ORM entity. Field tersebut dipakai hanya sebagai response model reservasi; tidak ada payment endpoint atau status pembayaran.

### C-14 — Detail owner tidak konsisten

Owner pada list dapat tanpa `id`, detail memiliki `id`; response login dapat `member` atau `space_owner` null. Model frontend menandai optional/null sesuai endpoint dan memakai schema spesifik bila perlu, bukan satu entity universal.

### C-15 — Otoritas dokumentasi backend

[Kontrak API](../../backend/docs/api-contract.md) dan [OpenAPI](../../backend/docs/openapi.yaml) tersedia dan menjadi baseline lokal kanonik. Dokumen pendukung memakai nama file aktual, termasuk [autentikasi/otorisasi](../../backend/docs/authentication-and-authorization.md) dan [keamanan/validasi](../../backend/docs/security-and-validation.md). Implementasi runtime tetap harus diverifikasi; keberadaan dokumen bukan bukti endpoint telah dideploy.

## 4. Open questions yang memblokir implementasi aman

1. Framework/package manager dan mode render apa yang dipilih: static SPA, SSR, atau BFF?
2. Apakah sesi harus bertahan setelah reload? Jika ya, apakah BFF HttpOnly cookie disetujui?
3. Bagaimana `app_key` diprovision di deployment: user setup, konfigurasi publik tenant tunggal, atau injeksi server BFF?
4. Apakah runtime backend yang dideploy sudah sesuai profil header kanonik lokal untuk endpoint 1–7?
5. Apakah backend CORS mengizinkan origin frontend, `Authorization`, `Content-Type`, `x-maker-key`, `Idempotency-Key`, seluruh method/multipart, serta mengekspos ketiga header pagination?
6. Apa URL media production dan kebijakan host yang diizinkan?
7. Berapa batas dimensi gambar selain maksimum file 5 MiB?
8. Apa cleanup API untuk upload orphan atau retention policy?
10. Apakah reservasi dengan `id_diskon` dan `kode_promo` boleh bersamaan; mana yang menang bila berbeda?
11. Apa state-transition matrix reservasi, termasuk kapan Member boleh cancel?
12. Timezone bisnis apa yang dipakai untuk tanggal reservasi dan periode diskon? Bolehkah durasi melewati tengah malam?
12. Apakah runtime mengimplementasikan sort deterministik, pagination default/max, dan exposure header persis kontrak lokal?
13. Berapa rate limit aktual, apakah `Retry-After` konsisten, dan apakah request ID tersedia?
14. Apakah frontend harus menyediakan UI Maker register/login/stats saat ujian, atau key diberikan panitia?
15. Bagaimana Bearer Guru/Penguji untuk maker list diprovision di luar 50 endpoint?
16. Apakah OpenAPI runtime/fixture sama dengan [OpenAPI lokal](../../backend/docs/openapi.yaml)?
17. Siapa pemilik AWS account, region, DNS, certificate, EC2 sizing, secret store, deployment approval, dan rollback?
18. Apa data/environment staging tenant khusus untuk E2E destructive workflow?

## 5. Keputusan yang wajib sebelum merge/deployment

### Sebelum merge implementasi

- Selesaikan pertanyaan implementasi yang memengaruhi framework/sesi, CORS, provisioning, timezone, promo, dan state transition.
- Verifikasi response nyata seluruh 50 endpoint, OpenAPI runtime, pagination header, dan field optional/null.
- Setujui strategi token dan tenant cache isolation.

### Sebelum deployment

- Selesaikan URL media/dimensi/cleanup upload, rate limit/request ID, provisioning penguji, ownership infrastruktur, dan staging tenant.
- Verifikasi CORS/TLS/security headers/source maps/log redaction.
- Jalankan E2E staging untuk collision, unknown mutation outcome, dan role/tenant isolation.
- Dokumentasikan rollback dan compatibility API.
