# Rencana Implementasi Frontend

## 1. Sasaran dan asumsi

Membangun aplikasi web responsif laptop/tablet yang mengonsumsi 50 endpoint kontrak untuk alur Member dan Admin Space, dengan setup App Maker terpisah. Framework belum ditetapkan oleh source; Next.js/React/Vue adalah opsi requirement, bukan keputusan repository. Rencana memakai istilah route, query cache, runtime schema, dan form abstraction secara framework-netral.

Tidak ada perubahan database. API contract tidak diubah oleh frontend. Authorization tetap milik backend; route guard frontend hanya UX. Referensi backend: [API contract](../../backend/docs/api-contract.md), [auth backend](../../backend/docs/authentication-and-authorization.md), [deployment backend](../../backend/docs/deployment.md).

## 2. Struktur target konseptual

```text
frontend/
├── src/
│   ├── app-or-router/       # routes/layout/error boundaries
│   ├── features/
│   │   ├── maker/
│   │   ├── auth/
│   │   ├── spaces/
│   │   ├── discounts/
│   │   ├── reservations/
│   │   ├── admin-members/
│   │   ├── admin-spaces/
│   │   ├── admin-discounts/
│   │   └── reports/
│   ├── api/                 # HTTP, runtime schemas, response models
│   ├── components/          # komponen UI lintas fitur yang benar-benar reusable
│   ├── config/              # env tervalidasi
│   └── test/
└── docs/
```

Frontend tidak mengimpor controller, service, ORM model, atau database backend. Jika client digenerate, sumbernya OpenAPI eksplisit dan output tetap berupa DTO API.

## 3. Vertical slices

Setiap slice harus selesai dari route/UI → validasi → API → auth/role → loading/empty/error/success → cache invalidation → test, bukan membangun seluruh UI dahulu baru integrasi.

### Slice 0 — Fondasi

- Inisialisasi framework, TypeScript strict, lint, format, test runner, E2E, dan production build.
- Env schema; HTTP client; timeout; abort; parser `ApiSuccess<T>`/`ApiError`.
- Runtime schemas seluruh response model dan enum.
- query client/key factory; error normalization; toast/error boundary.
- layout, navigation, responsive tokens, accessibility baseline.
- CI gates dan safe logging.

**Exit:** root/health dapat dites sebagai diagnostik tanpa polling; malformed response menghasilkan contract error.

### Slice 1 — Setup App Maker dan tenant

Endpoint 3–6: register/login/me/stats. Simpan Maker token terpisah dari user token. UX menampilkan `app_key` setelah register tanpa menaruhnya di URL/log. Endpoint 7 tidak dibuat route aplikasi karena khusus penguji dan mengekspos daftar key.

**Exit:** tenant switch membatalkan dan membersihkan cache. Keputusan provisioning `app_key` untuk deployment final telah disetujui.

### Slice 2 — Auth Member/Admin

Endpoint 8–11: register Member, register Admin Space, login, profile bootstrap, logout, role routes. Form mempertahankan seluruh field kontrak dan optional `foto`. Terapkan strategi token BFF-cookie bila framework/server mendukung; bila SPA murni, in-memory fallback terdokumentasi.

**Exit:** 401/403, reload/session behavior, route guard, dan cache isolation teruji.

### Slice 3 — Katalog, detail, availability, promo

Endpoint 12–18. URL state untuk `tipe`, `search`, jadwal. Space card/detail, image fallback, tipe enum, availability stale policy, promo active/check/detail.

**Exit:** query race dibatalkan; hasil availability invalid saat input berubah; XSS string tidak dirender sebagai HTML.

### Slice 4 — Reservasi Member

Endpoint 19–24. Wizard/form jadwal+promo, recheck availability, create tanpa retry, list status, history month/year, detail, e-ticket+QR+print, cancel.

**Exit:** double submit, collision, unknown outcome, status enum, ownership error, dan print layout teruji E2E.

### Slice 5 — Admin profile dan member

Endpoint 25–31 dan upload member endpoint 50. Profile read/update; member search/list/detail/create/update/delete; upload state terpisah dari save entity.

**Exit:** CRUD invalidation, duplicate/error, delete failure, dan upload orphan UX teruji.

### Slice 6 — Admin space

Endpoint 32–36 dan upload space endpoint 49. CRUD semua field, enum, IDR integer, kapasitas, fasilitas/deskripsi, image.

**Exit:** katalog publik dan availability diinvalidasi setelah perubahan; booked-space delete failure tidak menghilangkan UI item.

### Slice 7 — Admin diskon

Endpoint 37–41. CRUD promo dengan periode ISO, persen 1–100, preview timezone eksplisit.

**Exit:** promo aktif diinvalidasi; boundary periode dan duplicate code teruji.

### Slice 8 — Operasional reservasi Admin

Endpoint 42–45. URL filters `month`, `year`, `status`, `id_space`, `tanggal`; detail; status update; check-in/out. Lock mutation per reservation ID, tanpa optimistic transition.

**Exit:** stale/invalid transition dan concurrent action dua tab direkonsiliasi lewat refetch.

### Slice 9 — Laporan dan media umum

Endpoint 46–48. Monthly report sebagai primary; income alias hanya fallback/fitur sempit dan tidak didobel fetch. Upload general hanya bila ada kebutuhan UI nyata.

**Exit:** angka report memakai response server; alias shape dibedakan; empty report teruji.

### Slice 10 — Hardening dan release candidate

- Lengkapi contract fixtures seluruh 50 endpoint.
- Responsive laptop/tablet, keyboard, screen reader, print.
- Dependency audit, secret scan, source-map inspection, CSP/header review pada hosting.
- E2E Member/Admin, deployment rehearsal, rollback drill, monitoring/error telemetry tersanitasi.

## 4. Definition of Done per slice

- Semua field/enums kontrak dipertahankan.
- Tidak ada DTO yang berasal dari entity database.
- Validasi input dan runtime response tersedia.
- Role/tenant header benar; token tidak tercatat.
- Loading, empty, error, success, stale, dan disabled state tersedia.
- Query key + invalidation didokumentasikan dan dites.
- Mutasi non-idempotent tidak retry otomatis; double submit diblokir.
- Unit/integration/E2E relevan lulus.
- Build production affected app lulus.
- Open question yang memblokir tidak disamarkan sebagai implementasi selesai.

## 5. Urutan prioritas

### Wajib sebelum merge baseline

1. Konfirmasi framework/package manager dan base URL/environment model.
2. Dapatkan OpenAPI atau fixture aktual; verifikasi envelope dan 50 endpoint.
3. Putuskan token storage/BFF dan provisioning `app_key`.
4. Implementasi Slice 0–4 untuk alur Member kritis dengan test failure.
5. Implementasi Slice 5–9 untuk seluruh fitur Admin.

### Wajib sebelum deployment

1. Konfirmasi CORS, HTTPS, URL media, cookie domain bila BFF, dan auth upload.
2. Test E2E terhadap staging tenant khusus.
3. Pastikan endpoint list mendapat batas/pagination backend atau data volume dibatasi operasional.
4. Security headers, no secret in bundle/log/source map, health checks, rollback artefak.

### Iterasi berikutnya

- Generated client saat OpenAPI stabil.
- Visual regression lebih luas.
- Observability web vitals dan tracing request ID jika backend menyediakan.
- Optimasi cache berdasarkan metrik nyata, bukan asumsi.
