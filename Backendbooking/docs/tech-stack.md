# Tech Stack

## 1. Status pemilihan

- **Actual state:** belum ada `package.json`, lockfile, source code, migration, container definition, atau konfigurasi runtime yang dapat membuktikan stack aktual.
- **REQUIRED:** soal mengizinkan Node.js/Express, Laravel, atau NestJS dan mewajibkan database yang dikelola sendiri.
- **DESIGN DECISION (proposal):** TypeScript + Node.js LTS + NestJS + PostgreSQL dipilih sebagai baseline rancangan, tetapi baru menjadi keputusan aktual setelah ADR dan bootstrap proyek disetujui.
- **OPEN QUESTION:** versi mayor dan package manager harus dipin ketika implementasi dimulai.

## 2. Stack usulan

| Area | Proposal | Alasan terukur | Status |
|---|---|---|---|
| Runtime | Node.js LTS | ekosistem TypeScript dan tooling API matang | DESIGN DECISION |
| Bahasa | TypeScript strict | kontrak DTO lebih mudah diverifikasi; mengurangi mismatch | DESIGN DECISION |
| Framework API | NestJS | module/guard/pipe/OpenAPI terstruktur untuk 50 endpoint | DESIGN DECISION |
| HTTP adapter | Express bawaan NestJS | paling sederhana dan sesuai opsi soal | ASSUMPTION |
| Database | PostgreSQL | transaksi kuat, constraint/check/index, dan exclusion constraint untuk overlap | DESIGN DECISION |
| ORM/migration | Prisma **atau** TypeORM, dipilih satu | repository/migration/type support | OPEN QUESTION |
| Validasi | DTO schema terintegrasi framework; whitelist + reject unknown | boundary validation konsisten | DESIGN DECISION |
| API contract | OpenAPI 3.0.3 | selaras dengan `openapi.yaml`; kontrak eksplisit, lint, dokumentasi, client/test generation | REQUIRED |
| Password | Argon2id; bcrypt hanya bila keterbatasan platform | adaptive password hashing | DESIGN DECISION |
| Token | JWT access token bertanda tangan | kompatibel dengan soal | REQUIRED |
| Test | unit + integration + API/E2E dengan DB disposable | menguji domain, constraint, auth, dan concurrency | REQUIRED |
| Storage lokal | filesystem adapter hanya development | kompatibilitas URL lokal | OPTIONAL |
| Storage produksi | Amazon S3 | durable dan aman untuk multi-instance | DESIGN DECISION |
| Compute/DB | EC2 + RDS PostgreSQL | sesuai rancangan deployment existing | DESIGN DECISION |
| CI | platform CI yang tersedia | lint/typecheck/test/build/migration/security gates | OPEN QUESTION |
| Observability | structured JSON logs + metrics/tracing standar | korelasi dan operasi tanpa vendor lock-in berlebihan | DESIGN DECISION |

## 3. Struktur monorepo target

```text
apps/
└── api/                    # aplikasi backend deployable
packages/
├── api-client/             # generated dari OpenAPI, bukan import entity ORM
├── config/                 # config build/lint yang benar-benar shared
├── shared/                 # primitive framework-independent yang terbukti shared
└── tsconfig/
docs/                       # dokumentasi
infrastructure/             # IaC/deployment bila dibuat
```

Repository saat ini tidak membuktikan struktur tersebut. Jika hanya backend yang dibangun, `apps/api` tetap memisahkan boundary aplikasi dari package kontrak. Frontend tidak boleh mengimpor controller/service/entity backend.

## 4. Kriteria pemilihan ORM

Keputusan Prisma vs TypeORM harus dinilai terhadap:

1. migration SQL dapat direview dan dijalankan dari nol;
2. dukungan transaction dan explicit locking;
3. kemampuan menambahkan SQL PostgreSQL khusus seperti exclusion constraint;
4. query projection agar entity tidak otomatis menjadi DTO;
5. dukungan pagination/sort/index-friendly query;
6. test concurrency menggunakan dua koneksi nyata;
7. tidak memerlukan `synchronize` di production.

**DESIGN DECISION:** migration SQL yang dibutuhkan untuk invariant tetap boleh ditulis manual; keterbatasan ORM tidak boleh menurunkan constraint database.

## 5. Dependency policy

- Pin runtime dan package manager; commit lockfile.
- Gunakan dependency sesedikit mungkin dan hanya dari sumber terawat.
- Audit dependency/SBOM di CI; temuan Blocker/High memblokir rilis kecuali ada mitigasi tertulis.
- Jangan memakai library JWT/password/upload yang tidak dirawat.
- Jangan menonaktifkan TypeScript strict, lint security, atau validation untuk melewati build.
- Update major version melalui PR terpisah dengan migration/contract regression test.

## 6. Environment dan konfigurasi

Setiap environment memvalidasi konfigurasi saat startup. Nama yang direncanakan tanpa nilai:

- aplikasi: `APP_ENV`, `APP_HOST`, `APP_PORT`, `APP_BASE_URL`, `BUSINESS_TIMEZONE`, `TRUST_PROXY`, `LOG_LEVEL`, `REQUEST_TIMEOUT_MS`;
- database: `DATABASE_URL`, `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_SSL`;
- auth: `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` atau `JWT_ACCESS_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_TTL`, `PASSWORD_HASH_COST`, `APP_KEY_LOOKUP_SECRET`, `APP_KEY_KEK_ID` (referensi KMS/secret manager, bukan material key di source);
- CORS/abuse: `CORS_ALLOWED_ORIGINS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`;
- storage: `STORAGE_DRIVER`, `AWS_REGION`, `S3_BUCKET_NAME`, `S3_PUBLIC_BASE_URL`, `UPLOAD_MAX_BYTES`, `UPLOAD_ALLOWED_MIME_TYPES`.

Production menggunakan IAM role dan secret manager; tidak memakai access key statis di source/image.

## 7. Tooling dan command contract

Implementasi harus menyediakan command stabil berikut, walaupun nama internal tool belum dipilih:

```text
lint
typecheck
test:unit
test:integration
test:api
test:e2e
openapi:lint
migration:up
migration:check
build
start
```

**Actual state:** command di atas belum tersedia dan belum dijalankan.

## 8. Hal yang sengaja tidak dipilih

- Tidak ada Redis/cache sebelum terdapat bottleneck terukur dan aturan invalidasi.
- Tidak ada queue/background worker sebelum ada pekerjaan async yang nyata.
- Tidak ada microservice; transaksi booking lebih aman dalam satu service/DB.
- Tidak ada GraphQL karena kontrak wajib adalah REST.
- Tidak ada NoSQL karena relasi, constraint, laporan, dan concurrency lebih sesuai database relasional.

## 9. Gate pengesahan stack

Stack final harus memiliki ADR yang menyebut versi, package manager, ORM, driver PostgreSQL, test runner, formatter/linter, image/runtime deployment, dan owner upgrade. Setelah dipilih, sinkronkan [TRD](TRD.md), [Database Design](database-design.md), [Implementation Plan](implementation-plan.md), dan command di [Testing Strategy](testing-strategy.md).