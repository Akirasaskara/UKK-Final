# Technical Requirements Document (TRD)

## 1. Status, sumber, dan scope perubahan

Dokumen ini adalah rancangan teknis frontend. Belum ada implementasi, build, test, maupun deployment yang dapat diverifikasi. Sumber normatif: [`../../Rev_Soal_UKK_2026-2027_Paket_B (1).md`](../../Rev_Soal_UKK_2026-2027_Paket_B%20%281%29.md), [PRD](./PRD.md), dan [integrasi API](./api-integration.md).

Keputusan provisional: Next.js App Router + TypeScript strict. Frontend tidak mengubah database atau API. Bila BFF dipilih, fungsinya hanya session/security adapter ke API eksternal, bukan layanan bisnis baru.

## 2. Arsitektur logis

```text
Browser
  ├─ Server-rendered shell / Server Components
  ├─ Client Components untuk form dan interaksi
  └─ same-origin BFF (opsional, pilihan utama untuk sesi aman)
          ↓
API panitia (50 endpoint)
  ├─ x-maker-key tenant context
  └─ Authorization Bearer untuk endpoint privat
```

Boundary:

- Frontend hanya memakai request/response DTO dan runtime schema.
- Tidak mengimpor controller, service, ORM, atau database backend.
- API response tidak langsung dianggap trusted; envelope dan `data` divalidasi.
- `app_key` bukan authorization secret. Role dan ownership tetap diverifikasi API.

Referensi backend tersedia: [rencana implementasi](../../backend/docs/implementation-plan.md), [testing](../../backend/docs/testing-strategy.md), [deployment](../../backend/docs/deployment.md), dan [keputusan terbuka](../../backend/docs/decisions-and-open-questions.md).

## 3. Rendering dan komponen

### 3.1 Server Components default

Page/layout tetap Server Component kecuali membutuhkan state browser/event handler. Cocok untuk shell, metadata, static copy, dan initial fetch bila session dapat dibaca server. Data privat memakai `no-store` dan tidak boleh masuk shared/full-route cache.

### 3.2 Client Components terisolasi

Boundary client untuk:

- auth/register/CRUD/reservation forms;
- query provider dan dynamic query;
- URL filter controls;
- dialogs/toasts/drawers;
- upload preview;
- QR browser rendering dan `window.print`.

Props dari server ke client harus serializable dan tidak memuat JWT, cookie, `SESSION_SECRET`, atau header authorization.

### 3.3 SSR ambiguity

Lampiran C mengizinkan NextJS untuk kategori Frontend, sedangkan Lampiran A mengaitkan SSR dengan Fullstack tanpa API eksternal. Desain menganggap SSR/Server Components hanya teknik render frontend yang tetap mengonsumsi API eksternal. Bila evaluator menolak interpretasi tersebut, route dapat memakai client fetch/static shell; keputusan harus dikonfirmasi sebelum build.

## 4. API client

### 4.1 Layer

1. `transport`: URL join aman, timeout, AbortSignal, header.
2. `envelope parser`: `ApiSuccess<T>`/`ApiError`.
3. `runtime schema`: endpoint-specific response.
4. `service`: fungsi per domain, tanpa UI.
5. `query/mutation`: cache, invalidation, retry policy.
6. `view model`: label/format, tidak mengubah identifier contract.

### 4.2 Header

- `Accept: application/json`.
- `Content-Type: application/json` hanya body JSON.
- `x-maker-key` pada request tenant; alias `x-app-key` tidak dipakai bersamaan.
- `Authorization: Bearer ...` hanya endpoint yang membutuhkan.
- Upload memakai `FormData`; browser menetapkan multipart boundary.

Maker register/login tidak mungkin membutuhkan key yang belum diterbitkan; root/health/Maker initial endpoints mengikuti matriks final setelah verifikasi API.

### 4.3 Timeout dan retry

- JSON: awal 10–15 detik; upload memiliki batas lebih panjang tetapi finite.
- GET: maksimal 1–2 retry untuk network/502/503/504 dengan jitter.
- Tidak retry 4xx.
- POST/PUT/PATCH/DELETE tidak retry otomatis.
- Mutasi timeout masuk `unknown outcome`, lalu reconcile dengan GET.

### 4.4 Enum wajib

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

Unknown enum tidak dipaksakan dengan cast; parser menolak atau UI menampilkan contract error sesuai scope.

## 5. Session, tenant, dan guards

### 5.1 Model sesi

- `MakerSession`: token Maker, maker identity, `app_key`.
- `UserSession`: token user, user ID, `role`, member/space owner.
- Keduanya tidak saling overwrite.

Pilihan utama adalah BFF + cookie HttpOnly/Secure/SameSite. Mutasi same-origin harus dilindungi CSRF. Fallback SPA memakai token in-memory dan login ulang setelah reload; Web Storage dilarang untuk JWT.

### 5.2 Guard berlapis

1. Middleware/server guard mencegah render route role salah berdasarkan sesi tervalidasi.
2. Page bootstrap memanggil profile ketika perlu.
3. Client guard mengontrol aksi/interaksi setelah session berubah.
4. API backend tetap enforcement authority.

401 membersihkan sesi/cache terkait dan menuju session-expired. 403 dengan sesi valid menampilkan forbidden tanpa logout. Redirect hanya ke allowlist internal.

### 5.3 Isolasi cache

Private query key memuat tenant (`makerKey`) dan subject user. Saat logout/switch key:

1. batalkan request aktif;
2. clear private cache lama;
3. revoke object URL;
4. reset form sensitif;
5. baru render tenant/session berikutnya.

Token mentah tidak masuk query key/devtools.

## 6. State ownership

- URL: `tipe`, `search`, `month`, `year`, `status`, `id_space`, `tanggal`.
- Server state: query cache/server fetch.
- Session: provider/session server.
- Form: lokal per route.
- UI ephemeral: dialog, toast, preview.

Jangan menyalin seluruh response ke global store. Detail query key dan invalidation ada di [state/data fetching](./state-and-data-fetching.md).

## 7. Form dan validasi

- Skema client mempertahankan field kontrak.
- Validasi frontend adalah UX; backend tetap authoritative.
- Password minimal 6 sesuai kontrak ujian, tetapi kebijakan produksi lebih kuat masih open question.
- `tanggal_reservasi` sebagai `YYYY-MM-DD` string; `jam_mulai` sebagai `HH:mm`; `durasi_jam` integer >= 1.
- `persentase_diskon` 1..100; akhir sesudah awal.
- ID integer positif; nomor telepon string.
- Partial update membutuhkan minimal satu perubahan.
- Error API tanpa field map tampil form-level; jangan parsing natural-language menjadi field error.

## 8. Reservasi dan concurrency UX

Availability adalah snapshot, bukan lock:

1. query hanya saat parameter lengkap/valid;
2. stale bila input berubah;
3. tampilkan waktu pemeriksaan;
4. recheck tepat sebelum submit;
5. disable + handler lock selama pending;
6. tidak optimistic create;
7. tangani collision 400 sebagai hasil bisnis;
8. timeout direkonsiliasi lewat `/api/reservasi/my`.

Frontend tidak dapat menjamin exactly-once tanpa idempotency backend. Dua tab tetap dapat race; server wajib mencegah overlap.

## 9. Upload

- `/api/upload/image`: `.jpg`, `.jpeg`, `.png`, `.webp`.
- `/api/upload/spaces` dan `/api/upload/members`: `.jpg`, `.jpeg`, `.png`.
- Satu field `file`; size maksimum belum tersedia.
- Cek MIME + extension di client untuk UX, tetapi backend wajib magic bytes/size/path/authorization.
- `uploaded` berbeda dari `attached`.
- Bila save entity gagal setelah upload, tampilkan orphan warning; jangan mengklaim cleanup karena delete media tidak ada.
- URL media divalidasi scheme dan configured host; `localhost` tidak direwrite secara diam-diam.

## 10. Error model dan UI states

`AppErrorKind`: `validation`, `unauthenticated`, `forbidden`, `not_found`, `conflict`, `rate_limited`, `server`, `network`, `timeout`, `contract`.

Setiap data surface mendukung:

- initial loading;
- ready;
- background fetching;
- empty;
- error + retry bila aman;
- submitting;
- success;
- forbidden;
- session-expired;
- offline;
- unknown mutation outcome.

Route memakai `loading.tsx`, `error.tsx`, `not-found.tsx` bila tepat; error boundary tidak membocorkan stack/response sensitif.

## 11. E-ticket, QR, dan print

- GET e-ticket hanya setelah role/session valid.
- QR dibuat dari `qr_code_payload` persis sebagai data, bukan URL/action.
- Jangan menambahkan JWT atau `app_key` sendiri ke payload.
- Karena contoh payload API memuat `app_key`, risiko kebocoran harus diperbaiki backend; frontend tidak dapat menyanitasi payload tanpa mengubah makna QR.
- Render fallback kode booking dan nomor tiket bila QR gagal.
- Print stylesheet A4 menyembunyikan shell/actions, mempertahankan detail/QR, dan tidak bergantung warna.
- Uji scan QR dari viewport dan PDF.

## 12. Responsive dan accessibility

- Viewport target uji: 320, 375, 768, 1024, 1440 px.
- Tidak ada body overflow horizontal; tabel dapat memiliki named scroll region.
- Touch target 44×44 px; input mobile >=16 px.
- WCAG 2.2 AA baseline: keyboard, focus visible, landmarks, labels/errors, contrast, live regions, reduced motion, zoom 200%.
- DOM order tidak diubah hanya dengan CSS visual ordering.

Detail komponen: [design system](./design-system.md).

## 13. Security requirements

- Render API strings sebagai text; tanpa `dangerouslySetInnerHTML`.
- Image URL allowlist; prevent `javascript:`/unexpected schemes.
- CSP final mengizinkan hanya API/media domain yang perlu.
- Cookie BFF HttpOnly/Secure/SameSite; Origin validation/CSRF.
- Jangan log Authorization, cookie, password, `app_key`, full address/phone, atau QR payload.
- Tidak ada secret pada `NEXT_PUBLIC_*`, bundle, source map publik, analytics.
- 403/404 handling tidak membocorkan resource lintas owner.
- File validation frontend bukan security boundary.
- Dependency audit dan lockfile wajib.

## 14. Observability

Telemetry tersanitasi: release, route template, HTTP status, latency, error kind, request/correlation ID jika tersedia. Tidak mengirim request body auth/profile/reservation. Web vitals dan JS error dapat diukur setelah target ditetapkan. Root/health API hanya diagnostik manual/server monitoring, bukan polling setiap browser.

## 15. Testing requirements

- Unit: schema, validator, formatter, URL normalizer, query keys, role matrix.
- Component/integration: form + mocked endpoint; seluruh states dan failure.
- Contract: fixture sukses/error untuk 50 endpoint.
- E2E: setup Maker, booking Member, Admin CRUD/operation/report, session isolation, collision, timeout reconcile, ticket print.
- Accessibility: axe + keyboard/screen reader manual.
- Responsive: target viewport dan zoom 200%.
- Security: XSS string, open redirect, cache/session isolation, token/log/source map review.

Lihat [strategi pengujian frontend](./testing-strategy.md) dan [backend](../../backend/docs/testing-strategy.md).

## 16. Acceptance teknis Given/When/Then

| ID | Given | When | Then |
|---|---|---|---|
| TRD-01 | response JSON tidak cocok schema | parser berjalan | UI menerima `contract` error dan tidak merender data parsial |
| TRD-02 | tenant A memiliki cache privat | app key diganti ke tenant B | request A dibatalkan dan data A tidak terlihat pada render B |
| TRD-03 | User JWT `member` valid | membuka admin route | server/client guard menolak dan API admin tidak dipanggil |
| TRD-04 | API mutation timeout | handler selesai | tidak ada automatic retry; GET reconciliation dijalankan |
| TRD-05 | field reservasi berubah setelah availability | state dihitung ulang | availability/promo preview lama invalid dan submit terkunci |
| TRD-06 | upload sukses tetapi entity save gagal | error diterima | UI menyatakan file belum terasosiasi dan tidak menyatakan entity sukses |
| TRD-07 | 401 pada data privat | global handler berjalan | sesi subject dan private cache dibersihkan; Maker session lain tidak terhapus |
| TRD-08 | 403 pada sesi valid | handler berjalan | forbidden ditampilkan tanpa redirect login loop |
| TRD-09 | Server Component mengirim props ke client | build/security inspection | props tidak mengandung token/cookie/server env |
| TRD-10 | tiket valid | print dilakukan | QR/detail wajib tersedia dan controls tersembunyi |

## 17. Deployment impact

Tidak ada deployment yang dibuat oleh dokumen ini. Opsi target: static frontend atau SSR/BFF Node pada EC2 seperti [deployment frontend](./deployment.md). Next.js App Router dengan BFF membutuhkan proses Node, health/readiness, CSRF/session lifecycle, dan runtime env server. Static fallback menghilangkan HttpOnly session dan memerlukan login ulang bila token hanya in-memory.

## 18. Open decisions sebelum implementasi

Framework version/package manager, mode render yang diterima evaluator, strategi sesi, key provisioning, CORS, OpenAPI aktual, upload auth/limit, media URL, timezone, state transition, max duration, pagination, dan staging tenant. Semua dilacak di [decisions-and-open-questions.md](./decisions-and-open-questions.md).