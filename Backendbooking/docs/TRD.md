# Technical Requirements Document (TRD)

## 1. Status dan ruang lingkup

- **Actual state:** kontrak naratif dan OpenAPI 3.0.3 sudah tersedia di direktori ini; belum ada implementasi, migration, deployment, atau hasil verifikasi runtime.
- **REQUIRED:** REST API backend mengimplementasikan 50 method/path soal, database sendiri, autentikasi, password hashing, pengujian endpoint, dan dokumentasi API.
- **DESIGN DECISION:** modular monolith dengan database relasional dan storage adapter adalah arsitektur usulan paling kecil yang memenuhi kebutuhan.

## 2. Konteks sistem

```text
Client Web/Mobile/Postman
        |
      HTTPS
        v
API modular monolith
  |-- auth/tenant guards
  |-- validation + controllers
  |-- application/domain services
  |-- repositories + serializers
        |                 |
   PostgreSQL          Object storage
```

Tidak ada kebutuhan terbukti untuk microservice, broker, atau cache. API adalah satu unit deployable; database dan object storage adalah dependency eksternal.

## 3. Boundary modul

| Modul | Tanggung jawab | Tidak boleh |
|---|---|---|
| health | root, liveness/readiness | membocorkan detail dependency |
| maker/tenant | maker auth, app key, tenant context | memakai app key sebagai role user |
| auth | register/login/profile, hash/JWT | mengembalikan entity/hash |
| member | profil dan CRUD admin | query tanpa owner/tenant scope |
| owner | profil coworking | mengelola owner lain |
| space | tipe, katalog, availability, CRUD | menentukan availability tanpa reservation invariant |
| discount | promo aktif/check/CRUD | mempercayai persen dari client |
| reservation | booking, history, detail, cancel, status, check-in/out | split multi-write tanpa transaksi |
| ticket | e-ticket dan QR payload | memasukkan app key/JWT/PII berlebih |
| report | agregasi bulanan/per tipe | query unbounded/cross-tenant |
| media | validation dan storage adapter | percaya nama/MIME client |

Entity persistence bersifat internal. OpenAPI DTO menjadi contract; package client digenerate dari contract, bukan mengimpor ORM model.

## 4. Request lifecycle

1. Reverse proxy memberi request ID atau API membuatnya.
2. Middleware menerapkan body limit, timeout, headers, CORS, dan rate limit.
3. Tenant resolver memvalidasi header jika endpoint tenant-scoped.
4. JWT guard memvalidasi signature/claims untuk endpoint terproteksi.
5. Role dan object-level policy menentukan izin.
6. DTO parser memvalidasi serta menormalisasi input.
7. Application service menjalankan aturan bisnis dan transaksi.
8. Repository menjalankan query scoped/projection.
9. Serializer memetakan hasil ke response DTO/envelope.
10. Logging/metrics mencatat outcome tanpa secret/PII.

## 5. Kontrak HTTP

### Envelope

Sukses:

```json
{
  "status": true,
  "statusCode": 200,
  "message": "keterangan sukses",
  "data": {},
  "timestamp": "ISO-8601"
}
```

Error:

```json
{
  "status": false,
  "statusCode": 400,
  "message": "keterangan aman",
  "error": "NamaError",
  "timestamp": "ISO-8601"
}
```

- **REQUIRED:** pertahankan nama field envelope sumber.
- **DESIGN DECISION:** dukung 409, 413, dan 429 walaupun contoh global hanya menyebut 400/401/403/404/500.
- Collection menerima `page`/`limit` opsional (default 1/20, maksimum 100), tetap mengembalikan `data` dalam bentuk sumber-compatible (array; khusus history mempertahankan object dan `items` array), dan wajib mengirim header `X-Page`, `X-Per-Page`, `X-Total-Count`. Sort deterministik memakai `id` naik kecuali daftar reservasi/history memakai tanggal lalu `id` turun.

Daftar endpoint dan ID stabil berada pada [Requirements Traceability](requirements-traceability.md).

## 6. Data dan persistence

Baseline tabel dan proposal schema dijelaskan di [Database Design](database-design.md). Persyaratan teknis:

- migration versioned dan append-only;
- seluruh FK terindeks;
- unique/check constraint untuk invariant lokal;
- satu reservasi tepat satu detail (`UNIQUE detail_reservasi.id_reservasi`);
- transaksi booking mencakup insert reservasi+detail dan conflict control;
- snapshot harga/diskon/total tidak berubah saat master diubah;
- archive/soft-delete untuk master bereferensi histori;
- DB-to-DTO projection eksplisit.

## 7. Transaksi dan concurrency

### Register user

Satu transaksi membuat `users` dan profil role. Unique violation dipetakan ke 409/400 kontrak; kegagalan profil me-rollback user.

### Reservasi

Satu transaksi:

1. resolve member dari token dan space/owner dari DB;
2. lock/constraint mencegah overlap;
3. validasi promo dalam scope dan waktu;
4. snapshot harga dan hitung total;
5. insert `reservasi` dan satu `detail_reservasi`;
6. commit; response dibuat dari snapshot.

**DESIGN DECISION:** PostgreSQL exclusion constraint pada interval pemblokir diusulkan. Jika DBMS lain dipilih, gunakan row/advisory lock yang dibuktikan dengan test dua koneksi. Pre-check availability saja tidak cukup.

### Status/check-in/out

Gunakan row lock atau optimistic version. Transisi diperiksa terhadap state saat ini dalam transaksi. Retry tidak boleh membuat timestamp ganda/inkonsisten.

### Media + DB

DB dan object storage tidak memiliki distributed transaction. Gunakan upload-to-temporary/key lalu attach secara idempotent; cleanup/rekonsiliasi object yatim menangani partial failure.

## 8. Waktu dan uang

- Tanggal reservasi adalah tanggal bisnis; jam `HH:mm`; `jam_selesai` dihitung server-side.
- Timestamp audit disimpan UTC; pemilihan promo/report berdasarkan `BUSINESS_TIMEZONE`.
- Interval `[start,end)` dan tidak lintas hari adalah **ASSUMPTION** sampai dikonfirmasi.
- Semua uang integer IDR; operasi diskon memakai integer-safe formula dan aturan pembulatan final.
- Formula dan state machine ada di [Business Rules](business-rules.md).

## 9. Auth dan keamanan

- Password hash adaptif; JWT issuer/audience/algorithm/expiry diverifikasi.
- Tenant berasal dari credential/header tervalidasi, bukan body.
- Role + ownership + tenant + state wajib pada service/repository.
- Upload bearer-only menurut proposal aman.
- QR opaque/signed, tanpa app key/JWT; jalur wajib check-in adalah inspect e-ticket API-EP-022 lalu API-EP-044, sedangkan endpoint verify khusus hanya optional.
- CORS allowlist, security headers, trusted proxy, redacted logs, secret manager, rate limit.

Detail: [Authentication & Authorization](authentication-and-authorization.md) dan [Security & Validation](security-and-validation.md).

## 10. Media

Storage interface minimum: `put`, `head`, `delete`, `getUrl`. Driver lokal hanya development; S3 untuk target produksi. Key dibentuk server (`environment/tenant/category/random.ext`). URL tidak hard-coded ke localhost pada production. Access public/private dan retention adalah **OPEN QUESTION**.

## 11. Query dan scalability

- Semua list: `page`, bounded `limit`, allowlisted filter/sort, tie-breaker `id`.
- Gunakan eager join/projection terkontrol untuk mencegah N+1.
- Index mengikuti pola tenant/owner + filter + sort.
- Report dibatasi satu bulan dan owner/tenant; review query plan pada volume target.
- Tidak ada cache sampai metric menunjukkan kebutuhan. Booking correctness tidak boleh bergantung cache.
- Connection pool disesuaikan jumlah instance dan batas RDS.

## 12. Error model

| Kondisi | HTTP usulan |
|---|---:|
| DTO/path/query/header invalid | 400 |
| credential invalid | 401 |
| role/state dilarang | 403 atau 409 untuk konflik state |
| object tidak ada/disamarkan | 404 |
| duplicate/overlap/stale write | 409 |
| upload terlalu besar | 413 |
| rate limit | 429 |
| kegagalan internal | 500 tanpa detail sensitif |

Mapping final harus ditulis di OpenAPI dan diuji konsisten.

## 13. Observability dan health

Log JSON: timestamp, level, service/version, environment, request ID, route template, method, status, latency, pseudonymous tenant/user. Metric: request latency/error, DB pool/lock, conflict reservasi, auth failure, upload failure, report latency.

- `/health`: liveness murah sesuai kontrak.
- readiness terpisah direkomendasikan untuk DB/dependency kritis.
- **OPEN QUESTION:** path readiness tambahan harus disetujui karena tidak termasuk 50 endpoint.

## 14. Deployment

Target proposal adalah EC2 private application tier, RDS private PostgreSQL, S3, ALB/TLS, IAM role, dan secret manager. Build immutable; migration job tunggal; deploy rolling/blue-green; schema expand/migrate/contract; rollback aplikasi tanpa rollback schema destruktif. Detail ada di [Deployment](deployment.md).

## 15. Verification requirements

- lint dan TypeScript strict;
- unit test formula/state/validation;
- integration test migration/FK/check/unique/transaction/overlap concurrency;
- API test seluruh 50 endpoint, envelope, validation, auth, tenant, failure;
- E2E alur member/admin/maker;
- OpenAPI lint, production build, dependency/security scan;
- migration dari kosong dan upgrade path;
- staging smoke, rollback, backup/restore drill.

**Actual state:** semua verifikasi di atas belum dijalankan.

## 16. Technical open questions

1. DBMS/ORM/package manager dan versi final.
2. Apakah mode multi-tenant App Maker bagian backend peserta atau hanya API panitia?
3. Business timezone, jam buka, durasi maksimum, dan aturan pembulatan.
4. Target SLA/volume untuk memvalidasi default 20 dan maksimum 100 (shape response/header pagination telah final).
5. Token refresh/revocation dan autentikasi Guru/Penguji.
6. Public/private media serta endpoint QR verification.
7. SLA dan volume; RTO/RPO/retention mengikuti `OQ-011` (owner Product Owner + Operations Owner; tutup setelah target disetujui dan restore drill memenuhi target).