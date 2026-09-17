# Traceability Kebutuhan Frontend

## 1. Sumber dan aturan

Sumber utama adalah dokumen UKK 2026/2027 Paket B dan prompt dokumentasi frontend. Setiap baris memetakan requirement ke UI/API, desain, serta verifikasi. Status `Rencana` berarti belum diimplementasikan atau diverifikasi karena repository hanya berisi docs.

Baseline lokal memakai [kontrak API](../../backend/docs/api-contract.md) dan [OpenAPI](../../backend/docs/openapi.yaml), dengan [autentikasi/otorisasi](../../backend/docs/authentication-and-authorization.md), [testing](../../backend/docs/testing-strategy.md), dan [deployment](../../backend/docs/deployment.md). Konflik terhadap sumber panitia dan resolusi hardening dicatat di [decisions-and-open-questions.md](./decisions-and-open-questions.md).

## 2. Fitur Member/Pengunjung

| ID | Requirement sumber | UI/API | Desain/test | Status |
|---|---|---|---|---|
| M-01 | Register nama lengkap, instansi, telepon, alamat, username, password, foto | `POST /api/auth/register/member`; field `nama_member`, `instansi`, `telp`, `alamat`, `username`, `password`, `foto`; upload `/api/upload/members` | [validasi](./validation-and-error-handling.md), auth/upload tests | Rencana |
| M-02 | Login | `POST /api/auth/login`, `GET /api/auth/profile` | token/session, 401/role test | Rencana |
| M-03 | Lihat space dengan foto, kapasitas, fasilitas, harga/jam | `/api/spaces/types`, `/api/spaces`, `/api/spaces/{id}`; `foto_url`, `kapasitas`, `deskripsi`, `harga_per_jam` | katalog/detail, empty/broken image/XSS | Rencana |
| M-04 | Reservasi tanggal, jam mulai, durasi, promo | availability, promo check, `POST /api/reservasi` | stale availability, double submit, unknown outcome | Rencana |
| M-05 | Status booking lima state | `/api/reservasi/my`, detail; enum lengkap | status rendering/unknown enum | Rencana |
| M-06 | Histori filter bulan | `/api/reservasi/my/history?month&year` | URL state, month 1–12 | Rencana |
| M-07 | Cetak e-ticket/nota, kode reservasi, QR | `/api/reservasi/{id}/e-ticket`; `kode_booking`, `qr_code_payload` | QR data-only, print layout, authorization | Rencana |

## 3. Fitur Admin Pengelola Space

| ID | Requirement sumber | UI/API | Desain/test | Status |
|---|---|---|---|---|
| A-01 | Register lokasi, profil, akun admin | `POST /api/auth/register/admin-space`; required `username`, `password`, `nama_coworking`, `nama_pemilik`, `telp`; optional `alamat`, `deskripsi_fasilitas` | field extension optional/absent/null | Rencana |
| A-02 | Login admin | auth login/profile role `admin_space` | guard + server auth tests | Rencana |
| A-03 | Update nama space, pemilik, alamat, telepon, deskripsi fasilitas | `GET/PUT /api/admin/profile`; `alamat?`, `deskripsi_fasilitas?` adalah ekstensi lokal | required source fields + optional extension | Rencana |
| A-04 | CRUD member | endpoint 27–31 + upload 50 | search, CRUD, failure/delete relation | Rencana |
| A-05 | CRUD space, tipe, kapasitas, tarif, deskripsi, foto | endpoint 32–36 + upload 49 | enum/number/upload/invalidation | Rencana |
| A-06 | CRUD promo: nama, persen, awal, akhir | endpoint 37–41 | range/date/duplicate | Rencana |
| A-07 | Konfirmasi/status/check-in/out | endpoint 43–45 | transition, stale, race | Rencana |
| A-08 | Semua reservasi filter status dan bulan | endpoint 42: `month`, `year`, `status`, juga `id_space`, `tanggal` | URL filter matrix | Rencana |
| A-09 | Rekap estimasi pendapatan/bulan dan distribusi jenis space | endpoint 46; 47 alias sempit | report totals/empty/alias shape | Rencana |

## 4. Ketentuan global

| ID | Requirement | Implementasi desain | Verifikasi | Status |
|---|---|---|---|---|
| G-01 | Multi-tenancy `x-maker-key` atau `x-app-key` pada endpoint tenant-scoped | kanonik `x-maker-key`; root/health/bootstrap Maker tanpa key; key dalam query cache | endpoint header matrix; tenant switch | Rencana |
| G-02 | JWT Bearer untuk endpoint authenticated | BFF HttpOnly preferred; SPA in-memory fallback | no Web Storage/token leak; 401/403 | Keputusan terbuka |
| G-03 | Role `member`, `admin_space` | exact enum + route UX | role matrix | Rencana |
| G-04 | Envelope sukses/error baku | runtime parser `ApiSuccess<T>`/`ApiError` | malformed/schema drift | Rencana |
| G-05 | Tanggal ISO/`YYYY-MM-DD`, jam `HH:mm`, durasi jam integer >=1 | string-preserving validators | UTC/Jakarta/boundary | Rencana |
| G-06 | Harga IDR number | response server authoritative + IDR formatter | integer/big/zero | Rencana |
| G-07 | URL media space/member/general | validate scheme/host; fallback | mixed content/broken URL | Terblokir URL produksi |
| G-08 | Web responsive laptop/tablet | responsive layout | E2E viewport + manual | Rencana |
| G-09 | Hubungkan seluruh form/aksi | vertical slices 1–9 | endpoint matrix 50 | Rencana |

## 5. Trace seluruh endpoint 1–50

| No. | Endpoint | Requirement/UI owner | Test minimum | Status |
|---:|---|---|---|---|
| 1 | `GET /` | diagnostics/root info | 200, timeout, schema, tanpa tenant key | Rencana |
| 2 | `GET /health` | diagnostics dependency | 200/500, tanpa tenant key, no browser polling | Rencana |
| 3 | `POST /api/maker/register` | Maker setup | 201/400 duplicate | Rencana |
| 4 | `POST /api/maker/login` | Maker setup | 200/401 | Rencana |
| 5 | `GET /api/maker/me` | Maker profile | Bearer/401 | Rencana |
| 6 | `GET /api/maker/stats` | Maker stats optional | headers/schema | Rencana |
| 7 | `GET /api/maker/list` | panel Guru/Penguji eksternal, tidak diekspos aplikasi umum | route/fetch absent; Bearer wajib; email/key masked; pagination | Scope diputuskan tidak diekspos |
| 8 | `POST /api/auth/register/member` | M-01 | 201/400/fields | Rencana |
| 9 | `POST /api/auth/register/admin-space` | A-01 | 201/400/fields | Rencana |
| 10 | `POST /api/auth/login` | M-02/A-02 | role/401 | Rencana |
| 11 | `GET /api/auth/profile` | session bootstrap | member/admin/401/403 | Rencana |
| 12 | `GET /api/spaces/types` | M-03/forms | exact 3 enums | Rencana |
| 13 | `GET /api/spaces/availability` | M-04 | available/400/stale/race | Rencana |
| 14 | `GET /api/spaces` | M-03 | filter/empty/page default 1/limit 20/max 100/header | Rencana |
| 15 | `GET /api/spaces/{id}` | M-03 | 200/404 | Rencana |
| 16 | `GET /api/diskon/active` | M-04 | active/empty/date | Rencana |
| 17 | `POST /api/diskon/check` | M-04 | valid/expired 400 | Rencana |
| 18 | `GET /api/diskon/{id}` | promo detail | 200/404 | Rencana |
| 19 | `POST /api/reservasi` | M-04 | 201/collision/double/timeout/idempotency key replay+mismatch | Rencana |
| 20 | `GET /api/reservasi/my` | M-05 | list/empty/status | Rencana |
| 21 | `GET /api/reservasi/my/history` | M-06 | month/year/empty | Rencana |
| 22 | `GET /api/reservasi/{id}/e-ticket` | M-07 | member/admin/403/print | Rencana |
| 23 | `GET /api/reservasi/{id}` | detail shared | 200/403/404 | Rencana |
| 24 | `PATCH /api/reservasi/{id}/cancel` | M-05 | success/stale/double | Rencana |
| 25 | `GET /api/admin/profile` | A-03 | role/shape/optional alamat+deskripsi | Rencana |
| 26 | `PUT /api/admin/profile` | A-03 | required source fields/optional extensions/200/403 | Rencana |
| 27 | `GET /api/admin/members` | A-04 | search/empty/pagination headers/max 100 | Rencana |
| 28 | `POST /api/admin/members` | A-04 | 201/duplicate/upload link | Rencana |
| 29 | `GET /api/admin/members/{id}` | A-04 | 200/404 | Rencana |
| 30 | `PUT /api/admin/members/{id}` | A-04 | partial/no change/404 | Rencana |
| 31 | `DELETE /api/admin/members/{id}` | A-04 | confirm/relation failure | Rencana |
| 32 | `GET /api/admin/spaces` | A-05 | list/empty/pagination headers/max 100 | Rencana |
| 33 | `POST /api/admin/spaces` | A-05 | required/enums/201 | Rencana |
| 34 | `GET /api/admin/spaces/{id}` | A-05 | 200/404 | Rencana |
| 35 | `PUT /api/admin/spaces/{id}` | A-05 | partial/boundaries | Rencana |
| 36 | `DELETE /api/admin/spaces/{id}` | A-05 | booked relation/error | Rencana |
| 37 | `GET /api/admin/diskon` | A-06 | list/empty | Rencana |
| 38 | `POST /api/admin/diskon` | A-06 | percent/date/duplicate | Rencana |
| 39 | `GET /api/admin/diskon/{id}` | A-06 | 200/404 | Rencana |
| 40 | `PUT /api/admin/diskon/{id}` | A-06 | partial/range | Rencana |
| 41 | `DELETE /api/admin/diskon/{id}` | A-06 | active/in-use error | Rencana |
| 42 | `GET /api/admin/reservasi` | A-08 | all filter combinations + pagination headers | Rencana |
| 43 | `PATCH /api/admin/reservasi/{id}/status` | A-07 | enum/transitions/race | Rencana |
| 44 | `POST /api/admin/reservasi/{id}/check-in` | A-07 | approved only/double | Rencana |
| 45 | `POST /api/admin/reservasi/{id}/check-out` | A-07 | active only/double | Rencana |
| 46 | `GET /api/admin/reports/monthly` | A-09 | month/year/totals/types | Rencana |
| 47 | `GET /api/admin/reports/income` | alias report | narrow schema/no duplicate fetch | Rencana |
| 48 | `POST /api/upload/image` | media umum bila dibutuhkan | type/size/auth/abort | Rencana/opsional UI |
| 49 | `POST /api/upload/spaces` | A-05 | multipart/auth ambiguity | Rencana |
| 50 | `POST /api/upload/members` | M-01/A-04 | multipart/auth ambiguity | Rencana |

## 6. Prompt-specific traceability

| Prompt | Dokumen pemenuhan |
|---|---|
| response models, bukan DB entities | [api-integration.md](./api-integration.md) §2–5 |
| keputusan semua 50 endpoint termasuk Maker/root/health/upload/alias | [api-integration.md](./api-integration.md) §6 dan dokumen ini §5 |
| headers/auth/token storage | [api-integration.md](./api-integration.md) §3 |
| query keys/invalidation/refetch | [state-and-data-fetching.md](./state-and-data-fetching.md) |
| URL/server/local state | [state-and-data-fetching.md](./state-and-data-fetching.md) §1–2 |
| stale availability | [state-and-data-fetching.md](./state-and-data-fetching.md) §4 |
| double submit/idempotent retry | [state-and-data-fetching.md](./state-and-data-fetching.md) §6 |
| forms/error mapping/states | [validation-and-error-handling.md](./validation-and-error-handling.md) |
| testing matrix | [testing-strategy.md](./testing-strategy.md) |
| vertical-slice tasks | [implementation-plan.md](./implementation-plan.md) |
| env exposed vs server-only | [deployment.md](./deployment.md) §3 |
| EC2 design tanpa klaim | [deployment.md](./deployment.md) |
| konflik/open questions | [decisions-and-open-questions.md](./decisions-and-open-questions.md) |
