# Desain Database — Smart Space Booking

> **Status dokumen:** spesifikasi implementasi target, bukan bukti bahwa schema atau migrasi telah diterapkan.
>
> **APPROVED TARGET:** proyek full-stack standalone; backend NestJS; Prisma sebagai satu-satunya ORM dan pemilik migrasi; Amazon RDS MySQL 8; media di Amazon S3.
>
> **Minimum database:** MySQL 8.0.16+ karena `CHECK` baru ditegakkan mulai versi tersebut. Versi RDS 8.0.x yang tepat wajib dipin dan diuji sebelum produksi.

## 1. Label normatif dan sumber kebenaran

- **REQUIRED:** wajib untuk kontrak, integritas, keamanan, atau operasional.
- **DESIGN DECISION:** keputusan target final yang mengikat sampai direvisi melalui review kontrak/ADR.
- **ASSUMPTION:** default aman dan reversibel yang masih membutuhkan keputusan domain.
- **OPTIONAL:** dapat ditunda tanpa mematahkan alur inti.
- **OPEN QUESTION:** belum final dan tidak boleh disamarkan sebagai perilaku yang sudah diterapkan.
- **VERIFIED ACTUAL STATE:** fakta yang diverifikasi dari repository saat dokumen ini direkonsiliasi.
- **APPROVED TARGET:** arsitektur tujuan yang disetujui, tetapi belum terbukti terimplementasi.

### 1.1 Hierarki sumber

Jika sumber bertentangan, urutannya adalah:

1. Keputusan produk final pada pekerjaan ini: standalone full-stack, NestJS + Prisma, Amazon RDS MySQL 8, global member, banyak akun owner/admin, dan isolasi berbasis owner/resource serta histori reservasi.
2. Dokumen ini untuk desain persistence target dan aturan member-scope final.
3. Kontrak API kanonis [`openapi.yaml`](openapi.yaml) dan [`api-contract.md`](api-contract.md), sejauh tidak bertentangan dengan keputusan final di atas.
4. Aturan domain [`business-rules.md`](business-rules.md), autentikasi/otorisasi [`authentication-and-authorization.md`](authentication-and-authorization.md), keamanan [`security-and-validation.md`](security-and-validation.md), dan pengujian [`testing-strategy.md`](testing-strategy.md), dengan konflik eksplisit dicatat di sini.
5. Kebutuhan UKK [`../../Rev_Soal_UKK_2026-2027_Paket_B%20%281%29.md`](../../Rev_Soal_UKK_2026-2027_Paket_B%20%281%29.md) dan traceability [`requirements-traceability.md`](requirements-traceability.md).
6. Kebutuhan frontend yang memengaruhi persistence [`../../Frontendbooking/docs/DESIGN.md`](../../Frontendbooking/docs/DESIGN.md).
7. Baseline ERD hasil transkripsi yang dipertahankan di bagian 3.

**Pengecualian historis yang disengaja:** endpoint App Maker dan header kredensial khususnya adalah infrastruktur ujian, bukan bagian produk standalone ini; karena itu keduanya tidak dimodelkan. Dokumen API/OpenAPI yang masih menggambarkan kemampuan tersebut atau asumsi tenant yang lebih luas saat ini **stale** dan tidak boleh dipakai untuk menyimpulkan bahwa database mendukungnya.

**REQUIRED:** OpenAPI mengatur wire contract, bukan bentuk tabel. Model Prisma tidak boleh diserialisasi langsung sebagai DTO.

### 1.2 Konflik dokumentasi yang diselesaikan

- Target lama berorientasi tenant telah dibatalkan. Target final memakai data akun/member global dan ownership langsung pada `space_owner`.
- Scope admin terhadap member bukan daftar keanggotaan. Scope hanya berasal dari keberadaan minimal satu `reservasi` antara member dan owner admin tersebut.
- Status reservasi tidak memengaruhi visibility. `dibatalkan` tetap berarti “pernah reservasi”.
- Registrasi bantuan admin tidak menciptakan hubungan permanen dengan owner.
- Kontrak DELETE member dipertahankan pada route/status surface, tetapi perilakunya selalu konflik `409`; tidak ada delete maupun archive member oleh admin.
- Dokumen keamanan lama yang menyatakan source/runtime tidak tersedia sudah tidak akurat: skeleton NestJS dan konfigurasi TypeORM ada, sedangkan fitur bisnis dan schema target belum ada.
- Target historis PostgreSQL telah ditolak. Tidak ada sintaks PostgreSQL aktif dalam desain ini.

## 2. VERIFIED ACTUAL STATE versus APPROVED TARGET

### 2.1 VERIFIED ACTUAL STATE

| Area | Keadaan aktual terverifikasi | Bukti repository |
|---|---|---|
| Framework | Skeleton NestJS tersedia | `src/app.module.ts` |
| ORM runtime | TypeORM menginisialisasi driver `mysql`, `autoLoadEntities: true`, `synchronize: false` | `src/app.module.ts` |
| Dependency TypeORM | `@nestjs/typeorm@12.0.1` dan `typeorm@1.1.1` tercantum | `package.json`, lockfile |
| Dependency Prisma | Client stabil dan CLI prerelease berada pada versi yang tidak sama | `package.json`, lockfile |
| Schema/migrasi Prisma | Belum ada schema executable atau migration history Prisma | repository saat inspeksi desain sebelumnya |
| Entity/migrasi TypeORM | Belum ada entity bisnis atau migration history yang membuktikan schema target | source yang tersedia |
| Database fisik | Keberadaan schema RDS tidak diverifikasi; credential tidak dibaca atau diungkap | batas audit keamanan |
| Fitur bisnis | Endpoint, auth, authorization, dan transaction flow target belum terbukti terimplementasi | source yang tersedia |

**Kesimpulan aktual:** runtime saat ini masih **TypeORM + MySQL**. Paket Prisma yang terpasang tidak membuat Prisma aktif. Tidak ada klaim bahwa desain target, constraint, query scope, atau migration berikut sudah berjalan.

### 2.2 APPROVED TARGET

1. Satu proyek full-stack standalone; tidak ada control-plane tenant eksternal.
2. Prisma menjadi satu-satunya ORM runtime dan satu-satunya pemilik migrasi.
3. TypeORM dihapus setelah cutover Prisma terbukti; dua ORM tidak boleh menulis schema yang sama.
4. `prisma` dan `@prisma/client` dipin ke versi stabil yang sama persis.
5. MySQL 8.0.16+ dengan InnoDB berjalan di Amazon RDS private subnet.
6. Entitas target tepat: `users`, `member`, `space_owner`, `space`, `diskon`, `reservasi`, `detail_reservasi`, `reservation_qr` (opsional), `idempotency_request`, dan `media_upload`.
7. Banyak akun `space_owner`/admin didukung. Setiap admin hanya mengelola resource owner miliknya.
8. `users` dan `member` bersifat global. Username unik secara global setelah normalisasi.
9. Visibility member oleh admin hanya berdasarkan histori `reservasi.id_owner + reservasi.id_member`.
10. Media berada di S3; database menyimpan object key dan ledger, bukan binary atau signed URL permanen.
11. Satu CI/CD migration job menjalankan DDL dengan principal terpisah; runtime API tidak memiliki privilege DDL.
12. Instan disimpan UTC pada `DATETIME(3)`; tanggal/jam reservasi bisnis disimpan `DATE` + `TIME(0)` dan diinterpretasi dengan satu business timezone terkonfigurasi.

## 3. Baseline ERD: entitas dan field sumber

Baseline berikut dipertahankan untuk traceability. `password` harus berisi hash adaptif saat diimplementasikan, bukan plaintext.

```mermaid
erDiagram
    users ||--o| member : id_user
    users ||--o| space_owner : id_user
    space_owner ||--o{ space : id_owner
    space_owner ||--o{ reservasi : id_owner
    member ||--o{ reservasi : id_member
    reservasi ||--|| detail_reservasi : id_reservasi
    space ||--o{ detail_reservasi : id_space
    diskon o|--o{ detail_reservasi : id_diskon

    users {
      bigint id PK
      varchar username
      varchar password
      varchar role
    }
    member {
      bigint id PK
      varchar nama_member
      varchar instansi
      text alamat
      varchar telp
      bigint id_user FK
      varchar foto
    }
    space_owner {
      bigint id PK
      varchar nama_coworking
      varchar nama_pemilik
      varchar telp
      bigint id_user FK
    }
    space {
      bigint id PK
      varchar nama_space
      bigint harga_per_jam
      varchar tipe
      int kapasitas
      varchar foto
      text deskripsi
      bigint id_owner FK
    }
    diskon {
      bigint id PK
      varchar nama_diskon
      int persentase_diskon
      datetime tanggal_awal
      datetime tanggal_akhir
    }
    reservasi {
      bigint id PK
      date tanggal_reservasi
      time jam_mulai
      int durasi_jam
      bigint id_owner FK
      bigint id_member FK
      varchar status
    }
    detail_reservasi {
      bigint id PK
      bigint id_reservasi FK_UK
      bigint id_space FK
      bigint id_diskon FK_NULL
      bigint total_harga
    }
```

Baseline mendefinisikan satu account paling banyak satu profile, owner memiliki space/reservasi, member memiliki reservasi, dan satu reservasi mempunyai satu detail.

## 4. Keputusan bisnis dan analisis gap

| Area baseline | Gap | Target final | Alasan bisnis/teknis |
|---|---|---|---|
| Username tanpa constraint | login ambigu dan race duplikat | normalisasi ke field `username`, lalu unique global | akun adalah global pada aplikasi standalone |
| Role tanpa constraint | role liar/profile salah | `CHECK`, `role_guard`, FK komposit user-role | defense-in-depth satu account–satu profile |
| Profile tanpa unique user | profil ganda | unique `id_user` pada kedua tabel profile | identitas tunggal |
| Banyak admin owner | resource dapat bocor antar-owner | setiap query resource memakai `id_owner` dari profile token | authorization tidak bergantung UI |
| Member global | admin bisa melihat seluruh direktori | visibility hanya `EXISTS reservasi` untuk owner tersebut | meminimalkan penyebaran PII dan sesuai hubungan bisnis nyata |
| Assisted registration | pencipta dianggap otomatis memiliki member | create user+member atomik, tetapi tanpa visibility sampai reservasi pertama | pembuatan akun bukan bukti hubungan transaksi |
| Member update/delete | mass assignment dan penghapusan global oleh satu owner | PUT whitelist profile dan hanya bila visible; DELETE selalu 409 | satu owner tidak boleh merusak identitas global yang dipakai owner lain |
| `foto` path bebas | traversal/overwrite/object yatim | server-generated S3 key + `media_upload` ledger | lifecycle dapat direkonsiliasi |
| `space` tanpa archive/version | histori rusak dan lost update | audit, `archived_at`, `version` | archive master, optimistic concurrency |
| `diskon` global | promo lintas owner | `id_owner` wajib dan unique nama per owner | promo adalah resource owner |
| Reservasi tanpa jam akhir/kode | overlap dan e-ticket lemah | `kode_booking`, `jam_selesai`, `id_space` | locking dan DTO deterministik |
| Satu detail hanya konseptual | aggregate parsial | unique detail + create transaction + integrity monitor | DB menjamin maksimum satu; service menjamin minimum satu |
| Harga/master mutable | histori berubah | snapshot harga, promo, space, coworking, dan PII e-ticket | audit/report/e-ticket tetap historis |
| Tidak ada replay protection | retry menggandakan booking | optional request key dengan scope `principal_user_id + route + key_hash` | standalone dan principal-bound |
| Tidak ada overlap atomik | double booking | lock row `space` dengan `SELECT ... FOR UPDATE` | mutex per-resource yang kompatibel MySQL |
| Tidak ada retention | PII terlalu cepat/lama disimpan | archive master dan retention eksplisit | kebutuhan legal/operasional belum final |

### 4.1 Rationale normatif scope member admin

`member` adalah identitas global yang dapat bertransaksi dengan lebih dari satu owner. Tidak ada tabel keanggotaan atau grant. Hubungan admin-member hanya dibuktikan oleh histori transaksi:

```text
visible(admin_owner, member) := EXISTS reservasi
  WHERE reservasi.id_member = member.id
    AND reservasi.id_owner = authenticated_admin_owner.id
```

Konsekuensi wajib:

- Seluruh status, termasuk `dibatalkan`, dihitung sebagai “pernah reservasi”. Query scope **tidak boleh** memiliki predicate status.
- Assisted registration hanya mempermudah pembuatan akun global; ia tidak menghasilkan ownership atau visibility.
- Setelah `POST /api/admin/members` sukses `201`, member baru tetap tidak muncul pada list, detail, atau PUT admin pembuat sampai ada reservasi pertama dengan owner tersebut.
- Owner A tidak dapat melihat/mengubah member yang hanya pernah reservasi pada owner B.
- Setelah histori pertama ada, membatalkan reservasi tidak mencabut visibility. Menghapus histori untuk mencabut visibility dilarang oleh retention transaksi normal.
- Detail dan PUT di luar scope mengembalikan `404`, bukan `403`, agar endpoint tidak menjadi oracle ID member global.
- DELETE selalu `409` untuk ID valid, tidak valid, visible, maupun tidak visible. Response tidak boleh mengungkap keberadaan member; format error harus seragam sejauh kontrak memungkinkan.

## 5. Konvensi MySQL 8 dan Prisma

1. Semua tabel `ENGINE=InnoDB` dan `CHARACTER SET utf8mb4`.
2. Collation natural text direkomendasikan `utf8mb4_0900_ai_ci`. Username dinormalisasi aplikasi dengan Unicode normalization yang dipin, trim, dan lowercase; hasil ditulis kembali ke kolom sumber `username`. Unique `users(username)` adalah otoritas race-safe.
3. Perubahan algoritme normalisasi adalah migrasi data/kontrak, bukan perubahan utilitas tanpa review.
4. PK/FK menggunakan `BIGINT UNSIGNED`; Prisma memakai `BigInt @db.UnsignedBigInt`.
5. Uang IDR memakai `BIGINT UNSIGNED`, tanpa floating point.
6. Instan memakai `DATETIME(3)` UTC. Tanggal bisnis memakai `DATE`; jam lokal bisnis memakai `TIME(0)`.
7. Interval booking setengah-terbuka `[jam_mulai,jam_selesai)`.
8. `created_at` memakai `DEFAULT CURRENT_TIMESTAMP(3)` dan SQL final harus memastikan `updated_at` memakai `ON UPDATE CURRENT_TIMESTAMP(3)` bila write non-Prisma tetap perlu tercatat.
9. Semua koneksi menetapkan UTC, strict SQL mode, transaction isolation, lock timeout, connection timeout, dan query timeout yang dipin.
10. `CHECK`, alternate unique, composite FK, collation, dan generated SQL wajib diaudit. Jangan menganggap Prisma dapat mengekspresikan semua invariant.
11. `prisma db push` dilarang pada staging/production. Gunakan migration history yang direview.
12. BigInt hanya diserialisasi sebagai JSON number bila safe range dijamin; jika tidak, kontrak ID harus menjadi string sebelum produksi.

## 6. Target ERD

```mermaid
erDiagram
    users ||--o| member : member_profile
    users ||--o| space_owner : owner_profile
    users ||--o{ idempotency_request : submits
    users ||--o{ media_upload : uploads
    space_owner ||--o{ space : owns
    space_owner ||--o{ diskon : owns
    space_owner ||--o{ reservasi : manages
    space_owner o|--o{ media_upload : audit_scope
    member ||--o{ reservasi : books
    space ||--o{ reservasi : mutex_target
    reservasi ||--o| detail_reservasi : app_requires_exactly_one
    space ||--o{ detail_reservasi : snapshot_source
    diskon o|--o{ detail_reservasi : applied
    reservasi ||--o| reservation_qr : future_optional
    reservasi o|--o| idempotency_request : result

    users {
      bigint id PK
      varchar username UK
      varchar password
      varchar role
      datetime created_at
      datetime updated_at
      datetime archived_at
    }
    member {
      bigint id PK
      bigint id_user FK_UK
      varchar role_guard
      varchar nama_member
      varchar instansi
      text alamat
      varchar telp
      varchar foto
      datetime created_at
      datetime updated_at
      datetime archived_at
    }
    space_owner {
      bigint id PK
      bigint id_user FK_UK
      varchar role_guard
      varchar nama_coworking
      varchar nama_pemilik
      varchar telp
      text alamat
      text deskripsi_fasilitas
      datetime created_at
      datetime updated_at
      datetime archived_at
    }
    space {
      bigint id PK
      bigint id_owner FK
      varchar nama_space
      bigint harga_per_jam
      varchar tipe
      int kapasitas
      varchar foto
      text deskripsi
      int version
      datetime created_at
      datetime updated_at
      datetime archived_at
    }
    diskon {
      bigint id PK
      bigint id_owner FK
      varchar nama_diskon UK
      int persentase_diskon
      datetime tanggal_awal
      datetime tanggal_akhir
      int version
      datetime created_at
      datetime updated_at
      datetime archived_at
    }
    reservasi {
      bigint id PK
      bigint id_owner FK
      bigint id_member FK
      bigint id_space FK
      varchar kode_booking UK
      date tanggal_reservasi
      time jam_mulai
      time jam_selesai
      int durasi_jam
      varchar status
      datetime check_in_at
      datetime check_out_at
      int version
      datetime created_at
      datetime updated_at
    }
    detail_reservasi {
      bigint id PK
      bigint id_owner
      bigint id_reservasi FK_UK
      bigint id_space FK
      bigint id_diskon FK_NULL
      bigint harga_per_jam
      bigint total_harga_awal
      bigint potongan_diskon
      bigint total_harga
      int persentase_diskon
      varchar nama_diskon_snapshot
      varchar nama_space_snapshot
      varchar tipe_space_snapshot
      varchar nama_coworking_snapshot
      varchar telp_coworking_snapshot
      varchar nama_member_snapshot
      varchar instansi_member_snapshot
      varchar telp_member_snapshot
      datetime created_at
      datetime updated_at
    }
    reservation_qr {
      bigint id PK
      bigint id_owner
      bigint id_reservasi FK_UK
      char token_hash UK
      datetime expires_at
      datetime used_at
      datetime created_at
      datetime updated_at
    }
    idempotency_request {
      bigint id PK
      bigint principal_user_id FK
      varchar route
      char key_hash
      char request_hash
      varchar state
      int response_status
      json response_body
      bigint reservation_id FK_NULL
      datetime expires_at
      datetime created_at
      datetime updated_at
    }
    media_upload {
      bigint id PK
      bigint uploader_user_id FK
      bigint owner_id FK_NULL
      varchar purpose
      varchar object_key UK
      varchar original_name
      varchar mime_type
      bigint size_bytes
      char checksum_sha256
      varchar status
      varchar attached_entity_type
      bigint attached_entity_id
      datetime expires_at
      datetime created_at
      datetime updated_at
      datetime deleted_at
    }
```

## 7. Kamus data

Klasifikasi: **PUB** publik, **INT** internal, **PII** data pribadi, **AUTH** credential, **FIN** finansial, **OPS** operasional. `NN` berarti `NOT NULL`; `N` nullable.

### 7.1 `users`

| Field | MySQL | Null/constraint | Klasifikasi | Aturan |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | NN PK auto increment | INT | dipertahankan untuk histori |
| `username` | `VARCHAR(100)` | NN unique global | PII/AUTH | source field; simpan hasil normalisasi |
| `password` | `VARCHAR(255)` | NN | AUTH | Argon2id hash; tidak pernah keluar DTO/log |
| `role` | `VARCHAR(20)` | NN CHECK `member|admin_space` | AUTH/INT | immutable pada workflow biasa |
| `created_at` | `DATETIME(3)` | NN UTC | INT | immutable |
| `updated_at` | `DATETIME(3)` | NN UTC | INT | setiap mutasi |
| `archived_at` | `DATETIME(3)` | N UTC | INT | archive menonaktifkan login |

Unique `(id,role)` ditambahkan untuk role-bound FK profile. Global username berarti assisted registration dengan username yang sudah dipakai harus gagal `409` tanpa membuat profile parsial.

### 7.2 `member`

| Field | MySQL | Null/constraint | Klasifikasi | Aturan |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | NN PK | INT | ID global member |
| `id_user` | `BIGINT UNSIGNED` | NN unique, FK user | INT | satu account satu profile |
| `role_guard` | `VARCHAR(20)` | NN default/check `member` | INT | FK ke `(users.id,users.role)` |
| `nama_member` | `VARCHAR(200)` | NN trim non-empty | PII | mutable oleh member atau admin visible sesuai kontrak |
| `instansi` | `VARCHAR(200)` | NN trim non-empty | PII | mutable |
| `alamat` | `TEXT` | NN non-empty | PII | mutable |
| `telp` | `VARCHAR(32)` | NN normalized | PII | mutable |
| `foto` | `VARCHAR(512)` | N | PII/INT | attached S3 object key |
| `created_at` | `DATETIME(3)` | NN UTC | INT | immutable |
| `updated_at` | `DATETIME(3)` | NN UTC | INT | setiap mutasi |
| `archived_at` | `DATETIME(3)` | N UTC | INT | bukan operasi DELETE admin |

Tidak ada owner field pada member. Visibility admin tidak dapat diturunkan dari creator, uploader, atau audit metadata.

### 7.3 `space_owner`

| Field | MySQL | Null/constraint | Klasifikasi | Aturan |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | NN PK | INT | scope owner kanonis |
| `id_user` | `BIGINT UNSIGNED` | NN unique, FK user | INT | satu akun admin satu profile owner |
| `role_guard` | `VARCHAR(20)` | NN default/check `admin_space` | INT | FK role-bound |
| `nama_coworking` | `VARCHAR(200)` | NN non-empty | PUB | disnapshot saat booking |
| `nama_pemilik` | `VARCHAR(200)` | NN non-empty | PII | mutable |
| `telp` | `VARCHAR(32)` | NN normalized | PII | disnapshot untuk e-ticket |
| `alamat` | `TEXT` | N | PII/PUB | extension kontrak |
| `deskripsi_fasilitas` | `TEXT` | N | PUB | extension kontrak |
| `created_at` | `DATETIME(3)` | NN UTC | INT | immutable |
| `updated_at` | `DATETIME(3)` | NN UTC | INT | setiap mutasi |
| `archived_at` | `DATETIME(3)` | N UTC | INT | menonaktifkan operasi owner |

### 7.4 `space`

| Field | MySQL | Null/constraint | Klasifikasi | Aturan |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | NN PK | PUB | resource ID |
| `id_owner` | `BIGINT UNSIGNED` | NN FK owner | INT | immutable; selalu dari auth scope pada admin write |
| `nama_space` | `VARCHAR(200)` | NN non-empty | PUB | disnapshot |
| `harga_per_jam` | `BIGINT UNSIGNED` | NN CHECK >=0 | FIN/PUB | disnapshot |
| `tipe` | `VARCHAR(30)` | NN enum check | PUB | disnapshot |
| `kapasitas` | `INT UNSIGNED` | NN CHECK >0 | PUB | mutable |
| `foto` | `VARCHAR(512)` | N | PUB/INT | attached S3 key |
| `deskripsi` | `TEXT` | NN non-empty | PUB | plain text |
| `version` | `INT UNSIGNED` | NN default 1 CHECK >=1 | INT | optimistic concurrency |
| audit/archive | `DATETIME(3)` | UTC | INT | `created_at`, `updated_at`, `archived_at` |

Alternate unique `(id,id_owner)` mendukung owner-consistent composite FK.

### 7.5 `diskon`

| Field | MySQL | Null/constraint | Klasifikasi | Aturan |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | NN PK | PUB | resource ID |
| `id_owner` | `BIGINT UNSIGNED` | NN FK owner | INT | owner scope |
| `nama_diskon` | `VARCHAR(100)` | NN unique per owner | PUB | trim + uppercase policy |
| `persentase_diskon` | `TINYINT UNSIGNED` | NN CHECK 1..100 | FIN/PUB | disnapshot |
| `tanggal_awal` | `DATETIME(3)` | NN UTC inclusive | PUB | awal aktif |
| `tanggal_akhir` | `DATETIME(3)` | NN UTC inclusive, >= awal | PUB | akhir aktif |
| `version` | `INT UNSIGNED` | NN default 1 | INT | optimistic concurrency |
| audit/archive | `DATETIME(3)` | UTC | INT | lifecycle master |

Alternate unique `(id,id_owner)` dan unique `(id_owner,nama_diskon)` wajib.

### 7.6 `reservasi`

| Field | MySQL | Null/constraint | Klasifikasi | Aturan |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | NN PK | INT | history, no normal hard delete |
| `id_owner` | `BIGINT UNSIGNED` | NN FK owner | INT | diturunkan dari space, bukan body bebas |
| `id_member` | `BIGINT UNSIGNED` | NN FK member | PII/INT | member principal/assisted flow yang sah |
| `id_space` | `BIGINT UNSIGNED` | NN owner-consistent FK | INT | mutex target |
| `kode_booking` | `VARCHAR(64)` ASCII | NN unique | OPS | server-generated berentropy cukup |
| `tanggal_reservasi` | `DATE` | NN | OPS | business date |
| `jam_mulai` | `TIME(0)` | NN | OPS | interval start |
| `jam_selesai` | `TIME(0)` | NN CHECK > mulai | OPS | dihitung server |
| `durasi_jam` | `SMALLINT UNSIGNED` | NN CHECK >=1 | OPS | harus konsisten dengan waktu |
| `status` | `VARCHAR(30)` | NN enum check | OPS | state machine |
| `check_in_at` | `DATETIME(3)` | N UTC | OPS | sekali isi |
| `check_out_at` | `DATETIME(3)` | N UTC | OPS | >= check-in |
| `version` | `INT UNSIGNED` | NN default 1 | INT | stale-write guard |
| `created_at`,`updated_at` | `DATETIME(3)` | NN UTC | INT | audit |

Unique `(id,id_owner)` dan `(id,id_owner,id_space)` mendukung child consistency. Index `(id_owner,id_member)` adalah dasar visibility member dan sengaja tidak menyertakan status.

### 7.7 `detail_reservasi`

| Field | MySQL | Null/constraint | Klasifikasi | Aturan |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | NN PK | INT | history |
| `id_owner` | `BIGINT UNSIGNED` | NN | INT | consistency guard |
| `id_reservasi` | `BIGINT UNSIGNED` | NN unique | INT | maksimum satu detail |
| `id_space` | `BIGINT UNSIGNED` | NN | INT | harus sama dengan reservasi |
| `id_diskon` | `BIGINT UNSIGNED` | N | INT | bila ada harus owner-consistent |
| `harga_per_jam` | `BIGINT UNSIGNED` | NN | FIN | immutable snapshot |
| `total_harga_awal` | `BIGINT UNSIGNED` | NN | FIN | immutable snapshot |
| `potongan_diskon` | `BIGINT UNSIGNED` | NN default 0 | FIN | <= total awal |
| `total_harga` | `BIGINT UNSIGNED` | NN | FIN | awal - potongan |
| `persentase_diskon` | `TINYINT UNSIGNED` | N | FIN | all-null/all-present dengan promo |
| `nama_diskon_snapshot` | `VARCHAR(100)` | N | PUB/FIN | immutable |
| `nama_space_snapshot` | `VARCHAR(200)` | NN | PUB | immutable |
| `tipe_space_snapshot` | `VARCHAR(30)` | NN | PUB | immutable |
| `nama_coworking_snapshot` | `VARCHAR(200)` | NN | PUB | immutable |
| `telp_coworking_snapshot` | `VARCHAR(32)` | NN | PII | e-ticket PII |
| `nama_member_snapshot` | `VARCHAR(200)` | NN | PII | e-ticket PII |
| `instansi_member_snapshot` | `VARCHAR(200)` | NN | PII | e-ticket PII |
| `telp_member_snapshot` | `VARCHAR(32)` | NN | PII | e-ticket PII |
| `created_at`,`updated_at` | `DATETIME(3)` | NN UTC | INT | immutable/koreksi terkontrol |

History, e-ticket, dan report membaca snapshot, bukan nilai master terkini. Snapshot PII tidak boleh dicatat ke log dan tidak dianonimkan sebelum retention/legal-hold diputuskan.

### 7.8 `reservation_qr` — OPTIONAL

| Field | MySQL | Null/constraint | Klasifikasi | Aturan |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | NN PK | INT | mengikuti reservasi |
| `id_owner` | `BIGINT UNSIGNED` | NN | INT | owner consistency |
| `id_reservasi` | `BIGINT UNSIGNED` | NN unique | INT | satu record per reservasi |
| `token_hash` | `CHAR(64)` ASCII | NN unique | AUTH | raw token tidak disimpan |
| `expires_at` | `DATETIME(3)` | NN UTC | OPS | expiry |
| `used_at` | `DATETIME(3)` | N UTC | AUTH/OPS | hanya bermakna jika verify/consume disetujui |
| audit | `DATETIME(3)` | NN UTC | INT | create/update |

Kontrak check-in saat ini berbasis ID reservasi, bukan konsumsi token. Karena itu tabel ini tidak boleh diklaim memberikan binding kriptografis atau anti-replay aktif. Implementasi verify/consume membutuhkan perubahan kontrak, authorization owner, expiry check, constant-time digest comparison, dan consume atomik dengan check-in.

### 7.9 `idempotency_request`

| Field | MySQL | Null/constraint | Klasifikasi | Aturan |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | NN PK | INT | TTL terbatas |
| `principal_user_id` | `BIGINT UNSIGNED` | NN FK user | INT | scope identitas global |
| `route` | `VARCHAR(120)` | NN | INT | route template allowlist |
| `key_hash` | `CHAR(64)` ASCII | NN | AUTH | keyed digest; raw key tidak disimpan |
| `request_hash` | `CHAR(64)` ASCII | NN | AUTH/INT | canonical request fingerprint |
| `state` | `VARCHAR(20)` | NN `pending|completed` | OPS | transaction-bound |
| `response_status` | `SMALLINT UNSIGNED` | N | INT | wajib saat completed |
| `response_body` | `JSON` | N | INT | outcome aman tanpa secret/PII tak perlu |
| `reservation_id` | `BIGINT UNSIGNED` | N FK | INT | result sukses |
| `expires_at` | `DATETIME(3)` | NN UTC | OPS | cleanup window |
| audit | `DATETIME(3)` | NN UTC | INT | create/update |

Unique scope tepat `(principal_user_id,route,key_hash)`. `request_hash` bukan bagian scope; key sama dengan fingerprint berbeda menghasilkan `409`. Request tanpa key diproses normal tanpa jaminan replay.

### 7.10 `media_upload`

| Field | MySQL | Null/constraint | Klasifikasi | Aturan |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | NN PK | INT | ledger audit |
| `uploader_user_id` | `BIGINT UNSIGNED` | NN FK user | PII/INT | actor upload |
| `owner_id` | `BIGINT UNSIGNED` | N FK owner | INT | wajib untuk `space_photo`; optional audit scope lainnya |
| `purpose` | `VARCHAR(30)` | NN enum | INT | `member_photo|space_photo` |
| `object_key` | `VARCHAR(512)` ASCII | NN unique | INT | server-generated |
| `original_name` | `VARCHAR(255)` | NN | PII | sanitized basename, audit only |
| `mime_type` | `VARCHAR(100)` | NN | INT | hasil deteksi server |
| `size_bytes` | `BIGINT UNSIGNED` | NN CHECK 1..5242880 | INT | max 5 MiB |
| `checksum_sha256` | `CHAR(64)` ASCII | NN | AUTH/INT | content digest |
| `status` | `VARCHAR(20)` | NN | OPS | `staged|attached|deleted` |
| `attached_entity_type` | `VARCHAR(20)` | N | INT | `member|space` iff attached/deleted |
| `attached_entity_id` | `BIGINT UNSIGNED` | N | INT | polymorphic target |
| `expires_at` | `DATETIME(3)` | NN UTC | OPS | staged cleanup |
| audit/delete | `DATETIME(3)` | UTC | OPS | create/update/deleted |

`owner_id` pada ledger adalah authorization/audit scope media, bukan grant visibility member. Attach target polymorphic divalidasi service dalam transaksi dan direkonsiliasi periodik.

## 8. Integritas relasional dan ownership

### 8.1 Satu account–satu profile

- `users`: `UNIQUE(username)` dan `UNIQUE(id,role)`.
- `member`: `UNIQUE(id_user)`; `(id_user,role_guard)` FK ke `users(id,role)`; guard tepat `member`.
- `space_owner`: `UNIQUE(id_user)`; pola role FK yang sama; guard tepat `admin_space`.
- Registrasi membuat user dan satu profile yang sesuai dalam transaksi.
- MySQL tidak mempunyai assertion lintas tabel untuk minimum satu profile. Integrity monitor wajib mendeteksi user tanpa profile, kedua profile sekaligus, profile salah role, dan orphan.
- Role tidak diubah in-place. Workflow migrasi role berada di luar scope.

### 8.2 Owner/resource consistency

PK tetap `id`; alternate unique/composite FK berikut wajib:

- `space`: `UNIQUE(id,id_owner)` dan FK `id_owner → space_owner.id`.
- `diskon`: `UNIQUE(id,id_owner)` dan FK `id_owner → space_owner.id`.
- `reservasi`: `UNIQUE(id,id_owner)`, `UNIQUE(id,id_owner,id_space)`, FK `id_owner → space_owner.id`, FK `id_member → member.id`, dan FK `(id_space,id_owner) → space(id,id_owner)`.
- `detail_reservasi`: FK `(id_reservasi,id_owner,id_space) → reservasi(id,id_owner,id_space)`; FK `(id_space,id_owner) → space(id,id_owner)`; nullable FK `(id_diskon,id_owner) → diskon(id,id_owner)`.
- `reservation_qr`: FK `(id_reservasi,id_owner) → reservasi(id,id_owner)`.
- `idempotency_request`: FK principal ke user dan nullable result ke reservasi.
- `media_upload`: FK uploader ke user dan nullable owner ke `space_owner`.

Database mencegah space, promo, reservasi, detail, dan QR tercampur antar-owner. Service tetap wajib menambahkan predicate `id_owner = authenticatedOwnerId` pada semua read/write resource owner agar ID valid milik owner lain menghasilkan `404` sebelum mutasi.

### 8.3 Tepat satu detail

Unique `detail_reservasi.id_reservasi` menjamin maksimum satu detail. Minimum satu dijamin dengan insert reservasi+detail dalam transaksi yang sama dan monitor berikut:

```sql
SELECT r.id
FROM reservasi AS r
LEFT JOIN detail_reservasi AS d ON d.id_reservasi = r.id
WHERE d.id IS NULL;
```

Deployment/backfill berhenti bila query menghasilkan row. Record tidak boleh diberi snapshot tebakan.

## 9. Kontrak data member admin

### 9.1 `POST /api/admin/members` — assisted registration

- Authorization: hanya user aktif role `admin_space` dengan profile owner aktif.
- Body menerima credential/profile sesuai DTO create yang disetujui; field internal, role alternatif, ID, archive, dan owner ditolak.
- Server memaksa `users.role='member'`, menormalisasi username, meng-hash password, lalu membuat `users` + `member` atomik.
- Unique username race dipetakan ke `409` aman.
- Sukses mengembalikan `201` dengan DTO member yang baru dibuat.
- Response create bukan bukti member dapat diambil kembali melalui GET admin. Sebelum reservasi pertama dengan owner pembuat, list tidak memuatnya dan detail/PUT mengembalikan `404`.
- Tidak ada row relasi/grant tambahan yang dibuat.

### 9.2 `GET /api/admin/members` — list dan count

List harus bounded (`LIMIT <= 100`), memiliki sort deterministic, dan memakai predicate `EXISTS` yang identik dengan count. Contoh keyset/default `m.id ASC`:

```sql
SELECT
  m.id,
  m.nama_member,
  m.instansi,
  m.alamat,
  m.telp,
  m.foto,
  m.created_at,
  m.updated_at
FROM member AS m
JOIN users AS u
  ON u.id = m.id_user
WHERE m.archived_at IS NULL
  AND u.archived_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM reservasi AS r
    WHERE r.id_member = m.id
      AND r.id_owner = :authenticated_owner_id
  )
  AND (:after_id IS NULL OR m.id > :after_id)
ORDER BY m.id ASC
LIMIT :page_size;
```

```sql
SELECT COUNT(*) AS total
FROM member AS m
JOIN users AS u
  ON u.id = m.id_user
WHERE m.archived_at IS NULL
  AND u.archived_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM reservasi AS r
    WHERE r.id_member = m.id
      AND r.id_owner = :authenticated_owner_id
  );
```

Search optional harus menggunakan parameter binding dan allowlist kolom. Jika kontrak memerlukan substring search, ukur dengan `EXPLAIN ANALYZE`; jangan mengasumsikan B-tree melayani `%term%`.

### 9.3 `GET /api/admin/members/:id` — detail scope

```sql
SELECT
  m.id,
  m.nama_member,
  m.instansi,
  m.alamat,
  m.telp,
  m.foto,
  m.created_at,
  m.updated_at
FROM member AS m
JOIN users AS u
  ON u.id = m.id_user
WHERE m.id = :member_id
  AND m.archived_at IS NULL
  AND u.archived_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM reservasi AS r
    WHERE r.id_member = m.id
      AND r.id_owner = :authenticated_owner_id
  )
LIMIT 1;
```

Tidak ditemukan, archived, atau out-of-scope semuanya dipetakan ke `404` yang sama.

### 9.4 `PUT /api/admin/members/:id` — scoped profile update

Whitelist persis: `nama_member`, `instansi`, `alamat`, `telp`, `foto`. Tolak `username`, `password`, `role`, semua `id`, owner field, `archived_at`, audit field, dan properti tak dikenal. Jangan silently ignore mass assignment.

Contoh SQL atomic scope enforcement:

```sql
UPDATE member AS m
SET
  m.nama_member = :nama_member,
  m.instansi = :instansi,
  m.alamat = :alamat,
  m.telp = :telp,
  m.foto = :validated_attached_object_key,
  m.updated_at = CURRENT_TIMESTAMP(3)
WHERE m.id = :member_id
  AND m.archived_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM reservasi AS r
    WHERE r.id_member = m.id
      AND r.id_owner = :authenticated_owner_id
  );
```

`affectedRows=0` harus diikuti scoped read yang aman bila perlu membedakan no-op update dari not-found; jangan gunakan unscoped existence check yang mengubah response/timing menjadi oracle. Alternatif yang direkomendasikan untuk replace foto: transaction `SELECT` detail scoped `FOR UPDATE`, lock ledger media, validate attach target, lalu update profile dan ledger atomik. Owner admin dapat mengubah global profile yang terlihat; keputusan ini berdampak ke owner lain dan karena itu harus diaudit dengan actor user ID. Snapshot reservasi lama tidak berubah.

### 9.5 `DELETE /api/admin/members/:id`

Endpoint dipertahankan agar contract-compatible, tetapi selalu mengembalikan `409 Conflict`. Ia tidak menghapus user, tidak menghapus member, tidak mengisi `archived_at`, tidak mencabut login, dan tidak mengubah reservasi/media. Pesan aman yang disarankan: member global tidak dapat dihapus oleh admin owner. Perilaku seragam wajib diuji untuk visible, out-of-scope, dan ID tidak ada.

## 10. CHECK constraints dan state machine

CHECK wajib:

- role `member|admin_space` dan profile guard tepat;
- tipe `desk|meeting_room|private_office`;
- status `belum_dikonfirm|disetujui|aktif|selesai|dibatalkan`;
- uang nonnegatif, potongan <= total awal, total = awal - potongan;
- tanpa promo berarti potongan nol dan snapshot promo null;
- kapasitas > 0, durasi >= 1, version >= 1;
- persen promo 1..100 dan akhir >= awal;
- jam selesai > mulai karena booking lintas hari tidak didukung;
- check-out hanya setelah check-in;
- idempotency pending/completed konsisten;
- media purpose/status/size/attachment/deleted timestamp konsisten.

| Dari | Ke legal | Efek slot |
|---|---|---|
| `belum_dikonfirm` | `disetujui`, `dibatalkan` | tetap blok / lepas blok |
| `disetujui` | `aktif`, `dibatalkan` | tetap blok / lepas blok |
| `aktif` | `selesai` | lepas blok |
| `selesai` | tidak ada | terminal |
| `dibatalkan` | tidak ada | terminal, tetapi tetap memberi visibility member |

Status pemblokir: `belum_dikonfirm`, `disetujui`, `aktif`. Semua create/status/cancel/check-in/check-out yang memengaruhi availability lock row space yang sama.

## 11. Index dan pola query

| Index/unique | Tujuan |
|---|---|
| `users(username)` unique | login/register global race-safe |
| `users(id,role)` unique | role-bound profile FK |
| `member(id_user)` unique | satu profile |
| `member(archived_at,id)` | bounded global maintenance; bukan authorization |
| `space_owner(id_user)` unique | token user → owner profile |
| `space(id,id_owner)` unique | composite ownership FK |
| `space(id_owner,archived_at,tipe,id)` | katalog/list admin owner |
| `diskon(id,id_owner)` unique | owner-consistent FK |
| `diskon(id_owner,nama_diskon)` unique | kode promo per owner |
| `diskon(id_owner,archived_at,tanggal_awal,tanggal_akhir,id)` | promo aktif owner |
| `reservasi(id,id_owner,id_space)` unique | detail consistency |
| `reservasi(id_owner,id_member)` | member visibility `EXISTS`, semua status |
| `reservasi(id_owner,id_member,id)` | deterministic owner-member history bila diperlukan |
| `reservasi(id_space,tanggal_reservasi,status,jam_mulai,jam_selesai,id)` | overlap setelah mutex |
| `reservasi(id_member,tanggal_reservasi,id)` | history member |
| `reservasi(id_owner,tanggal_reservasi,status,id)` | filter/report owner |
| `reservasi(kode_booking)` unique | lookup e-ticket |
| `detail_reservasi(id_reservasi)` unique | maksimum satu detail |
| `detail_reservasi(id_owner,tipe_space_snapshot,id_reservasi)` | report tipe owner |
| `reservation_qr(token_hash)` unique | future verify/consume only |
| `idempotency_request(principal_user_id,route,key_hash)` unique | replay scope |
| `idempotency_request(expires_at,id)` | bounded cleanup |
| `media_upload(object_key)` unique | ledger object |
| `media_upload(status,expires_at,id)` | bounded cleanup |
| `media_upload(owner_id,attached_entity_type,attached_entity_id,status)` | reconciliation owner resource |
| `media_upload(uploader_user_id,created_at,id)` | audit uploader |

Index `reservasi(id_owner,id_member)` adalah kontrol performa penting untuk list/count/detail/update scope. Tidak ada filter status pada index prefix scope karena semua status harus dihitung.

## 12. Pencegahan double booking dan idempotency

### 12.1 Mutex MySQL

MySQL tidak menyediakan exclusion constraint rentang. Gunakan row `space` sebagai mutex:

1. Mulai transaksi dengan isolation yang dipin; `READ COMMITTED` direkomendasikan dan harus diuji.
2. Jika request key valid, claim/lock idempotency row.
3. Lock user/member yang relevan.
4. Lock `space` dengan owner consistency menggunakan `SELECT ... FOR UPDATE`.
5. Lock/validate promo owner bila ada.
6. Jalankan current locking read overlap.
7. Insert reservasi+detail+snapshot dan outcome idempotency atomik.
8. Commit sebelum response.

Predikat overlap:

```sql
SELECT id
FROM reservasi
WHERE id_space = :space_id
  AND tanggal_reservasi = :tanggal
  AND status IN ('belum_dikonfirm', 'disetujui', 'aktif')
  AND :requested_start < jam_selesai
  AND jam_mulai < :requested_end
LIMIT 1
FOR UPDATE;
```

Booking `[09:00,10:00)` dan `[10:00,11:00)` tidak konflik.

### 12.2 Transaction skeleton

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;

SELECT id, id_owner, harga_per_jam, tipe, nama_space, archived_at
FROM space
WHERE id = :space_id
  AND id_owner = :resolved_owner_id
FOR UPDATE;

SELECT id
FROM reservasi
WHERE id_space = :space_id
  AND tanggal_reservasi = :tanggal
  AND status IN ('belum_dikonfirm', 'disetujui', 'aktif')
  AND :requested_start < jam_selesai
  AND jam_mulai < :requested_end
LIMIT 1
FOR UPDATE;

-- INSERT reservasi dan tepat satu detail_reservasi.
-- Jika request berkunci, UPDATE idempotency_request menjadi completed.
COMMIT;
```

Semua parameter wajib binding driver/Prisma, bukan interpolasi.

### 12.3 Idempotency

- Scope unique: `(principal_user_id, route, key_hash)`.
- `key_hash` adalah keyed digest dari key tervalidasi; `request_hash` adalah fingerprint canonical body/parameter relevan.
- Duplicate key di-lock `FOR UPDATE`; fingerprint beda → `409`; completed sama → replay.
- Pending konkuren menunggu bounded. Crash sebelum commit menghapus pending melalui rollback, sehingga tidak perlu lease/takeover.
- Persist outcome `201` dan konflik overlap deterministik `409`; jangan persist 5xx, timeout, deadlock, dependency failure, 401/403, atau validation failure sebelum transaksi.
- Retry maksimum tiga attempt dengan exponential backoff+jitter dan total deadline. Gunakan key yang sama.

## 13. SQL constraint dan index contoh

Snippet ini pola MySQL 8, bukan migration lengkap.

```sql
ALTER TABLE users
  ADD CONSTRAINT uq_users_username UNIQUE (username),
  ADD CONSTRAINT uq_users_id_role UNIQUE (id, role),
  ADD CONSTRAINT chk_users_role
    CHECK (role IN ('member', 'admin_space'));

ALTER TABLE member
  ADD CONSTRAINT uq_member_user UNIQUE (id_user),
  ADD CONSTRAINT chk_member_role_guard CHECK (role_guard = 'member'),
  ADD CONSTRAINT fk_member_user_role
    FOREIGN KEY (id_user, role_guard)
    REFERENCES users (id, role)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE space_owner
  ADD CONSTRAINT uq_owner_user UNIQUE (id_user),
  ADD CONSTRAINT chk_owner_role_guard CHECK (role_guard = 'admin_space'),
  ADD CONSTRAINT fk_owner_user_role
    FOREIGN KEY (id_user, role_guard)
    REFERENCES users (id, role)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE space
  ADD CONSTRAINT uq_space_id_owner UNIQUE (id, id_owner),
  ADD CONSTRAINT chk_space_tipe
    CHECK (tipe IN ('desk', 'meeting_room', 'private_office')),
  ADD CONSTRAINT chk_space_harga CHECK (harga_per_jam >= 0),
  ADD CONSTRAINT chk_space_kapasitas CHECK (kapasitas > 0),
  ADD CONSTRAINT chk_space_version CHECK (version >= 1);

ALTER TABLE diskon
  ADD CONSTRAINT uq_diskon_id_owner UNIQUE (id, id_owner),
  ADD CONSTRAINT uq_diskon_owner_nama UNIQUE (id_owner, nama_diskon),
  ADD CONSTRAINT chk_diskon_persen CHECK (persentase_diskon BETWEEN 1 AND 100),
  ADD CONSTRAINT chk_diskon_periode CHECK (tanggal_akhir >= tanggal_awal);

ALTER TABLE reservasi
  ADD CONSTRAINT uq_reservasi_id_owner UNIQUE (id, id_owner),
  ADD CONSTRAINT uq_reservasi_scope_space UNIQUE (id, id_owner, id_space),
  ADD CONSTRAINT fk_reservasi_space_owner
    FOREIGN KEY (id_space, id_owner)
    REFERENCES space (id, id_owner)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT chk_reservasi_status
    CHECK (status IN ('belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan')),
  ADD CONSTRAINT chk_reservasi_waktu CHECK (jam_selesai > jam_mulai),
  ADD CONSTRAINT chk_reservasi_durasi CHECK (durasi_jam >= 1),
  ADD CONSTRAINT chk_reservasi_checkout
    CHECK (check_out_at IS NULL OR (check_in_at IS NOT NULL AND check_out_at >= check_in_at));

ALTER TABLE detail_reservasi
  ADD CONSTRAINT uq_detail_reservasi UNIQUE (id_reservasi),
  ADD CONSTRAINT fk_detail_reservasi_scope
    FOREIGN KEY (id_reservasi, id_owner, id_space)
    REFERENCES reservasi (id, id_owner, id_space)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT fk_detail_space_scope
    FOREIGN KEY (id_space, id_owner)
    REFERENCES space (id, id_owner)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT fk_detail_diskon_scope
    FOREIGN KEY (id_diskon, id_owner)
    REFERENCES diskon (id, id_owner)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT chk_detail_total
    CHECK (
      total_harga_awal >= 0
      AND potongan_diskon <= total_harga_awal
      AND total_harga = total_harga_awal - potongan_diskon
      AND (id_diskon IS NOT NULL OR potongan_diskon = 0)
    ),
  ADD CONSTRAINT chk_detail_promo_snapshot
    CHECK (
      (id_diskon IS NULL AND persentase_diskon IS NULL AND nama_diskon_snapshot IS NULL)
      OR
      (id_diskon IS NOT NULL AND persentase_diskon BETWEEN 1 AND 100 AND nama_diskon_snapshot IS NOT NULL)
    );

CREATE INDEX idx_reservasi_member_scope
  ON reservasi (id_owner, id_member);

CREATE INDEX idx_reservasi_overlap
  ON reservasi (
    id_space,
    tanggal_reservasi,
    status,
    jam_mulai,
    jam_selesai,
    id
  );

CREATE INDEX idx_reservasi_owner_filter
  ON reservasi (id_owner, tanggal_reservasi, status, id);

CREATE UNIQUE INDEX uq_idempotency_scope
  ON idempotency_request (principal_user_id, route, key_hash);
```

Nullable composite FK promo harus diuji pada exact MySQL/Prisma version: ketika `id_diskon` null, FK tidak memvalidasi pasangan; CHECK all-null/all-present menjaga semantik snapshot.

## 14. Conceptual Prisma schema

> **DESIGN DECISION:** schema ini konseptual untuk review relasi/mapping, bukan bukti executable. Bentuk `generator`/`datasource`, lokasi URL, native type, relation ambiguity, dan driver adapter bergantung versi Prisma stabil yang dipin. Final schema wajib `validate`/`generate`; SQL migration wajib direview untuk `CHECK`, composite FK, collation, dan timestamp behavior.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id                  BigInt               @id @default(autoincrement()) @db.UnsignedBigInt
  username            String               @unique @db.VarChar(100)
  password            String               @db.VarChar(255)
  role                String               @db.VarChar(20)
  createdAt           DateTime             @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt           DateTime             @updatedAt @map("updated_at") @db.DateTime(3)
  archivedAt          DateTime?            @map("archived_at") @db.DateTime(3)
  memberProfile       Member?
  ownerProfile        SpaceOwner?
  idempotencyRequests IdempotencyRequest[]
  mediaUploads        MediaUpload[]

  @@unique([id, role], map: "uq_users_id_role")
  @@map("users")
}

model Member {
  id           BigInt        @id @default(autoincrement()) @db.UnsignedBigInt
  userId       BigInt        @unique @map("id_user") @db.UnsignedBigInt
  roleGuard    String        @default("member") @map("role_guard") @db.VarChar(20)
  namaMember   String        @map("nama_member") @db.VarChar(200)
  instansi     String        @db.VarChar(200)
  alamat       String        @db.Text
  telp         String        @db.VarChar(32)
  foto         String?       @db.VarChar(512)
  createdAt    DateTime      @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt    DateTime      @updatedAt @map("updated_at") @db.DateTime(3)
  archivedAt   DateTime?     @map("archived_at") @db.DateTime(3)
  user         User          @relation(fields: [userId, roleGuard], references: [id, role], onDelete: Restrict)
  reservations Reservation[]

  @@index([archivedAt, id], map: "idx_member_archive_id")
  @@map("member")
}

model SpaceOwner {
  id                  BigInt              @id @default(autoincrement()) @db.UnsignedBigInt
  userId              BigInt              @unique @map("id_user") @db.UnsignedBigInt
  roleGuard           String              @default("admin_space") @map("role_guard") @db.VarChar(20)
  namaCoworking       String              @map("nama_coworking") @db.VarChar(200)
  namaPemilik         String              @map("nama_pemilik") @db.VarChar(200)
  telp                String              @db.VarChar(32)
  alamat              String?             @db.Text
  deskripsiFasilitas  String?             @map("deskripsi_fasilitas") @db.Text
  createdAt           DateTime            @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt           DateTime            @updatedAt @map("updated_at") @db.DateTime(3)
  archivedAt          DateTime?           @map("archived_at") @db.DateTime(3)
  user                User                @relation(fields: [userId, roleGuard], references: [id, role], onDelete: Restrict)
  spaces              Space[]
  discounts           Discount[]
  reservations        Reservation[]
  mediaUploads        MediaUpload[]

  @@map("space_owner")
}

model Space {
  id                 BigInt              @id @default(autoincrement()) @db.UnsignedBigInt
  ownerId            BigInt              @map("id_owner") @db.UnsignedBigInt
  namaSpace          String              @map("nama_space") @db.VarChar(200)
  hargaPerJam        BigInt              @map("harga_per_jam") @db.UnsignedBigInt
  tipe               String              @db.VarChar(30)
  kapasitas          Int                 @db.UnsignedInt
  foto               String?             @db.VarChar(512)
  deskripsi          String              @db.Text
  version            Int                 @default(1) @db.UnsignedInt
  createdAt          DateTime            @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt          DateTime            @updatedAt @map("updated_at") @db.DateTime(3)
  archivedAt         DateTime?           @map("archived_at") @db.DateTime(3)
  owner              SpaceOwner          @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  reservations       Reservation[]
  reservationDetails ReservationDetail[]

  @@unique([id, ownerId], map: "uq_space_id_owner")
  @@index([ownerId, archivedAt, tipe, id], map: "idx_space_owner_catalog")
  @@map("space")
}

model Discount {
  id                 BigInt              @id @default(autoincrement()) @db.UnsignedBigInt
  ownerId            BigInt              @map("id_owner") @db.UnsignedBigInt
  namaDiskon         String              @map("nama_diskon") @db.VarChar(100)
  persentaseDiskon   Int                 @map("persentase_diskon") @db.UnsignedTinyInt
  tanggalAwal        DateTime            @map("tanggal_awal") @db.DateTime(3)
  tanggalAkhir       DateTime            @map("tanggal_akhir") @db.DateTime(3)
  version            Int                 @default(1) @db.UnsignedInt
  createdAt          DateTime            @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt          DateTime            @updatedAt @map("updated_at") @db.DateTime(3)
  archivedAt         DateTime?           @map("archived_at") @db.DateTime(3)
  owner              SpaceOwner          @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  reservationDetails ReservationDetail[]

  @@unique([id, ownerId], map: "uq_discount_id_owner")
  @@unique([ownerId, namaDiskon], map: "uq_discount_owner_name")
  @@index([ownerId, archivedAt, tanggalAwal, tanggalAkhir, id], map: "idx_discount_owner_active")
  @@map("diskon")
}

model Reservation {
  id                BigInt              @id @default(autoincrement()) @db.UnsignedBigInt
  ownerId           BigInt              @map("id_owner") @db.UnsignedBigInt
  memberId          BigInt              @map("id_member") @db.UnsignedBigInt
  spaceId           BigInt              @map("id_space") @db.UnsignedBigInt
  kodeBooking       String              @unique @map("kode_booking") @db.VarChar(64)
  tanggalReservasi  DateTime            @map("tanggal_reservasi") @db.Date
  jamMulai          DateTime            @map("jam_mulai") @db.Time(0)
  jamSelesai        DateTime            @map("jam_selesai") @db.Time(0)
  durasiJam         Int                 @map("durasi_jam") @db.UnsignedSmallInt
  status            String              @default("belum_dikonfirm") @db.VarChar(30)
  checkInAt         DateTime?           @map("check_in_at") @db.DateTime(3)
  checkOutAt        DateTime?           @map("check_out_at") @db.DateTime(3)
  version           Int                 @default(1) @db.UnsignedInt
  createdAt         DateTime            @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt         DateTime            @updatedAt @map("updated_at") @db.DateTime(3)
  owner             SpaceOwner          @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  member            Member              @relation(fields: [memberId], references: [id], onDelete: Restrict)
  space             Space               @relation(fields: [spaceId, ownerId], references: [id, ownerId], onDelete: Restrict)
  detail            ReservationDetail?
  qr                ReservationQr?
  idempotencyResult IdempotencyRequest?

  @@unique([id, ownerId], map: "uq_reservation_id_owner")
  @@unique([id, ownerId, spaceId], map: "uq_reservation_scope_space")
  @@index([ownerId, memberId], map: "idx_reservation_member_scope")
  @@index([spaceId, tanggalReservasi, status, jamMulai, jamSelesai, id], map: "idx_reservation_overlap")
  @@index([memberId, tanggalReservasi, id], map: "idx_reservation_member_history")
  @@index([ownerId, tanggalReservasi, status, id], map: "idx_reservation_owner_filter")
  @@map("reservasi")
}

model ReservationDetail {
  id                       BigInt       @id @default(autoincrement()) @db.UnsignedBigInt
  ownerId                  BigInt       @map("id_owner") @db.UnsignedBigInt
  reservationId            BigInt       @unique @map("id_reservasi") @db.UnsignedBigInt
  spaceId                  BigInt       @map("id_space") @db.UnsignedBigInt
  discountId               BigInt?      @map("id_diskon") @db.UnsignedBigInt
  hargaPerJam              BigInt       @map("harga_per_jam") @db.UnsignedBigInt
  totalHargaAwal           BigInt       @map("total_harga_awal") @db.UnsignedBigInt
  potonganDiskon           BigInt       @default(0) @map("potongan_diskon") @db.UnsignedBigInt
  totalHarga               BigInt       @map("total_harga") @db.UnsignedBigInt
  persentaseDiskon         Int?         @map("persentase_diskon") @db.UnsignedTinyInt
  namaDiskonSnapshot       String?      @map("nama_diskon_snapshot") @db.VarChar(100)
  namaSpaceSnapshot        String       @map("nama_space_snapshot") @db.VarChar(200)
  tipeSpaceSnapshot        String       @map("tipe_space_snapshot") @db.VarChar(30)
  namaCoworkingSnapshot    String       @map("nama_coworking_snapshot") @db.VarChar(200)
  telpCoworkingSnapshot    String       @map("telp_coworking_snapshot") @db.VarChar(32)
  namaMemberSnapshot       String       @map("nama_member_snapshot") @db.VarChar(200)
  instansiMemberSnapshot   String       @map("instansi_member_snapshot") @db.VarChar(200)
  telpMemberSnapshot       String       @map("telp_member_snapshot") @db.VarChar(32)
  createdAt                DateTime     @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt                DateTime     @updatedAt @map("updated_at") @db.DateTime(3)
  reservation             Reservation  @relation(fields: [reservationId, ownerId, spaceId], references: [id, ownerId, spaceId], onDelete: Restrict)
  space                   Space        @relation(fields: [spaceId, ownerId], references: [id, ownerId], onDelete: Restrict)
  discount                Discount?    @relation(fields: [discountId, ownerId], references: [id, ownerId], onDelete: Restrict)

  @@index([ownerId, tipeSpaceSnapshot, reservationId], map: "idx_detail_owner_report_type")
  @@map("detail_reservasi")
}

// OPTIONAL: tidak memberi anti-replay sampai kontrak verify/consume tersedia.
model ReservationQr {
  id            BigInt      @id @default(autoincrement()) @db.UnsignedBigInt
  ownerId       BigInt      @map("id_owner") @db.UnsignedBigInt
  reservationId BigInt      @unique @map("id_reservasi") @db.UnsignedBigInt
  tokenHash     String      @unique @map("token_hash") @db.Char(64)
  expiresAt     DateTime    @map("expires_at") @db.DateTime(3)
  usedAt        DateTime?   @map("used_at") @db.DateTime(3)
  createdAt     DateTime    @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt     DateTime    @updatedAt @map("updated_at") @db.DateTime(3)
  reservation   Reservation @relation(fields: [reservationId, ownerId], references: [id, ownerId], onDelete: Restrict)

  @@map("reservation_qr")
}

model IdempotencyRequest {
  id              BigInt       @id @default(autoincrement()) @db.UnsignedBigInt
  principalUserId BigInt       @map("principal_user_id") @db.UnsignedBigInt
  route           String       @db.VarChar(120)
  keyHash         String       @map("key_hash") @db.Char(64)
  requestHash     String       @map("request_hash") @db.Char(64)
  state           String       @default("pending") @db.VarChar(20)
  responseStatus  Int?         @map("response_status") @db.UnsignedSmallInt
  responseBody    Json?        @map("response_body")
  reservationId   BigInt?      @unique @map("reservation_id") @db.UnsignedBigInt
  expiresAt       DateTime     @map("expires_at") @db.DateTime(3)
  createdAt       DateTime     @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt       DateTime     @updatedAt @map("updated_at") @db.DateTime(3)
  principal       User         @relation(fields: [principalUserId], references: [id], onDelete: Restrict)
  reservation     Reservation? @relation(fields: [reservationId], references: [id], onDelete: Restrict)

  @@unique([principalUserId, route, keyHash], map: "uq_idempotency_scope")
  @@index([expiresAt, id], map: "idx_idempotency_expiry")
  @@map("idempotency_request")
}

model MediaUpload {
  id                 BigInt      @id @default(autoincrement()) @db.UnsignedBigInt
  uploaderUserId     BigInt      @map("uploader_user_id") @db.UnsignedBigInt
  ownerId            BigInt?     @map("owner_id") @db.UnsignedBigInt
  purpose            String      @db.VarChar(30)
  objectKey          String      @unique @map("object_key") @db.VarChar(512)
  originalName       String      @map("original_name") @db.VarChar(255)
  mimeType           String      @map("mime_type") @db.VarChar(100)
  sizeBytes          BigInt      @map("size_bytes") @db.UnsignedBigInt
  checksumSha256     String      @map("checksum_sha256") @db.Char(64)
  status             String      @default("staged") @db.VarChar(20)
  attachedEntityType String?     @map("attached_entity_type") @db.VarChar(20)
  attachedEntityId   BigInt?     @map("attached_entity_id") @db.UnsignedBigInt
  expiresAt          DateTime    @map("expires_at") @db.DateTime(3)
  createdAt          DateTime    @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt          DateTime    @updatedAt @map("updated_at") @db.DateTime(3)
  deletedAt          DateTime?   @map("deleted_at") @db.DateTime(3)
  uploader           User        @relation(fields: [uploaderUserId], references: [id], onDelete: Restrict)
  owner              SpaceOwner? @relation(fields: [ownerId], references: [id], onDelete: Restrict)

  @@index([status, expiresAt, id], map: "idx_media_cleanup")
  @@index([ownerId, attachedEntityType, attachedEntityId, status], map: "idx_media_owner_attachment")
  @@index([uploaderUserId, createdAt, id], map: "idx_media_uploader_audit")
  @@map("media_upload")
}
```

**Version caveat:** nullable composite relation `discount` dan relation ambiguity dapat memerlukan penyesuaian Prisma pada versi yang dipin. Pertahankan constraint SQL database meskipun relation client perlu dimodelkan/query secara eksplisit; jangan melemahkan ownership FK untuk memuaskan generator.

## 15. Media S3

1. Bucket private, Block Public Access aktif, deny non-TLS, encryption at rest, dan IAM least privilege.
2. Prefix normatif tanpa tenant:
   - `members/{member-id}/{uuid}.{ext}`
   - `owners/{owner-id}/spaces/{space-id}/{uuid}.{ext}`
   - `users/{uploader-user-id}/staging/{uuid}.{ext}`
3. Semua ID, UUID, dan ekstensi ditentukan server. Nama pengguna tidak menjadi path.
4. Key tidak boleh diawali slash atau memuat `..`, backslash, control character, URL, bucket name, atau query string.
5. Maksimum 5 MiB; JPEG/PNG/WebP; periksa extension, declared MIME, magic bytes, decode image, pixel cap, dan strip metadata bila policy menetapkan.
6. `foto` menyimpan object key, bukan permanent/signed URL. URL sementara dibentuk adapter dengan host allowlist dan HTTPS.
7. Upload membuat ledger `staged`. Attach lock ledger, memvalidasi uploader/owner/purpose/target, mengubah status dan target, lalu menulis `foto` dalam satu transaksi DB.
8. Untuk foto space, `owner_id` ledger wajib sama dengan owner space. Untuk foto member, owner metadata optional tidak memberi visibility; admin hanya boleh attach pada member yang lolos reservation-history scope.
9. S3 dan DB tidak atomik. Object tanpa ledger dan ledger tanpa object ditangani reconciliation bounded/idempotent setelah grace period.
10. Replace tidak menghapus object lama sebelum commit. Worker delete retry-safe dan menulis tombstone setelah S3 berhasil.
11. Reconciliation memeriksa staged expired, object hilang, object tanpa ledger, attached tanpa reference, reference tanpa attached ledger, target mismatch, dan deleted object yang masih ada.

## 16. Archive, delete, dan retention

- `users`, `member`, `space_owner`, `space`, dan `diskon` memiliki `archived_at`.
- Archive user menonaktifkan login; profile terkait diarsipkan melalui workflow terotorisasi selain DELETE member admin.
- Archive space/promo mencegah booking baru tanpa mengubah snapshot lama.
- Reservasi, detail, snapshot e-ticket, dan metadata QR optional tidak di-hard-delete melalui API normal.
- FK historis default `RESTRICT`; tidak ada cascade yang dapat menghapus histori tanpa sengaja.
- DELETE member admin selalu `409`; khusus endpoint ini tidak ada archive fallback.
- Cleanup idempotency memakai TTL dan batch kecil. Referensi reservasi dipertahankan sesuai policy.
- Media lama baru dihapus setelah tidak direferensikan, grace period lewat, dan policy retention/version mengizinkan.
- Snapshot `telp_coworking_snapshot`, `nama_member_snapshot`, `instansi_member_snapshot`, dan `telp_member_snapshot` adalah PII transaksi yang dibutuhkan e-ticket historis. Anonymization menunggu keputusan retention/legal hold dan tidak boleh aktif secara default.

## 17. DB-to-DTO mapping

| Sumber | DTO/API | Aturan |
|---|---|---|
| `users.password` | tidak ada | selalu dikeluarkan dari serializer/log |
| role guard, archive, version, internal IDs | hanya bila kontrak meminta | tidak menerima nilai dari body bebas |
| `member.foto`, `space.foto` | `foto`, `foto_url` | key tersimpan; URL dibentuk storage adapter |
| reservasi + detail | Reservation DTO | mapping eksplisit, termasuk `total_harga → total_bayar` |
| snapshot coworking/member | nested e-ticket | baca snapshot, bukan master |
| `DATE` | `YYYY-MM-DD` | jangan konversi UTC yang menggeser tanggal |
| `TIME(0)` | `HH:mm` | business timezone eksplisit |
| `DATETIME(3)` | ISO 8601 `Z` | aplikasi mengonversi UTC |
| BigInt | JSON integer/string sesuai kontrak | safe-range guard wajib |
| member admin | projection whitelist | username/password/role/internal tidak keluar kecuali endpoint khusus kontrak |
| QR payload | artefak e-ticket saat ini | bukan bukti consume token |
| ledger media | tidak langsung keluar | original name/checksum/status privat |

## 18. Query laporan

- Semua laporan owner memulai predicate `id_owner = authenticatedOwnerId` dan periode bounded.
- Filter bulan memakai range `tanggal_reservasi >= first_day AND tanggal_reservasi < next_month`; jangan membungkus kolom dengan fungsi.
- Estimasi: status `disetujui|aktif|selesai`; realisasi: `selesai` sebagai proxy layanan selesai, bukan bukti pembayaran.
- Agregat memakai snapshot detail.
- Formula: count transaksi, sum durasi, sum harga awal, sum potongan, dan sum total bersih.
- Breakdown tipe memakai `tipe_space_snapshot` dan tetap bounded/paginated.
- Gunakan BigInt/decimal-safe serialization dan `EXPLAIN ANALYZE` pada volume representatif.

## 19. Workflow migrasi TypeORM ke Prisma

1. Pin versi stabil `prisma` dan `@prisma/client` yang sama.
2. Introspeksi database nyata dengan credential read-only; jangan menyalin secret.
3. Rekonsiliasi DB nyata, baseline, dan target. Jika kosong, buat initial migration; jika berisi data, baseline hanya objek yang benar-benar ada.
4. Expand tabel/kolom/index tanpa perubahan destruktif.
5. Normalisasi username global dan deteksi collision sebelum unique. Collision membutuhkan remediation eksplisit, bukan suffix otomatis.
6. Backfill owner pada space/promo/reservasi/detail dari relasi yang dapat dibuktikan; record ambigu menghentikan migration.
7. Backfill `id_space`, snapshot e-ticket, audit, dan ledger media hanya dari bukti. Jangan menebak PII atau object ownership.
8. Validasi duplicate/orphan/profile role, owner mismatch, detail kosong/ganda, formula, snapshot, overlap existing, dan media mismatch.
9. Tambah NOT NULL, CHECK, unique, dan composite FK. Ukur metadata lock pada clone produksi.
10. Cut over ke Prisma dan nonaktifkan semua write TypeORM.
11. Setelah observability/rollback window, hapus dependency/config TypeORM pada release terpisah.
12. Production migration dijalankan sekali oleh CI role; API tidak menjalankan migration saat startup.
13. Rollback mengutamakan rollback aplikasi dan roll-forward schema. Destructive rollback memerlukan PITR terverifikasi.
14. CI menguji fresh database, upgrade snapshot, dan drift.

Tidak ada backfill membership admin. Visibility langsung muncul dari histori reservasi yang sudah valid.

## 20. Strategi seed

- Seed development/test idempotent, sintetis, tanpa ID produksi hard-coded.
- Buat minimal owner A dan B, admin masing-masing, member global M1/M2/M3, tiga tipe space per kebutuhan, serta promo active/expired/boundary.
- M1 memiliki reservasi aktif pada A; M2 hanya reservasi dibatalkan pada A; M3 hanya reservasi pada B. Ini membuktikan status-independent visibility dan cross-owner isolation.
- Buat satu member melalui assisted registration A tanpa reservasi; member tersebut harus absent dari list/detail/PUT A.
- Seed reservasi adjacent dan overlap, setiap state, snapshot lengkap, idempotency completed/concurrent fixture, serta media staged/attached/deleted.
- QR hanya fixture optional dan tidak diiklankan sebagai enforcement.
- Password dummy tetap di-hash. Tidak ada credential default produksi atau PII nyata.
- Natural fixture keys hanya digunakan di seed code lalu ID di-resolve.
- Clock dan business timezone diinjeksi agar promo/report deterministik.
- Jalankan seed dua kali untuk membuktikan idempotensi.

## 21. Amazon RDS MySQL 8

1. Pin exact engine dan parameter group; uji minor upgrade pada staging/clone.
2. Private subnet/security group; tidak public accessible.
3. TLS dengan certificate/hostname verification dan KMS encryption at rest.
4. Pisahkan DB runtime dan migration user; runtime tanpa DDL/GRANT.
5. Automated backup/PITR dan snapshot sebelum migrasi berisiko; lakukan restore drill.
6. Multi-AZ sesuai SLO; failover test memeriksa rollback, pool reconnect bounded, dan idempotency replay.
7. Hitung pool budget dari jumlah instance; RDS Proxy hanya jika churn/failover terukur membutuhkannya.
8. Pin UTC, strict SQL mode, isolation, lock wait, connection, dan query timeout.
9. Monitor CPU, memory/storage, connections, deadlocks, lock waits, slow query, p95 booking transaction, member-scope query latency, dan migration duration.
10. Performance Insights/slow log harus meredaksi parameter sensitif.
11. Read replica optional hanya untuk laporan setelah lag semantics diterima; booking/authorization scope membaca writer.
12. Tetapkan maintenance window, alarm owner, runbook, RTO/RPO, dan on-call sebelum deployment.

## 22. Matriks verifikasi umum

Semua item berstatus **belum dijalankan** sampai schema/migrasi/service target tersedia.

| ID | Level | Verifikasi | Hasil wajib |
|---|---|---|---|
| DB-V-001 | Toolchain | Prisma/client exact stable match; validate/generate | lulus tanpa prerelease mismatch |
| DB-V-002 | Migration | fresh deploy exact RDS MySQL version | semua tabel/constraint/index terbentuk |
| DB-V-003 | Upgrade | upgrade clone baseline | no data loss; remediation nol |
| DB-V-004 | Drift | migration history vs DB | no unexplained drift |
| DB-V-005 | Engine | InnoDB/utf8mb4/collation/UTC/strict mode | sesuai konvensi |
| DB-V-006 | Username | normalization/case/Unicode/concurrent duplicate | unique global; satu transaksi sukses |
| DB-V-007 | Profile | duplicate profile/role mismatch/orphan | ditolak atau monitor fail |
| DB-V-008 | Owner FK | cross-owner space/promo/reservation/detail/QR | ditolak DB |
| DB-V-009 | Detail | duplicate/missing detail | duplicate ditolak; aggregate rollback; monitor nol |
| DB-V-010 | CHECK | invalid role/type/status/money/time/media | ditolak DB |
| DB-V-011 | Snapshot | edit/archive master setelah booking | history/e-ticket/report unchanged |
| DB-V-012 | Money | 0, limits, 1%, 100%, rounding | deterministic, no float overflow |
| DB-V-013 | Time | invalid, adjacent, leap day, cross-day | sesuai rule; adjacent accepted |
| DB-V-014 | Concurrency | two overlapping bookings | exactly one commit, one 409 |
| DB-V-015 | State concurrency | booking vs cancel/finish | serialized by space mutex |
| DB-V-016 | Deadlock | deadlock/lock timeout injection | bounded retry, no duplicate |
| DB-V-017 | Idempotency | same/different payload, no key, crash, concurrent | proper replay/conflict/rollback |
| DB-V-018 | State | legal/illegal/stale version | only legal transitions |
| DB-V-019 | Query plan | catalog/history/admin/report/scope/overlap | intended indexes; bounded |
| DB-V-020 | Pagination | empty/max/beyond/stable sort | count/list deterministic |
| DB-V-021 | DTO | all related serializers | no hash/internal; dates/BigInt correct |
| DB-V-022 | QR caveat | ID check-in and token-only attempt | token alone grants nothing |
| DB-V-023 | S3 | spoof/traversal/oversize/target mismatch | rejected; generated key only |
| DB-V-024 | S3 failure | object/ledger/reference partial failure | reconciliation retry-safe |
| DB-V-025 | Archive | archived master with history | history intact; not bookable |
| DB-V-026 | Cleanup | idempotency/media batches | bounded/observable/idempotent |
| DB-V-027 | Reports | empty/month boundary/reconcile | owner scope/formula correct |
| DB-V-028 | Security | injection/search/sort/mass assignment | parameterized and allowlisted |
| DB-V-029 | Secret/PII | logs/errors/backups/responses | no password/token/signed URL/excess PII |
| DB-V-030 | RDS failover | disconnect during transaction | rollback/no partial/replay safe |
| DB-V-031 | Restore | PITR to isolated RDS | counts/FK/snapshot/scope pass |
| DB-V-032 | Compatibility | app N/N-1 during expand | safe before contract migration |
| DB-V-033 | Build gates | lint/typecheck/unit/integration/API/E2E/build | all affected gates pass |
| DB-V-034 | Load | burst same/many spaces and member lists | correctness; bounded lock/query latency |
| DB-V-035 | Media ledger | stage/attach/replace/delete/reconcile | private metadata; consistent references |
| DB-V-036 | Snapshot PII | projection/log/retention dry-run | only authorized e-ticket access |

## 23. Member scope tests `MEM-SCOPE-001..015`

| ID | Setup/action | Hasil wajib |
|---|---|---|
| MEM-SCOPE-001 | Owner A lists; M1 has one reservation with A | M1 appears exactly once |
| MEM-SCOPE-002 | M2 has only a `dibatalkan` reservation with A | M2 appears; status cancellation still counts |
| MEM-SCOPE-003 | M3 has reservations only with B; A lists | M3 absent |
| MEM-SCOPE-004 | M3 has reservations only with B; A requests detail by known ID | `404`, same safe shape as nonexistent |
| MEM-SCOPE-005 | A PUTs M3 by known ID | `404`; no profile fields change |
| MEM-SCOPE-006 | A creates global user+member through POST | `201`; both rows committed atomically |
| MEM-SCOPE-007 | Immediately after MEM-SCOPE-006, A lists/gets/puts new member | absent from list; detail/PUT `404` |
| MEM-SCOPE-008 | New member’s first reservation with A commits | member becomes visible to A immediately after commit |
| MEM-SCOPE-009 | First reservation with A is created directly as `dibatalkan` or later cancelled | member remains visible because any status counts |
| MEM-SCOPE-010 | Concurrent assisted registrations use same normalized username | one `201`, one `409`; one user/profile only |
| MEM-SCOPE-011 | POST fails while inserting member profile | user insert rolls back; no orphan user |
| MEM-SCOPE-012 | Visible member PUT contains only allowed five fields | update succeeds; snapshot reservation history unchanged |
| MEM-SCOPE-013 | PUT includes username/password/role/id/archive/unknown field | request rejected; no partial update |
| MEM-SCOPE-014 | DELETE visible, out-of-scope, and nonexistent IDs | each returns `409`; no user/member/archive/history mutation; no existence oracle |
| MEM-SCOPE-015 | List and count with duplicate/multiple reservations across statuses and pagination | one member row, matching count, deterministic order; `EXISTS` index used |

Required API/security assertions for every applicable test: authenticated owner resolved from token/profile, no owner ID trusted from body/query, parameterized SQL/Prisma query, no credential/internal field response, and no cross-owner PII in logs.

## 24. Open questions

1. Business timezone IANA name.
2. Maximum duration, time step, lead time, grace period, and operating hours.
3. Integer IDR rounding rule for fractional discount result.
4. Whether pending reservations expire automatically; if yes, expiry column/worker with space mutex is needed.
5. S3 delivery private/public, orphan retention, pixel cap, malware scan, version recovery.
6. Whether a future QR verify/consume contract will be approved.
7. Idempotency replay TTL.
8. PII/transaction/backup/media retention, legal hold, and anonymization values.
9. Exact RDS MySQL 8.0.x, instance/storage/Multi-AZ/connection budget.
10. ID JSON safe-range guarantee versus string migration.
11. Whether admin edits to a visible global member require member notification/audit UI because the change affects all owners.

Admin member visibility is **not** an open question; reservation-history scope is final.

## 25. Checklist implementasi

### Sebelum coding

- [ ] Pin exact RDS MySQL >=8.0.16.
- [ ] Pin exact matching stable Prisma packages.
- [ ] Audit database nyata read-only tanpa mengungkap secret.
- [ ] Reconcile stale OpenAPI/API docs with final standalone/member behavior.
- [ ] Finalize BigInt/date/time serialization and open questions that block schema.

### Schema/migration

- [ ] Build executable Prisma schema from conceptual model; validate/generate.
- [ ] Review generated SQL and add CHECK/composite FK/index/timestamp SQL.
- [ ] Prove global username normalization/unique and remediate collisions.
- [ ] Prove owner consistency and member visibility index plan.
- [ ] Run fresh, upgrade, drift, metadata-lock, and rollback tests.
- [ ] Cut over fully from TypeORM; maintain one migration owner.

### Service/domain

- [ ] Resolve owner profile exclusively from authenticated user.
- [ ] Implement global user+profile registration transaction.
- [ ] Implement member list/count/detail/PUT with identical reservation-history scope.
- [ ] Enforce PUT whitelist and DELETE-always-409 behavior.
- [ ] Implement booking idempotency, space mutex, overlap locking read, snapshots, and integer money.
- [ ] Apply owner predicate to every owner resource read/write.
- [ ] Map explicit DTO projections; never return Prisma records directly.

### Storage/security

- [ ] Implement S3 key policy and upload validation.
- [ ] Implement media ledger attach/reconciliation/safe replacement.
- [ ] Ensure media metadata never grants member visibility.
- [ ] Redact password, QR/idempotency key, signed URL, and snapshot PII from logs.
- [ ] Separate runtime and migration DB principals.

### Verification/operations

- [ ] Run DB-V-001..036 and MEM-SCOPE-001..015.
- [ ] Run lint, typecheck, unit, integration, API/E2E, and production build.
- [ ] `EXPLAIN ANALYZE` critical queries with representative volume.
- [ ] Load test per-space mutex, member-scope list/count, retry, and pool budget.
- [ ] Perform RDS PITR restore drill and failover test.
- [ ] Approve alarms, runbooks, RTO/RPO, retention, and migration window.

## 26. Status implementasi

Dokumen ini merekonsiliasi target final standalone, tetapi repository belum membuktikan schema/migrasi Prisma atau service flow tersebut. Runtime terverifikasi masih TypeORM + MySQL. Constraint owner, member-history authorization, transactions, S3 ledger, RDS configuration, migrations, dan tests di atas belum dapat dinyatakan bekerja sampai executable implementation dan verification evidence tersedia.
