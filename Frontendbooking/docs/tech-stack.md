# Tech Stack Frontend — Keputusan Provisional

## 1. Status keputusan

Belum ada aplikasi atau dependency yang terpasang. Stack berikut adalah **DESIGN DECISION provisional**, bukan inventaris implementasi.

| Area | Pilihan awal | Status | Alasan |
|---|---|---|---|
| Runtime | Node.js versi LTS yang dipin | Provisional | ekosistem Next.js; versi final mengikuti compatibility matrix |
| Framework | Next.js App Router | Provisional | routing/layout/error/loading, Server Components, Route Handlers/BFF bila disetujui |
| Bahasa | TypeScript strict | Provisional | kontrak DTO dan state lebih dapat diverifikasi |
| UI | React bawaan Next.js | Turunan | dependency framework |
| Styling | CSS Modules + CSS custom properties | Provisional | scope lokal, print stylesheet, tanpa runtime styling wajib |
| Runtime schema | Zod | Provisional | validasi env, input, dan response boundary |
| Form | React Hook Form + resolver schema | Provisional | form kompleks, field error, performa render |
| Server-state client | TanStack Query | Provisional | cache/invalidation/race untuk interaksi client; jangan dipakai bila native server fetch cukup |
| HTTP | wrapper `fetch` | Provisional | native Next/browser, AbortSignal, kontrol header/retry |
| QR | library QR yang mendukung SVG/Canvas dan encoding data | Belum dipilih | audit ukuran, maintenance, CSP, dan print diperlukan |
| Unit/component | Vitest atau Jest + Testing Library | Belum dipilih | final mengikuti dukungan Next versi terpilih |
| Mock network | MSW | Provisional | contract fixture dan alternate/failure paths |
| E2E | Playwright | Provisional | multi-viewport, role flow, print, accessibility smoke |
| Accessibility | axe-core + manual screen reader/keyboard | Provisional | automation tidak cukup untuk seluruh WCAG |
| Package manager | Belum dipilih (`npm`/`pnpm`) | Terbuka | harus ada lockfile tunggal dan install deterministik |

Tidak dipilih pada baseline: Redux/global entity store, Redis, queue, microfrontend, GraphQL, atau WebSocket. Tidak ada kebutuhan terukur yang membenarkannya.

## 2. Ambiguitas kategori dan SSR

Lampiran A menyebut kategori Fullstack sebagai web server-side rendering tanpa konsumsi API eksternal, sedangkan Lampiran C secara eksplisit mengizinkan NextJS untuk Frontend Web yang mengonsumsi API panitia. Keputusan desain:

- kategori tetap **Frontend (Web)**;
- Next.js boleh memakai Server Components/SSR untuk komposisi dan fetch API eksternal;
- frontend tidak membuat database atau domain backend sendiri;
- Route Handler/BFF hanya adapter keamanan/sesi, bukan implementasi ulang API bisnis;
- jika evaluator menafsirkan setiap SSR sebagai Fullstack, gunakan rendering client/static tanpa mengubah kontrak fitur.

Keputusan ini wajib dikonfirmasi sebelum implementasi final. Lihat [keputusan terbuka](./decisions-and-open-questions.md).

## 3. Server dan Client Components

### Default: Server Component

Gunakan untuk:

- layout dan shell statis;
- metadata;
- konten yang tidak memerlukan event handler/browser API;
- fetch awal publik atau privat **hanya** bila sesi server/BFF disetujui;
- format presentasi yang tidak interaktif.

Manfaat: mengurangi JavaScript client dan mencegah secret server-only masuk bundle. Namun data privat tidak boleh dicache lintas user/tenant; gunakan `no-store` atau scope cache yang benar.

### Client Component hanya pada boundary interaktif

Gunakan untuk:

- form/login/register/reservasi/CRUD;
- filter URL interaktif, dialog, toast, tabs, drawer;
- TanStack Query/provider bila dipilih;
- file input/preview, QR rendering bila library browser-only;
- tombol print (`window.print`), copy key, online/offline state.

Jangan menandai layout/page besar `'use client'` hanya karena satu tombol. Isolasi komponen interaktif sekecil mungkin.

## 4. Strategi sesi provisional

### Pilihan utama: BFF/session cookie

- JWT upstream disimpan server-side atau dalam cookie terenkripsi `HttpOnly`, `Secure`, `SameSite=Lax/Strict`.
- Browser memanggil route same-origin; server meneruskan Bearer dan `x-maker-key`.
- Mutasi cookie-authenticated wajib memiliki mitigasi CSRF: SameSite, validasi Origin/Referer, dan token CSRF bila model ancaman memerlukan.
- Maker session dan User session memakai cookie/name/namespace berbeda.

### Fallback SPA

Bila hosting harus static/client-only, JWT disimpan in-memory dan pengguna login ulang setelah reload. JWT tidak disimpan pada `localStorage`/`sessionStorage`. `app_key` tetap terlihat di browser dan tidak dianggap secret.

Pilihan final bergantung requirement persistensi sesi dan persetujuan evaluator terhadap BFF.

## 5. Data fetching

- Server fetch untuk render awal yang aman dan tidak membutuhkan interaktivitas cepat.
- Client query untuk availability, filter dinamis, polling terbatas bila disetujui, dan invalidation setelah mutasi.
- Jangan fetch data yang sama bersamaan dari Server Component dan client tanpa hydration/dehydration strategy yang eksplisit.
- Availability `staleTime: 0`; recheck sebelum `POST /api/reservasi`.
- GET boleh retry terbatas pada network/502/503/504; mutasi tidak retry otomatis.
- `cache: 'no-store'` untuk profil, reservasi, e-ticket, laporan privat, dan data operasional yang tidak boleh bocor lintas sesi.

Rincian: [state dan data fetching](./state-and-data-fetching.md).

## 6. Struktur target

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (member)/member/
│   │   ├── (admin)/admin/
│   │   ├── maker/
│   │   └── api/              # hanya jika BFF dipilih
│   ├── features/
│   │   ├── auth/
│   │   ├── maker/
│   │   ├── spaces/
│   │   ├── reservations/
│   │   ├── members/
│   │   ├── discounts/
│   │   └── reports/
│   ├── lib/api/              # fetch client, schemas, DTO, errors
│   ├── components/ui/
│   ├── config/
│   └── test/
├── public/
└── docs/
```

Route group tidak memengaruhi URL. Fitur tidak mengimpor implementation detail fitur lain; komponen reusable benar-benar generic berada di `components/ui`.

## 7. Kontrak dan tipe

- Kontrak kanonis backend terdokumentasi lengkap di [`backend/docs/openapi.yaml`](../../backend/docs/openapi.yaml) dan [`backend/docs/api-contract.md`](../../backend/docs/api-contract.md) sebagai acuan generated client dan mock fixture.
- Runtime schema tetap diperlukan pada boundary API meski tipe digenerate.
- DTO mempertahankan nama kontrak; jangan membentuk satu “entity” universal dari shape endpoint yang berbeda.
- Preserve enum persis:

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

Lihat [integrasi API](./api-integration.md) dan [traceability backend](../../backend/docs/requirements-traceability.md).

## 8. Konfigurasi

Nama final menunggu bootstrap, tetapi klasifikasinya:

- browser-safe: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_MEDIA_BASE_URL`, `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_RELEASE_SHA`;
- server-only bila BFF: `API_BASE_URL`, `APP_MAKER_KEY`, `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`.

Tidak ada JWT hasil login di environment. Semua env divalidasi fail-fast. Nilai secret tidak boleh masuk Client Component, source map, log, atau error telemetry.

## 9. Dependency policy

Sebelum dependency dipilih:

1. pastikan masih dipelihara, license sesuai, dan kompatibel dengan versi React/Next;
2. audit advisories dan transitive dependencies;
3. pilih library terkecil yang memenuhi kebutuhan;
4. jangan menambah package untuk formatter/utility trivial;
5. pin melalui lockfile; update terkontrol;
6. evaluasi dampak bundle untuk QR, chart, date, dan icon library.

Laporan dapat memakai tabel/bar sederhana dengan CSS/SVG; chart library tidak wajib.

## 10. Quality gates yang harus diwujudkan

Script final harus mencakup format check, lint, TypeScript strict, unit/component/contract tests, E2E, accessibility, dan production build. Nama command baru ditetapkan setelah package manager dipilih. Tidak ada pemeriksaan yang boleh dinonaktifkan hanya agar build lulus.

## 11. Kriteria finalisasi stack

Keputusan provisional menjadi final setelah:

- evaluator menyetujui kategori Frontend dengan Next.js/App Router dan mode render;
- Node/package manager/Next version dipin;
- strategi sesi/BFF diputuskan;
- OpenAPI/fixture dan CORS API diuji;
- library QR menghasilkan QR yang dapat dipindai dari layar dan cetak;
- spike menguji upload, print A4, Server/Client boundary, dan deployment target;
- risiko dependency/security ditinjau.

Sampai seluruhnya selesai, dokumen ini tidak menyatakan stack telah tersedia.