# Authentication and Authorization

## 1. Status dan prinsip

- **Actual state:** belum ada implementasi auth, JWT, middleware tenant, atau authorization test yang dapat diverifikasi.
- **REQUIRED:** role user adalah `member` dan `admin_space`; endpoint terproteksi memakai Bearer JWT; password harus di-hash.
- **DESIGN DECISION:** autentikasi, role, ownership, dan tenant scope diperiksa server-side pada setiap request; menyembunyikan tombol di UI bukan kontrol keamanan.
- **OPEN QUESTION:** TTL, refresh/revocation, algoritma signing, dan autentikasi Guru/Penguji belum ditetapkan.

## 2. Identitas dan credential

### User bisnis

`users(id, username, password, role)` adalah baseline. Field `password` bermakna **password hash**, bukan plaintext, walaupun nama field sumber dipertahankan.

- username dinormalisasi dan unik sesuai scope tenant final;
- password tidak pernah dikembalikan, dicatat ke log, atau dimasukkan JWT;
- role hanya `member` atau `admin_space`;
- profil role harus konsisten: user member memiliki satu `member`; user admin memiliki satu `space_owner`.

### App Maker

Kontrak soal memiliki akun App Maker dan `app_key`, tetapi tidak ada dalam transkripsi ERD baseline.

- **DESIGN DECISION:** jika kompatibilitas App Maker diwajibkan, tambahkan entitas tenant/App Maker seperti proposal [Database Design](database-design.md).
- `app_key` dihasilkan dari CSPRNG. Karena kontrak sumber mengembalikan raw key pada register, login, dan `/api/maker/me`, penyimpanan wajib memakai dua representasi: keyed lookup digest unik `app_key_hash` dan authenticated, recoverable `app_key_ciphertext`; raw plaintext tidak pernah disimpan at rest.
- KEK enkripsi dan kunci lookup digest terpisah, dikelola KMS/secret manager, least-privilege, versioned, dan dapat dirotasi. Database compromise tanpa KEK tidak boleh cukup untuk memperoleh raw key; application/KMS compromise tetap berada dalam threat model dan memerlukan audit decrypt, rate limit, dan incident rotation.
- Raw key hanya boleh dibuat/decrypt setelah autentikasi Maker yang sesuai (atau saat register sebelum response), tidak pernah dicatat pada application/access/audit log, trace, metric, analytics, exception, cache persisten, atau backup plaintext. Field hash/ciphertext/version tidak pernah diserialisasi.
- `x-maker-key` dan `x-app-key` adalah alias. Bila keduanya hadir, nilainya harus sama; selain itu 400. Tenant lookup menghitung digest dan membandingkan secara aman; tidak melakukan scan/decrypt seluruh key.
- App key menentukan tenant, bukan role user dan bukan pengganti JWT untuk mutasi sensitif.

## 3. Alur autentikasi

### Register member/admin

1. Validasi dan normalisasi payload.
2. Resolve tenant dari header yang sah jika mode tenant aktif.
3. Periksa duplicate secara ramah pengguna; unique constraint tetap menjadi penjaga race.
4. Hash password dengan algoritma adaptif.
5. Dalam satu transaksi, buat `users` dan profil `member` atau `space_owner`.
6. Serialize response tanpa hash; token hanya diterbitkan sesuai kontrak final.

### Login

1. Terapkan rate limit per kombinasi IP/identifier dengan trusted proxy yang benar.
2. Normalisasi username; ambil user dalam tenant yang tepat.
3. Selalu lakukan perbandingan hash berbiaya sebanding untuk mengurangi enumeration timing.
4. Gunakan pesan error generik untuk username/password salah.
5. Terbitkan JWT setelah credential valid.

### Validasi JWT

JWT minimal memuat `sub`, `role`, tenant identifier bila berlaku, `iss`, `aud`, `iat`, `exp`, dan `jti` bila strategi revocation memerlukannya. Verifier mem-pin algoritma, issuer, audience, expiry, dan key yang benar. Header/body request tidak boleh menimpa claim identitas.

## 4. Lifecycle token

- **DESIGN DECISION:** access token berumur pendek dan dikirim melalui `Authorization: Bearer` untuk API.
- **OPEN QUESTION:** refresh token tidak ditentukan dalam soal. Jika ditambahkan, gunakan rotation, reuse detection, revocation, hashed-at-rest, dan endpoint kontrak tersendiri.
- Rotasi signing key harus mendukung overlap key lama/baru dan `kid` bila asymmetric signing dipilih.
- Logout tanpa refresh/session server-side hanya menghapus token client; jangan mengklaim revocation instan.
- Token tidak boleh berada di URL, QR, log, analytics, atau nama file.

## 5. Authorization layers

Urutan pemeriksaan:

1. endpoint publik atau terproteksi;
2. tenant context valid;
3. JWT valid;
4. role sesuai;
5. object berada pada tenant yang sama;
6. ownership sesuai;
7. business-state mengizinkan operasi.

Untuk mencegah enumeration, object di luar tenant/ownership dapat dikembalikan sebagai 404 secara konsisten. Query repository harus sudah memiliki tenant/owner predicate, bukan fetch global lalu cek belakangan.

## 6. Matriks akses

| Resource/aksi | Publik | Member | Admin Space | App Maker/Guru |
|---|---:|---:|---:|---:|
| Root, liveness | Ya | Ya | Ya | Ya |
| Maker register/login | Ya | - | - | Ya setelah login |
| Maker me/stats | Tidak | Tidak | Tidak | Pemilik tenant |
| Maker list | Tidak untuk production | Tidak | Tidak | Guru/Penguji terautentikasi |
| Register/login user | Register/login + tenant key | Ya | Ya | - |
| Profile auth | Tidak | Diri sendiri | Diri sendiri | - |
| Tipe/katalog/detail/availability | Sesuai kontrak + tenant context | Baca | Baca | - |
| Promo aktif/check/detail | Sesuai kontrak + tenant context | Baca | Baca | - |
| Buat reservasi | Tidak | Diri sendiri | Tidak | - |
| Reservasi `my`, history, cancel | Tidak | Milik sendiri | Tidak | - |
| Detail/e-ticket reservasi | Tidak | Milik sendiri | Milik owner admin | - |
| Profil admin | Tidak | Tidak | Profil sendiri | - |
| CRUD member | Tidak | Tidak | Dalam scope admin/tenant | - |
| CRUD space | Tidak | Tidak | Space dengan `id_owner` sendiri | - |
| CRUD diskon | Tidak | Tidak | Dalam scope owner/tenant final | - |
| Daftar/status/check-in/out | Tidak | Tidak | Reservasi untuk owner sendiri | - |
| Laporan | Tidak | Tidak | Data owner sendiri | - |
| Upload general | Tidak (proposal aman) | Terautentikasi | Terautentikasi | - |
| Upload space | Tidak | Tidak | Admin terautentikasi | - |
| Upload member | Tidak | Foto sendiri | Member yang dikelola | - |

Detail endpoint per nomor terdapat di [Requirements Traceability](requirements-traceability.md).

## 7. Ownership dan tenant invariant

- `space.id_owner` harus sama dengan owner reservasi.
- Member hanya membaca/membatalkan `reservasi.id_member` miliknya.
- Admin hanya mengelola space dengan `space.id_owner` miliknya dan reservasi yang `id_owner`-nya sama.
- Diskon harus berada dalam scope owner/tenant yang sama dengan reservasi; baseline tidak memiliki `id_owner`, sehingga ini adalah gap schema.
- Token tenant A + header tenant B ditolak; server tidak memilih salah satu diam-diam.
- Semua agregasi laporan dan pencarian memakai predicate tenant/owner.

## 8. Endpoint berisiko dari sumber

### `/api/maker/list`

Sumber menyebut publik dan menampilkan PII serta app key. Ini tidak aman untuk produksi.

- **DESIGN DECISION:** wajib role Guru/Penguji; redaksi email/app key; pagination; audit akses.
- **OPEN QUESTION:** mekanisme identitas Guru/Penguji perlu kontrak baru.

### Upload

Detail sumber menyebut tidak memerlukan bearer, sedangkan ringkasan membatasi role.

- **DESIGN DECISION:** bearer wajib; app key saja tidak cukup.
- **OPEN QUESTION:** kompatibilitas evaluator perlu dikonfirmasi sebelum mengubah OpenAPI.

### QR

Contoh sumber memasukkan app key.

- **DESIGN DECISION:** QR hanya berisi token opaque/signed yang scoped ke reservasi; tidak memuat JWT, app key, PII, atau ID mentah sebagai satu-satunya bukti.

## 9. Response auth

- 400: header alias konflik atau input malformed.
- 401: credential/token hilang atau invalid.
- 403: identitas valid tetapi role/state melarang.
- 404: resource tidak ada atau disamarkan karena ownership/tenant.
- 409: konflik unique/state/concurrency yang sah.
- 429: rate limit.

Response mengikuti envelope sumber dan tidak membocorkan stack, password hash, lookup digest, ciphertext, bearer token di luar endpoint auth, atau keberadaan username. Raw app key adalah pengecualian kontrak terbatas: hanya response maker register/login/me yang terotorisasi; endpoint/error/log lain tidak boleh memuatnya.

## 10. Pengujian wajib

- token hilang/rusak/kedaluwarsa/signature/issuer/audience salah;
- role matrix seluruh endpoint;
- BOLA antar-member dalam tenant sama;
- cross-owner dan cross-tenant untuk setiap ID;
- token/header tenant mismatch;
- race registrasi username sama;
- password/hash tidak muncul dalam response/log;
- register menyimpan digest+ciphertext tanpa plaintext; login/me dapat memulihkan key yang sama hanya untuk Maker terautentikasi; DB-only compromise test/inspection tidak menemukan raw key;
- log/trace/error test memastikan raw app key, ciphertext, dan digest tidak tercatat; rotasi KEK/hash key dan kegagalan decrypt bersifat fail-closed serta diaudit tanpa secret;
- rate limit login/register;
- `/api/maker/list`, upload, dan QR sesuai keputusan aman;
- perubahan role/profile tidak menghasilkan orphan atau privilege escalation.

Lihat test ID rinci pada [Testing Strategy](testing-strategy.md).