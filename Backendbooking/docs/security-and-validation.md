# Security and Validation

## 1. Status

- **Actual state:** tidak ada source code/configuration/runtime yang dapat diaudit; kontrol di dokumen ini belum terimplementasi.
- **REQUIRED:** validasi input, hashing password, JWT role access, dan isolasi data sesuai kontrak.
- **DESIGN DECISION:** keamanan diterapkan berlapis pada transport, HTTP boundary, domain service, query scope, database constraint, storage, dan operasi.

## 2. Trust boundaries dan aset

Aset utama: password hash, JWT signing key, app key, PII member, data tenant/owner, jadwal reservasi, snapshot finansial, QR verification token, foto, log, dan backup. Boundary: client→API, API→DB, API→object storage, operator→infrastruktur, dan tenant/owner→tenant/owner lain.

Input dari body, query, path, header, multipart, JWT claim yang belum diverifikasi, nama file, metadata gambar, serta data database harus dianggap tidak tepercaya.

## 3. Validasi umum

- Gunakan schema per DTO; whitelist field dan tolak field tak dikenal untuk operasi mutasi.
- Bedakan missing, `null`, string kosong, dan whitespace-only.
- Normalisasi Unicode secara konsisten sebelum unique comparison; jangan mengubah password.
- Terapkan batas panjang semua string, body, query, pagination, dan upload sebelum alokasi besar.
- ID harus integer positif dan di-query bersama owner/tenant scope.
- Enum dipertahankan persis: role `member|admin_space`; tipe `desk|meeting_room|private_office`; status `belum_dikonfirm|disetujui|aktif|selesai|dibatalkan`.
- Tanggal `YYYY-MM-DD`, jam `HH:mm` 24 jam; durasi integer minimal 1. `24:00`, tanggal mustahil, pecahan, `NaN`, dan overflow ditolak.
- Uang diterima/disimpan sebagai integer IDR; jangan memakai floating point untuk nominal.
- Telepon disimpan string setelah normalisasi yang disepakati; jangan dipaksa number.
- SQL memakai parameterized query/ORM binding; sort/filter memakai allowlist, bukan interpolasi bebas.

Batas maksimum field dan durasi adalah **OPEN QUESTION** yang wajib dimasukkan ke OpenAPI sebelum implementasi.

## 4. Validasi per domain

| Domain | Validasi minimum |
|---|---|
| Username | required pada create, normalized, batas panjang, karakter policy, unik sesuai tenant |
| Password | minimum kontrak 6 untuk kompatibilitas; produksi sebaiknya passphrase lebih kuat; hash adaptif |
| Member | `nama_member`, `instansi`, `alamat`, `telp` required sesuai DTO; `foto` optional menurut DTO |
| Owner | `nama_coworking`, `nama_pemilik`, `telp` required; alamat/deskripsi adalah gap sumber |
| Space | nama/deskripsi required, harga integer >= 0, kapasitas integer > 0, tipe allowlist |
| Diskon | kode normalized, persen 1..100, awal <= akhir, scope owner/tenant benar |
| Reservasi | member dari token, space valid/aktif, tanggal/jam/durasi valid, tidak overlap, promo valid, semua total server-side |
| Status | enum valid dan transisi legal; check-in/out memakai endpoint khusus |
| Filter | month 1..12, year range wajar, page/limit bounded, deterministic sort |

## 5. Proteksi ancaman aplikasi

### Injection

Parameterized query wajib. Search wildcard harus di-escape sesuai semantics. Tidak ada dynamic SQL dari `sort`, `status`, `tipe`, nama tabel, atau claim.

### XSS

API mengembalikan JSON dengan content type tepat. Data deskripsi/nama tidak dianggap HTML. Client harus melakukan output encoding. SVG ditolak untuk upload karena active content. Security headers tetap diterapkan.

### CSRF

Bearer token di header tidak otomatis dikirim browser dan menurunkan risiko CSRF. Jika token/session dipindah ke cookie, wajib `HttpOnly`, `Secure`, `SameSite`, CSRF token, dan origin validation.

### SSRF dan redirect

Backend tidak boleh fetch URL media yang diberikan pengguna. URL redirect/presigned callback hanya dari origin allowlist. `foto` adalah key/identifier storage tervalidasi, bukan URL arbitrer.

### Path traversal

Abaikan nama file client untuk storage key. Generate key server-side; tidak menerima `../`, path absolut, separator, atau kontrol Unicode berbahaya.

### Mass assignment/deserialization

Map DTO secara eksplisit. Field seperti `id_owner`, `id_member`, role, total, status, tenant, kode booking, timestamp, dan check-in/out tidak diambil dari body kecuali endpoint secara khusus mengizinkannya.

### BOLA/BFLA

Semua resource ID diperiksa melalui query scoped. Guard role tidak menggantikan ownership. Matriks lengkap ada di [Authentication & Authorization](authentication-and-authorization.md).

## 6. Upload security

- Bearer wajib menurut proposal aman; app key saja tidak cukup.
- Izinkan hanya JPEG, PNG, WebP sesuai endpoint final; tolak SVG dan executable.
- Periksa extension, declared MIME, dan magic bytes; decode/re-encode bila risiko menuntut.
- Batasi ukuran request/file dan satu file per request; stream, jangan buffer tanpa batas.
- Generate UUID/random key per tenant/category; cegah overwrite.
- Simpan metadata minimal; jangan mempublikasikan `original_name` tanpa output encoding.
- Hapus EXIF bila privacy diperlukan; pertimbangkan malware scan sebelum publikasi.
- S3 Block Public Access default; akses private/presigned direkomendasikan.
- Tangani kegagalan DB/S3 dengan compensation dan rekonsiliasi object yatim.
- Deletion/archive master harus memiliki aturan lifecycle object.

**OPEN QUESTION:** batas byte, resolusi/pixel bomb, retention, dan model public/private belum diputuskan.

## 7. HTTP dan platform

- HTTPS wajib; HSTS hanya setelah domain HTTPS stabil.
- CORS exact allowlist; tanpa wildcard bersama credential.
- Header: no-sniff, frame policy/CSP sesuai dokumentasi endpoint, referrer policy, cache-control untuk data sensitif.
- `TRUST_PROXY` dikonfigurasi hanya untuk proxy yang nyata.
- Batas body/header, request timeout, DB statement timeout, dan graceful shutdown wajib.
- Error 5xx tidak menampilkan stack/SQL/path internal.
- Root/health tidak membocorkan dependency hostname atau secret.

## 8. Rate limit dan abuse controls

Prioritas limit: maker/user login, register, promo check, availability, reservasi, e-ticket/QR, dan upload. Gunakan key gabungan IP + tenant + principal ketika tersedia; limit global/IP saja dapat mengganggu NAT bersama. Response 429 memiliki `Retry-After`. Rate limiter tidak boleh dapat dilewati dengan spoofed forwarded header.

Quota storage dan pagination maksimum wajib. Cache/Redis tidak ditambahkan sebelum deployment multi-instance dan kebutuhan rate-limit global terbukti; jika kelak ditambahkan, kegagalan cache tidak boleh merusak invariant reservasi.

## 9. Secret, log, dan privacy

- Secret hanya dari secret manager/environment tervalidasi; jangan commit `.env`.
- Redaksi `Authorization`, cookie, password, hash, app key, app-key ciphertext/key version, QR token, database URL, dan signed URL. Raw app key hanya boleh berada pada response maker register/login/me yang diwajibkan kontrak; tidak pernah pada log/trace/error/analytics atau plaintext at rest.
- Log memakai request ID, route template, status, latency, principal/tenant pseudonymous; jangan log body auth/upload atau PII mentah.
- Response DTO tidak pernah menyertakan field DB internal yang tidak dibutuhkan.
- Backup dienkripsi dan aksesnya terpisah dari role runtime.
- Retention PII, hak penghapusan, dan audit access adalah **OPEN QUESTION**.

## 10. Database dan concurrency security

Constraint database menjaga unique, FK, check, dan satu-detail-per-reservasi. Booking dibuat dalam transaksi dan memakai exclusion constraint/locking yang benar. Availability pre-check tidak dianggap lock. Least-privilege DB user aplikasi tidak memiliki hak membuat role/database atau mengubah migration history pada runtime normal.

Rincian terdapat di [Database Design](database-design.md) dan [Business Rules](business-rules.md).

## 11. Dependency dan supply chain

- lockfile wajib; install reproducible/frozen;
- secret scan, SAST, dependency audit, SBOM, dan image scan di CI;
- artifact immutable dan checksum/signature diverifikasi;
- source map sensitif tidak dipublikasi;
- dependency Blocker/High tanpa mitigasi memblokir rilis.

## 12. Checklist verifikasi sebelum rilis

- [ ] Validation tests untuk null/empty/type/boundary/unknown field.
- [ ] Auth, role, ownership, tenant, dan state negative matrix lulus.
- [ ] Injection/XSS/CSRF-mode/SSRF/path traversal/mass-assignment diuji sesuai execution path.
- [ ] Upload spoof, oversize, polyglot, pixel bomb, duplicate, dan failure compensation diuji.
- [ ] Dua reservasi konkuren menghasilkan tepat satu pemenang.
- [ ] Password, bearer/QR token, internal app-key hash/ciphertext, dan PII tidak muncul pada response/log/error; raw app key hanya muncul pada response maker register/login/me yang terotorisasi dan tidak pernah pada log/error atau plaintext at rest.
- [ ] CORS, headers, TLS, proxy, timeout, body limit, dan rate limit diuji di staging.
- [ ] DAST/SAST/dependency/secret scan tanpa Blocker/High terbuka.
- [ ] Backup/restore dan migration rollback risk diverifikasi.

Daftar ini adalah target, bukan hasil test; bukti harus mengikuti [Testing Strategy](testing-strategy.md).