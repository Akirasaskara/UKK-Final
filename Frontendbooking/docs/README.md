# Dokumentasi Frontend Smart Space Booking

## Status

Direktori ini berisi **rancangan** aplikasi Frontend (Web) untuk UKK RPL 2026/2027 Paket B. Saat dokumen ini ditulis, repository frontend belum memiliki aplikasi, `package.json`, source code, konfigurasi runtime, maupun hasil pengujian. Karena itu, seluruh pilihan teknologi, struktur route, komponen, dan acceptance criteria di sini tidak boleh dibaca sebagai klaim implementasi.

Sumber requirement utama adalah [`../../Rev_Soal_UKK_2026-2027_Paket_B (1).md`](../../Rev_Soal_UKK_2026-2027_Paket_B%20%281%29.md), khususnya Bagian II, Bagian III, dan Lampiran C.

## Keputusan desain provisional

Arah awal yang dipilih adalah **Next.js App Router + TypeScript**. Keputusan ini provisional sampai bootstrap aplikasi, versi runtime, package manager, OpenAPI aktual, strategi sesi, dan kemampuan API panitia dikonfirmasi.

Kategori tetap **Frontend (Web)** karena aplikasi mengonsumsi API eksternal. Pemakaian SSR atau Server Components untuk render/read tidak berarti aplikasi menjadi kategori Fullstack selama frontend tidak memiliki basis data/domain backend sendiri. Namun, Lampiran A memakai istilah “server-side rendering” untuk kategori Fullstack dan Lampiran C mengizinkan NextJS; interpretasi evaluator harus dikonfirmasi sebelum pengerjaan final.

## Peta dokumen

### Dokumen produk dan desain baru

- [Project Brief](./projectbrief.md) — masalah, aktor, sasaran, batas scope, dan risiko.
- [PRD](./PRD.md) — kebutuhan fungsional/nonfungsional dan acceptance criteria Given/When/Then.
- [TRD](./TRD.md) — rancangan teknis Next.js, boundary Server/Client Components, sesi, guard, QR, dan print.
- [Tech Stack](./tech-stack.md) — pilihan stack provisional, alasan, dan kriteria konfirmasi.
- [Routes and User Flows](./routes-and-user-flows.md) — inventaris route publik, Member, Admin, dan App Maker beserta alur utama/gagal.
- [Design System](./design-system.md) — token, pola komponen, responsive behavior, aksesibilitas, print, dan seluruh UI state.

### Dokumen engineering yang sudah ada

- [Integrasi API](./api-integration.md)
- [State dan data fetching](./state-and-data-fetching.md)
- [Validasi dan error handling](./validation-and-error-handling.md)
- [Strategi pengujian](./testing-strategy.md)
- [Rencana implementasi](./implementation-plan.md)
- [Traceability kebutuhan](./requirements-traceability.md)
- [Deployment](./deployment.md)
- [Keputusan dan pertanyaan terbuka](./decisions-and-open-questions.md)

### Referensi backend yang tersedia

- [Kontrak API kanonik lokal](../../backend/docs/api-contract.md)
- [OpenAPI kanonik lokal](../../backend/docs/openapi.yaml)
- [Autentikasi dan otorisasi](../../backend/docs/authentication-and-authorization.md)
- [Keamanan dan validasi](../../backend/docs/security-and-validation.md)
- [Traceability backend](../../backend/docs/requirements-traceability.md)
- [Rencana implementasi backend](../../backend/docs/implementation-plan.md)
- [Strategi pengujian backend](../../backend/docs/testing-strategy.md)
- [Rancangan deployment backend](../../backend/docs/deployment.md)
- [Keputusan dan pertanyaan terbuka backend](../../backend/docs/decisions-and-open-questions.md)

Kontrak dan OpenAPI backend adalah baseline lokal yang diperkeras dan tetap merupakan kontrak target, bukan bukti API runtime telah tersedia. Perbedaan terhadap kontrak asli panitia dicatat eksplisit, bukan dihapus.

## Produk yang dicakup

- **Publik/pengunjung:** katalog, pencarian/filter space, detail, availability, promo, login, registrasi Member, registrasi Admin Space.
- **Member:** membuat reservasi, melihat status/detail/histori, membatalkan sesuai aturan server, melihat dan mencetak e-ticket dengan QR.
- **Admin Space:** profil, CRUD member, CRUD space, CRUD diskon, filter reservasi, perubahan status, check-in, check-out, laporan bulanan.
- **App Maker:** setup register/login, melihat identitas dan `app_key`, statistik tenant. `/api/maker/list` tidak diekspos pada aplikasi umum karena mengandung data lintas maker dan `app_key` pada contoh kontrak.

## Identifier kontrak yang tidak boleh diterjemahkan dalam payload

```ts
type UserRole = 'member' | 'admin_space';
type SpaceType = 'desk' | 'meeting_room' | 'private_office';
type ReservationStatus =
  | 'belum_dikonfirm'
  | 'disetujui'
  | 'aktif'
  | 'selesai'
  | 'dibatalkan';
```

Label UI boleh diterjemahkan, tetapi nilai request/response, nama field (`nama_member`, `id_space`, `tanggal_reservasi`, dan seterusnya), serta header `x-maker-key` harus dipertahankan.

## Prinsip lintas dokumen

1. Frontend memakai DTO request/response eksplisit; tidak mengimpor model ORM/database backend.
2. `x-maker-key` mengidentifikasi tenant, bukan pengganti otorisasi.
3. JWT Maker dan JWT Member/Admin merupakan dua sesi berbeda.
4. Guard route frontend hanya mencegah navigasi yang keliru; backend tetap wajib memvalidasi role, ownership, dan tenant.
5. Data harga, promo, availability, status, dan laporan dari server adalah sumber kebenaran.
6. Mutasi kritis tidak di-retry otomatis secara umum; pembuatan reservasi memakai `Idempotency-Key` stabil per intent dan tetap direkonsiliasi setelah timeout.
7. Semua halaman wajib merancang keadaan loading, empty, error, success, forbidden, dan session-expired bila relevan.
8. UI minimum responsif untuk mobile, tablet, dan desktop; Lampiran C hanya mewajibkan tablet/laptop, tetapi mobile didukung secara graceful karena wireframe sumber bersifat mobile.
9. Aksesibilitas keyboard, fokus, label, status dinamis, kontras, reduced motion, zoom 200%, dan print merupakan acceptance requirement.

## Resolusi lokal dan konflik sumber yang tetap dicatat

Baseline frontend mengikuti profil lokal backend yang diperkeras:

- root/health publik tanpa tenant key;
- `/api/maker/list` hanya Bearer Guru/Penguji, berhalaman, dan hanya mengembalikan email/key teredaksi; tidak ada UI aplikasi umum;
- seluruh collection menerima `page?`/`limit?` dengan default `1`/`20`, maksimum `100`, serta header `X-Page`, `X-Per-Page`, `X-Total-Count`;
- pembuatan reservasi mendukung `Idempotency-Key`;
- seluruh upload wajib Bearer + tenant key, menerima JPEG/PNG/WebP, satu file maksimum 5 MiB;
- profil Admin mendukung `alamat?` dan `deskripsi_fasilitas?`;
- QR memakai token opaque/signed tanpa app key.

Kontrak asli panitia berbeda pada maker list, upload, QR, pagination, idempotency, dan field profil; perbedaan ini sengaja dipertahankan sebagai source conflict. Yang masih terbuka antara lain URL media produksi, timezone bisnis, maksimum durasi, lifecycle sesi, provisioning `app_key`, dan concurrency version/ETag di luar idempotency create.

Daftar lengkap tersedia di [keputusan dan open questions frontend](./decisions-and-open-questions.md) dan [backend](../../backend/docs/decisions-and-open-questions.md).

## Kriteria status dokumentasi

Dokumen ini dapat menjadi baseline desain setelah review produk, arsitektur, keamanan, dan penguji. Aplikasi baru dapat dinyatakan siap setelah implementasi serta lint, typecheck, unit/integration/contract/E2E, accessibility, dan production build benar-benar dijalankan dengan bukti hasil.