# Integrasi API Frontend

## 1. Sumber kontrak dan batasan

Dokumen ini memakai **profil lokal kanonik yang diperkeras** dari [kontrak API backend](../../backend/docs/api-contract.md) dan [OpenAPI backend](../../backend/docs/openapi.yaml). Frontend mengonsumsi API; model di bawah adalah **request/response model**, bukan representasi entitas atau tabel database. Frontend tidak boleh menyimpulkan kolom internal, relasi ORM, mekanisme transaksi, atau aturan otorisasi hanya dari bentuk JSON.

Kontrak backend tersebut adalah kontrak target, bukan bukti implementasi. Base URL contoh sumber panitia adalah `https://learn.smktelkom-mlg.sch.id/coworking/`; URL lokal/produksi harus berasal dari konfigurasi runtime/build. Perbedaan dari sumber panitia dipertahankan secara eksplisit: root/health tanpa tenant key, maker list terlindungi dan teredaksi, pagination collection, idempotency reservasi, upload bearer-only JPEG/PNG/WebP maksimum 5 MiB, QR opaque, serta ekstensi profil `alamat`/`deskripsi_fasilitas`.

Referensi pendukung yang benar-benar tersedia: [autentikasi dan otorisasi](../../backend/docs/authentication-and-authorization.md), [keamanan dan validasi](../../backend/docs/security-and-validation.md), dan [deployment](../../backend/docs/deployment.md).

## 2. Envelope dan tipe dasar

```ts
type ApiSuccess<T> = {
  status: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

type ApiError = {
  status: false;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
};

type SpaceType = 'desk' | 'meeting_room' | 'private_office';
type UserRole = 'member' | 'admin_space';
type ReservationStatus =
  | 'belum_dikonfirm'
  | 'disetujui'
  | 'aktif'
  | 'selesai'
  | 'dibatalkan';
```

Parser wajib memvalidasi envelope dan `data` di boundary HTTP. Jangan melakukan cast langsung dari `response.json()`.

## 3. Header, autentikasi, dan token

| Kebutuhan | Strategi frontend |
|---|---|
| Tenant | Kirim satu header kanonik `x-maker-key` pada endpoint tenant-scoped. `x-app-key` hanya alias kompatibilitas; bila keduanya dikirim nilainya wajib sama. Jangan kirim tenant key pada root, health, Maker register/login, atau Maker me. |
| User auth | Kirim `Authorization: Bearer <access_token>` pada endpoint Member/Admin terproteksi, termasuk seluruh upload. |
| Maker auth | `/api/maker/me` memakai Bearer token App Maker tanpa tenant key; `/api/maker/stats` menerima token App Maker atau satu tenant key. |
| JSON | Kirim `Accept: application/json` dan `Content-Type: application/json` untuk body JSON. |
| Upload | Kirim Bearer + tenant key dan gunakan `FormData`; jangan menetapkan `Content-Type` secara manual agar browser menambahkan boundary. |
| Reservasi | `POST /api/reservasi` mendukung `Idempotency-Key` opsional (8–128 karakter); gunakan key stabil per intent submit dan jangan gunakan ulang untuk payload berbeda. |

### Strategi penyimpanan token

Pilihan yang disarankan untuk implementasi production-oriented adalah BFF/session server-side dengan cookie `HttpOnly`, `Secure`, `SameSite=Lax/Strict`, sehingga JWT tidak dapat dibaca JavaScript. Namun kontrak hanya menyediakan Bearer token dan repository belum membuktikan adanya BFF. Jika aplikasi benar-benar SPA client-only, fallback adalah token **in-memory**, hilang saat reload, dengan login ulang; jangan menyimpan JWT di `localStorage` atau `sessionStorage` karena memperluas dampak XSS. Jangan memasukkan token atau `app_key` ke URL, log, analytics, error report, atau source map.

`app_key` adalah identitas tenant, bukan pengganti otorisasi. Karena endpoint tenant meminta browser mengirimkannya, nilainya mungkin terekspos pada bundle/network browser dan tidak boleh diperlakukan sebagai authorization secret. Profil lokal mengatasi konflik sumber dengan mewajibkan Bearer pada upload dan membatasi `/api/maker/list` ke Bearer Guru/Penguji dengan `email`/`app_key` teredaksi; frontend umum tetap tidak menyediakan UI endpoint tersebut.

Aturan 401/403: satu handler terpusat menghapus sesi lokal, membatalkan query privat, lalu mengarahkan ke login yang sesuai. Hindari loop redirect. `403` tidak selalu berarti sesi kedaluwarsa; tampilkan forbidden bila sesi masih valid.

## 4. Response models

Semua field mempertahankan nama kontrak.

```ts
type Maker = {
  id: number; name: string; username: string; email: string;
  app_key: string; created_at?: string; updated_at?: string;
};
type MakerAuth = Maker & { access_token: string };
type MakerStats = {
  total_members: number; total_spaces: number; total_diskon: number;
  total_reservasi: number; total_pendapatan: number;
};

type Member = {
  id: number; nama_member: string; instansi: string; alamat: string;
  telp: string; foto?: string | null; created_at?: string;
};
type SpaceOwner = {
  id?: number; nama_coworking: string; nama_pemilik: string; telp: string;
  alamat?: string | null; deskripsi_fasilitas?: string | null;
};
type UserProfile = {
  id: number; username: string; role: UserRole; maker_id?: number;
  member?: Member | null; space_owner?: SpaceOwner | null;
};
type UserAuth = UserProfile & { access_token: string };

type SpaceTypeOption = { tipe: SpaceType; label: string; deskripsi: string };
type SpaceSummary = {
  id: number; nama_space: string; harga_per_jam: number; tipe: SpaceType;
  kapasitas: number; foto?: string | null; deskripsi?: string;
  id_owner?: number; owner?: SpaceOwner; foto_url?: string;
};
type Availability = {
  available: boolean; id_space: number; nama_space: string; tanggal: string;
  jam_mulai: string; jam_selesai: string; durasi_jam: number;
  harga_per_jam: number; estimasi_total: number;
};

type Diskon = {
  id: number; nama_diskon: string; persentase_diskon: number;
  tanggal_awal: string; tanggal_akhir: string; is_active?: boolean;
};

type Reservation = {
  id: number; kode_booking: string; id_member?: number; id_space?: number;
  id_diskon?: number | null; tanggal_reservasi: string; jam_mulai: string;
  jam_selesai: string; durasi_jam: number; harga_per_jam?: number;
  total_harga_awal?: number; potongan_diskon?: number; total_bayar: number;
  status: ReservationStatus; created_at?: string; updated_at?: string;
  member?: Pick<Member, 'nama_member' | 'telp'> & { id?: number };
  space?: Pick<SpaceSummary, 'nama_space' | 'harga_per_jam'> & {
    id?: number; tipe?: SpaceType;
  };
};
type ReservationHistory = {
  month: number; year: number; total_reservasi: number;
  total_pengeluaran: number;
  items: Array<{
    id: number; kode_booking: string; tanggal_reservasi: string;
    jam_mulai: string; jam_selesai: string; durasi_jam: number;
    total_bayar: number; status: ReservationStatus; space_name: string;
  }>;
};
type ETicket = {
  e_ticket_number: string; kode_booking: string;
  coworking_space: { nama: string; telepon: string };
  member: { nama: string; instansi: string; telp: string };
  space: { nama: string; tipe: string; harga_per_jam: number };
  jadwal: { tanggal: string; jam_mulai: string; jam_selesai: string; durasi: string };
  rincian_pembayaran: {
    tarif_kotor: number; diskon_promo: string; potongan: number; total_dibayar: number;
  };
  status_reservasi: ReservationStatus; qr_code_payload: string;
};

type MonthlyReport = {
  month: number; year: number; total_transaksi: number;
  total_jam_terpakai: number; estimasi_pendapatan_kotor: number;
  total_potongan_diskon: number; realisasi_pendapatan_bersih: number;
  rincian_per_tipe_space: Array<{
    tipe: SpaceType; label: string; total_booking: number;
    total_jam: number; total_pendapatan: number;
  }>;
};
type IncomeAlias = { month: number; year: number; realisasi_pendapatan_bersih: number };
type UploadGeneral = {
  filename: string; original_name: string; mimetype: string; size: number; url: string;
};
type UploadImage = { filename: string; url: string };
type DeleteResult = { id: number; deleted: true };
type StatusResult = {
  id: number; status: ReservationStatus; updated_at?: string;
  check_in_time?: string; check_out_time?: string;
};
```

Model root/health:

```ts
type RootInfo = {
  name: string; version: string; status: string; swagger_docs: string;
  description: string;
  documentation_links: { swagger: string; swagger_json: string };
};
type HealthInfo = { status: string; timestamp: string };
```

## 5. Request models

```ts
type RegisterMakerDto = { name: string; username: string; email: string; password: string };
type LoginMakerDto = { usernameOrEmail: string; password: string };
type RegisterMemberDto = {
  username: string; password: string; nama_member: string; instansi: string;
  alamat: string; telp: string; foto?: string;
};
type RegisterAdminSpaceDto = {
  username: string; password: string; nama_coworking: string;
  nama_pemilik: string; telp: string;
  alamat?: string; deskripsi_fasilitas?: string;
};
type LoginDto = { username: string; password: string };
type CheckPromoDto = { nama_diskon: string };
type CreateReservasiDto = {
  id_space: number; tanggal_reservasi: string; jam_mulai: string;
  durasi_jam: number; id_diskon?: number; kode_promo?: string;
};
type UpdateCoworkingProfileDto = {
  nama_coworking: string; nama_pemilik: string; telp: string;
  alamat?: string; deskripsi_fasilitas?: string;
};
type CreateMemberAdminDto = RegisterMemberDto;
type UpdateMemberAdminDto = Partial<Pick<RegisterMemberDto,
  'nama_member' | 'instansi' | 'alamat' | 'telp' | 'password' | 'foto'>>;
type CreateSpaceDto = {
  nama_space: string; harga_per_jam: number; tipe: SpaceType;
  kapasitas: number; deskripsi: string; foto?: string;
};
type UpdateSpaceDto = Partial<CreateSpaceDto>;
type CreateDiskonDto = {
  nama_diskon: string; persentase_diskon: number;
  tanggal_awal: string; tanggal_akhir: string;
};
type UpdateDiskonDto = Partial<CreateDiskonDto>;
type UpdateReservasiStatusDto = { status: ReservationStatus };
```

`id_diskon` dan `kode_promo` sama-sama opsional. Jika keduanya dikirim, kontrak lokal mewajibkan keduanya menunjuk record promo yang sama; untuk mengurangi mismatch, UI sebaiknya tetap mengirim satu representasi yang dipilih.

## 6. Keputusan scope seluruh 50 endpoint

Legenda: **UI** = dipakai fitur pengguna; **ops** = diagnostik terbatas; **tidak diekspos** = tidak ada route, navigasi, atau pemanggilan dari aplikasi umum. Semua collection menerima `page?`/`limit?` (default `1`/`20`, maksimum `100`) dan response membawa `X-Page`, `X-Per-Page`, `X-Total-Count`; frontend harus membaca header tersebut tanpa mengubah bentuk `data` array (history tetap memakai `data.items`).

| No. | Method dan path | Auth/header | Model data | Keputusan frontend |
|---:|---|---|---|---|
| 1 | `GET /` | publik; **tanpa tenant key** | `RootInfo` | **ops**, halaman diagnostik/dev; bukan health aplikasi frontend. |
| 2 | `GET /health` | publik; **tanpa tenant key** | `HealthInfo` | **ops**, pemeriksaan koneksi manual; jangan dipoll browser. |
| 3 | `POST /api/maker/register` | publik | `RegisterMakerDto -> MakerAuth` | **UI setup App Maker**, satu kali; tampilkan `app_key` hanya pada hasil setup. |
| 4 | `POST /api/maker/login` | publik | `LoginMakerDto -> MakerAuth` | **UI setup App Maker**. |
| 5 | `GET /api/maker/me` | Bearer Maker | `Maker` | **UI setup/profile Maker**; jangan campur token Maker dan user. |
| 6 | `GET /api/maker/stats` | Bearer Maker atau `x-maker-key` | `MakerStats` | **UI ops/dashboard maker** bila diminta penilai. |
| 7 | `GET /api/maker/list` | Bearer Guru/Penguji; `page?,limit?` | maker teredaksi (`email_masked`, `app_key_masked`) | **tidak diekspos** pada aplikasi umum; tidak ada route/navigasi/fetch biasa. Sumber panitia menyebut publik dan key utuh, tetapi profil lokal sengaja memperkerasnya. |
| 8 | `POST /api/auth/register/member` | `x-maker-key` | `RegisterMemberDto -> UserAuth` | **UI publik tenant**. |
| 9 | `POST /api/auth/register/admin-space` | `x-maker-key` | `RegisterAdminSpaceDto -> UserAuth` | **UI publik tenant**. |
| 10 | `POST /api/auth/login` | `x-maker-key` | `LoginDto -> UserAuth` | **UI login**. |
| 11 | `GET /api/auth/profile` | Bearer user + `x-maker-key` | `UserProfile` | **UI bootstrap sesi/role**. |
| 12 | `GET /api/spaces/types` | `x-maker-key` | `SpaceTypeOption[]` | **UI katalog/form**. |
| 13 | `GET /api/spaces/availability` | `x-maker-key`; query `id_space,tanggal,jam_mulai,durasi_jam` | `Availability` | **UI reservasi**, hasil bersifat cepat stale. |
| 14 | `GET /api/spaces` | `x-maker-key`; query `tipe?,search?,page?,limit?` | `SpaceSummary[]` + header pagination | **UI katalog**. |
| 15 | `GET /api/spaces/{id}` | `x-maker-key` | `SpaceSummary` | **UI detail**. |
| 16 | `GET /api/diskon/active` | `x-maker-key`; `page?,limit?` | `Diskon[]` + header pagination | **UI promo aktif**. |
| 17 | `POST /api/diskon/check` | `x-maker-key` | `CheckPromoDto -> Diskon` | **UI validasi promo**; server menjadi sumber kebenaran. |
| 18 | `GET /api/diskon/{id}` | `x-maker-key` | `Diskon` | **UI detail promo** bila diperlukan. |
| 19 | `POST /api/reservasi` | Bearer Member + `x-maker-key`; `Idempotency-Key?` | `CreateReservasiDto -> Reservation` | **UI kritis**; kirim key stabil per intent submit; retry tetap hanya setelah rekonsiliasi. |
| 20 | `GET /api/reservasi/my` | Bearer Member + `x-maker-key`; `page?,limit?` | `Reservation[]` + header pagination | **UI status reservasi**. |
| 21 | `GET /api/reservasi/my/history` | Bearer Member + `x-maker-key`; `month?,year?,page?,limit?` | `ReservationHistory` + header pagination untuk `items` | **UI histori bulanan**. |
| 22 | `GET /api/reservasi/{id}/e-ticket` | Bearer Member/Admin + `x-maker-key` | `ETicket` | **UI tiket/print**; QR dibuat dari `qr_code_payload`, bukan dipercaya sebagai otorisasi frontend. |
| 23 | `GET /api/reservasi/{id}` | Bearer Member/Admin + `x-maker-key` | `Reservation` | **UI detail**; backend wajib object-level authorization. |
| 24 | `PATCH /api/reservasi/{id}/cancel` | Bearer Member + `x-maker-key` | `StatusResult` | **UI aksi konfirmasi**; retry otomatis dimatikan. |
| 25 | `GET /api/admin/profile` | Bearer Admin + `x-maker-key` | `SpaceOwner` | **UI admin**. |
| 26 | `PUT /api/admin/profile` | Bearer Admin + `x-maker-key` | `UpdateCoworkingProfileDto -> SpaceOwner` | **UI admin**. |
| 27 | `GET /api/admin/members` | Bearer Admin + `x-maker-key`; `search?,page?,limit?` | `Member[]` + header pagination | **UI admin**. |
| 28 | `POST /api/admin/members` | Bearer Admin + `x-maker-key` | `CreateMemberAdminDto -> Member` | **UI admin**; upload foto dilakukan terpisah. |
| 29 | `GET /api/admin/members/{id}` | Bearer Admin + `x-maker-key` | `Member` | **UI admin**. |
| 30 | `PUT /api/admin/members/{id}` | Bearer Admin + `x-maker-key` | `UpdateMemberAdminDto -> Member` | **UI admin**. |
| 31 | `DELETE /api/admin/members/{id}` | Bearer Admin + `x-maker-key` | `DeleteResult` | **UI admin destructive**, dialog dan tanpa retry otomatis. |
| 32 | `GET /api/admin/spaces` | Bearer Admin + `x-maker-key`; `page?,limit?` | `SpaceSummary[]` + header pagination | **UI admin**. |
| 33 | `POST /api/admin/spaces` | Bearer Admin + `x-maker-key` | `CreateSpaceDto -> SpaceSummary` | **UI admin**. |
| 34 | `GET /api/admin/spaces/{id}` | Bearer Admin + `x-maker-key` | `SpaceSummary` | **UI admin**. |
| 35 | `PUT /api/admin/spaces/{id}` | Bearer Admin + `x-maker-key` | `UpdateSpaceDto -> SpaceSummary` | **UI admin**. |
| 36 | `DELETE /api/admin/spaces/{id}` | Bearer Admin + `x-maker-key` | `DeleteResult` | **UI admin destructive**, tanpa retry otomatis. |
| 37 | `GET /api/admin/diskon` | Bearer Admin + `x-maker-key`; `page?,limit?` | `Diskon[]` + header pagination | **UI admin**. |
| 38 | `POST /api/admin/diskon` | Bearer Admin + `x-maker-key` | `CreateDiskonDto -> Diskon` | **UI admin**. |
| 39 | `GET /api/admin/diskon/{id}` | Bearer Admin + `x-maker-key` | `Diskon` | **UI admin**. |
| 40 | `PUT /api/admin/diskon/{id}` | Bearer Admin + `x-maker-key` | `UpdateDiskonDto -> Diskon` | **UI admin**. |
| 41 | `DELETE /api/admin/diskon/{id}` | Bearer Admin + `x-maker-key` | `DeleteResult` | **UI admin destructive**, tanpa retry otomatis. |
| 42 | `GET /api/admin/reservasi` | Bearer Admin + `x-maker-key`; `month?,year?,status?,id_space?,tanggal?,page?,limit?` | `Reservation[]` + header pagination | **UI admin operasional**. |
| 43 | `PATCH /api/admin/reservasi/{id}/status` | Bearer Admin + `x-maker-key` | `UpdateReservasiStatusDto -> StatusResult` | **UI admin**; tampilkan hanya transisi yang diizinkan UI, server tetap memvalidasi. |
| 44 | `POST /api/admin/reservasi/{id}/check-in` | Bearer Admin + `x-maker-key` | `StatusResult` | **UI admin kritis**, tanpa body dan tanpa retry otomatis. |
| 45 | `POST /api/admin/reservasi/{id}/check-out` | Bearer Admin + `x-maker-key` | `StatusResult` | **UI admin kritis**, tanpa body dan tanpa retry otomatis. |
| 46 | `GET /api/admin/reports/monthly` | Bearer Admin + `x-maker-key`; `month?,year?` | `MonthlyReport` | **UI laporan utama**. |
| 47 | `GET /api/admin/reports/income` | Bearer Admin + `x-maker-key`; `month?,year?` | `IncomeAlias` | **alias/fallback**, jangan fetch bersama endpoint 46; bentuk response lebih sempit. |
| 48 | `POST /api/upload/image` | Bearer Member/Admin + `x-maker-key`; multipart `file` | `UploadGeneral` | **UI hanya untuk media umum yang nyata kebutuhannya**; JPEG/PNG/WebP, maksimum 5 MiB. |
| 49 | `POST /api/upload/spaces` | Bearer Admin + `x-maker-key`; multipart `file` | `UploadImage` | **UI admin space**; JPEG/PNG/WebP, maksimum 5 MiB. |
| 50 | `POST /api/upload/members` | Bearer Member/Admin + `x-maker-key`; multipart `file` | `UploadImage` | **UI profil/admin member**; JPEG/PNG/WebP, maksimum 5 MiB dan attachment tetap dibatasi ownership/scope. |

## 7. Client HTTP dan perilaku retry

- Timeout eksplisit disarankan 10–15 detik untuk JSON dan lebih panjang namun terbatas untuk upload.
- GET boleh retry maksimal 1–2 kali hanya untuk network error/`502`/`503`/`504`, dengan backoff dan jitter. Jangan retry `4xx`.
- POST/PUT/PATCH/DELETE tidak retry otomatis secara umum. Untuk `POST /api/reservasi`, buat `Idempotency-Key` stabil per intent submit (8–128 karakter), pertahankan selama rekonsiliasi/retry intent yang sama, dan rotasi bila payload/intent berubah.
- Saat hasil `POST /api/reservasi` tidak diketahui akibat koneksi putus, tampilkan status “hasil belum diketahui”, lalu refetch `/api/reservasi/my`. Retry dengan key yang sama hanya untuk payload yang sama setelah rekonsiliasi tidak menemukan hasil; jangan membuat key baru untuk retry buta.
- UI menonaktifkan submit selama request aktif, tetapi ini bukan jaminan idempotensi. Perlindungan definitif harus server-side.
- Gunakan `AbortController` untuk search/filter superseded dan saat komponen/unmount navigasi membatalkan request yang tidak lagi relevan.

## 8. Media

Validasi client sebelum semua upload: satu file JPEG/PNG/WebP (`.jpg`, `.jpeg`, `.png`, `.webp`), maksimum 5 MiB, serta preview via object URL yang direvoke. Kirim Bearer sesuai role dan tenant key. Client validation hanya UX; backend tetap memvalidasi magic byte, kecocokan MIME/ekstensi, ukuran, nama, storage path, quota, ownership, dan akses.

URL media dari API harus diperlakukan sebagai data tidak tepercaya. Izinkan hanya `http:`/`https:` dan host yang dikonfigurasi; jangan merangkai path dari input pengguna. Mixed content akan gagal bila frontend HTTPS menerima URL `http://localhost:3000`; gunakan `url` dari backend hanya setelah normalisasi kebijakan host atau minta backend mengembalikan URL publik benar.
