# Backend QA Report

## Executive Summary

Backend Smart Space Booking menggunakan NestJS, TypeScript, Prisma 7, dan MySQL. Review dilakukan terhadap source aktual di `Backendbooking`, bukan path konseptual `apps/api`.

Perbaikan utama yang telah diterapkan:

- build production diperbaiki;
- validasi environment ditambahkan;
- JWT tidak lagi menggunakan fallback pada runtime normal;
- reservasi memakai transaksi dan lock MySQL `FOR UPDATE`;
- kode booking dibuat sebelum insert tanpa placeholder global;
- state transition reservasi dibatasi;
- promo divalidasi ulang dalam transaksi booking;
- kalkulasi harga menggunakan integer `bigint`;
- error Prisma dipetakan ke response aman;
- upload memakai storage abstraction local/S3;
- limit ukuran dan magic-byte validation ditambahkan;
- Swagger dan Postman artifact ditambahkan;
- unit dan E2E smoke test ditambahkan.

Backend belum dinyatakan production-ready karena masih ada risiko dependency audit, OpenAPI lama yang belum direkonsiliasi penuh, pagination collection yang belum diterapkan merata, dan pengujian concurrency dua koneksi yang masih perlu diperluas.

## Current Architecture

```text
Backendbooking/
├── prisma/
├── src/
│   ├── config/
│   ├── common/
│   ├── database/
│   ├── infrastructure/storage/
│   └── modules/
│       ├── auth/
│       ├── spaces/
│       ├── discounts/
│       ├── reservations/
│       ├── admin/
│       └── upload/
├── test/
├── docs/
└── package.json
```

Arsitektur merupakan modular monolith. Controller menangani HTTP, service menangani business logic, Prisma menangani persistence, dan storage berada di balik interface.

## Initial Folder Structure

Sebelum review, script diagnostik berada di `src/scripts` dan ikut masuk cakupan build. Upload langsung menulis filesystem tanpa adapter. Konfigurasi environment tidak tervalidasi. Reservation creation memakai check-then-insert serta kode booking placeholder `TEMP`.

## Findings

| ID | Severity | Area | Evidence | Impact | Resolution | Status |
|---|---|---|---|---|---|---|
| BUILD-001 | Critical | Build | Konflik tipe MariaDB pool pada Prisma adapter | Build gagal | Prisma service disederhanakan dan script dipindah ke `test/tools` | Fixed |
| AUTH-001 | Critical | Security | JWT secret fallback literal | Token dapat dipalsukan bila env salah | Joi env validation dan runtime secret requirement | Fixed |
| RSV-001 | Critical | Concurrency | Overlap check tanpa lock | Double booking paralel | Lock row `space` dan overlap query dalam transaction | Fixed |
| RSV-002 | Critical | Integrity | `kode_booking='TEMP'` unique | Booking tidak terkait saling konflik | Kode CSPRNG sebelum insert | Fixed |
| RSV-003 | High | State machine | Status ditulis bebas | Check-in/out dan laporan inkonsisten | Generic status dibatasi approve/cancel; check-in/out dedicated | Fixed |
| PROMO-001 | High | Pricing | Promo invalid dapat diabaikan | Total salah | Promo owner-scoped dan divalidasi dalam transaksi | Fixed |
| ERR-001 | High | Error handling | Internal exception message dikirim ke client | Information disclosure | Safe error envelope dan mapping Prisma | Fixed |
| UPLOAD-001 | High | Upload | MIME client-only dan tanpa limit pre-buffer | DoS dan content spoofing | Multer 5 MiB limit dan magic-byte validation | Fixed |
| STORAGE-001 | High | AWS | Local filesystem hard-coded | Tidak siap multi-instance | Storage interface local development/S3 production | Fixed with conditions |
| AUTHZ-001 | High | Authorization | Profile role dapat hilang | BOLA fail-open | JWT strategy menolak role/profile mismatch | Fixed |
| API-001 | Medium | Contract | OpenAPI lama masih memuat App Maker | Dokumentasi drift | Dicatat untuk rekonsiliasi lanjutan | Deferred |
| PERF-001 | Medium | Query | Collection masih belum seluruhnya paginated | Query tidak bounded | Pagination lintas endpoint dijadwalkan | Deferred |
| DEP-001 | High | Dependency | Audit runtime menemukan advisories | Risiko supply-chain/runtime | AWS SDK v2 dihapus; dependency lain masih perlu review | Partially fixed |

## Refactoring Decisions

- Backend tetap berada di `Backendbooking`; perpindahan ke `apps/api` ditunda.
- App Maker tidak digunakan pada runtime standalone.
- Local storage dipakai hanya development, S3 dipakai production.
- QR verification endpoint ditambahkan sebagai extension owner-scoped.
- Tidak dibuat generic repository wrapper di atas Prisma.
- Correctness reservasi tidak bergantung cache.

## Final Folder Structure

```text
src/
├── config/env.validation.ts
├── common/
├── database/
├── infrastructure/storage/
├── modules/
│   ├── auth/
│   ├── spaces/
│   ├── discounts/
│   ├── reservations/
│   ├── admin/
│   └── upload/
├── app.module.ts
└── main.ts
```

Tool diagnostik dipindah ke `test/tools` dan dikeluarkan dari production build.

## API Contract Impact

Public paths utama dipertahankan. Extension baru:

```text
POST /api/admin/reservasi/verify-qr
```

Endpoint ini owner-scoped dan memisahkan verifikasi tiket dari mutasi check-in.

OpenAPI statis di `docs/openapi.yaml` masih memerlukan sinkronisasi penuh dengan runtime standalone no-App-Maker.

## Database and Prisma Review

- Prisma schema tervalidasi.
- MySQL migration berisi PK, FK, composite FK, unique, check, dan index.
- Migration purpose upload diperbarui untuk `general`, `member_photo`, dan `space_photo`.
- `db push` tidak boleh digunakan production; production menggunakan `prisma migrate deploy`.
- Reservasi dan detail dibuat atomik.
- Overlap protected melalui per-space row lock.

## Authentication and Authorization Review

- Password memakai Argon2.
- JWT Bearer digunakan.
- JWT secret divalidasi environment.
- Member hanya membaca reservasi sendiri.
- Admin hanya membaca resource owner sendiri.
- Role/profile mismatch ditolak saat token validation.
- Admin member visibility berasal dari reservation history.

## Reservation and Concurrency Review

Rule overlap:

```text
existingStart < requestedEnd
AND existingEnd > requestedStart
```

Blocking status:

```text
belum_dikonfirm
 disetujui
aktif
```

Cancelled dan selesai tidak memblokir availability. Back-to-back slot diperbolehkan.

Pengujian collision sequential lulus. Pengujian concurrency dua koneksi paralel tetap perlu ditambah sebagai gate deployment.

## Upload and AWS Review

- `LocalStorageService` untuk development.
- `S3StorageService` menggunakan AWS SDK v3 untuk production.
- Object key dibuat server.
- MIME allowlist, size limit, magic bytes, checksum, dan media ledger diterapkan.
- Jika ledger insert gagal, storage object dihapus sebagai compensation.

Open question: media public atau signed URL policy belum final.

## Security Review

Kontrol yang sudah ada:

- Helmet;
- CORS configurable;
- global DTO whitelist dan unknown field rejection;
- JWT and role guards;
- password hashing;
- owner/member authorization;
- safe Prisma error mapping;
- upload size and content validation;
- throttler module tersedia.

Risiko tersisa:

- dependency audit masih memiliki high findings pada Prisma/MariaDB path;
- global throttling perlu dikonfigurasi kembali setelah DI issue pada environment test diselesaikan;
- exact issuer/audience JWT belum diterapkan;
- CSP dan trusted proxy production belum diverifikasi.

## Query Performance Review

Index penting tersedia untuk:

- username;
- booking code;
- reservation overlap;
- owner/member scope;
- member history;
- owner/date/status;
- discount owner/name;
- media cleanup.

Collection pagination belum diterapkan merata dan menjadi risiko scalability yang tersisa.

## Swagger and Postman Review

Swagger runtime tersedia di:

```text
/docs
```

Postman artifacts:

```text
docs/postman/Smart-Space-Booking.postman_collection.json
docs/postman/Local.postman_environment.example.json
docs/postman/README.md
```

Collection tidak memuat secret, token nyata, atau credential RDS.

## Tests Added or Updated

- `test/backend-qa.spec.ts`
- `test/app.e2e-spec.ts`
- `test/tools/test-runner-and-pdf.ts`

Coverage saat ini meliputi:

- password hashing;
- utility waktu dan kode booking;
- database connectivity;
- root dan health E2E;
- 46 API flow manual automation dalam PDF runner.

Concurrency parallel, ownership matrix lengkap, dan upload adversarial masih perlu perluasan.

## Commands Executed

```text
npm run build
npm run lint
npm test
npm run test:e2e
npx prisma format
npx prisma validate
npx prisma generate
npm audit --omit=dev
npx tsx test/tools/test-runner-and-pdf.ts
```

## Verification Results

| Command | Result |
|---|---|
| `npm run build` | Passed |
| `npm run lint` | Passed |
| `npm test` | Passed, 6 tests |
| `npm run test:e2e` | Passed, 2 tests |
| `npx prisma format` | Passed |
| `npx prisma validate` | Passed |
| `npx prisma generate` | Passed |
| PDF API runner | Passed, 46 cases |
| `npm audit --omit=dev` | Failed release gate: remaining dependency findings |

## Remaining Risks

1. Dependency audit masih memiliki unresolved high findings.
2. S3 integration belum diuji terhadap bucket nyata dan IAM role.
3. Parallel concurrency test dua koneksi belum tersedia.
4. Pagination collection belum merata.
5. Static OpenAPI masih stale terhadap runtime standalone.
6. JWT issuer/audience dan refresh/revocation belum final.
7. RDS TLS, pool sizing, PITR restore, dan failover belum diuji.
8. Business timezone, operating hours, dan maximum duration belum final.

## Open Questions

- Business timezone final.
- Jam operasional dan durasi maksimum.
- Media delivery public/CDN/presigned.
- JWT refresh/revocation policy.
- QR expiry dan anti-replay persistence.
- RTO/RPO RDS production.

## Recommended Next Steps

1. Resolve dependency audit findings without force downgrade.
2. Reconcile OpenAPI and docs with runtime standalone.
3. Add two-connection concurrency integration test.
4. Add bounded pagination to all collection endpoints.
5. Test S3 adapter with isolated development bucket and IAM role.
6. Execute RDS migration and restore rehearsal.
