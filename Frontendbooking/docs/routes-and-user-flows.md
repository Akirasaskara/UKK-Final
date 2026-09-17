# Routes and User Flows

## 1. Status dan konvensi

Ini adalah information architecture/routing plan untuk Next.js App Router provisional. Belum ada route yang diimplementasikan.

- `[id]` wajib integer positif sebelum request.
- Filter berada di search params agar dapat di-bookmark.
- `returnTo` hanya menerima allowlist path internal untuk mencegah open redirect.
- Guard frontend adalah UX; API tetap wajib menegakkan tenant, role, dan ownership.
- Semua halaman memiliki route-level `loading`, `error`, dan `not-found` sesuai kebutuhan, ditambah state inline untuk empty/success/forbidden/session-expired.

## 2. Matriks route

### 2.1 Publik dan autentikasi pengguna

| Route | Halaman/komponen utama | Data/aksi | Akses |
|---|---|---|---|
| `/` | `PublicHeader`, hero, `SpaceCatalog`, `PromoStrip`, CTA | spaces/types, spaces, diskon active | Publik + tenant siap |
| `/spaces` | search, `SpaceTypeFilter`, `SpaceGrid` | `tipe`, `search` → `/api/spaces` | Publik |
| `/spaces/[id]` | gallery, fasilitas, kapasitas, harga, `AvailabilityForm` | space detail + availability | Publik |
| `/promos` | `PromoList` | diskon active | Publik |
| `/promos/[id]` | detail periode/persen | diskon detail | Publik |
| `/login` | `UserLoginForm` | `/api/auth/login`, profile bootstrap | Anon; authenticated dialihkan berdasar role |
| `/register/member` | `MemberRegistrationForm`, upload foto | upload members + register member | Anon |
| `/register/admin` | `AdminRegistrationForm` | register admin-space | Anon |
| `/forbidden` | penjelasan + kembali ke area sah | tanpa data sensitif | Semua |
| `/session-expired` | penjelasan + login ulang | clear sesi/cache terkait | Semua |

### 2.2 Member

| Route | Halaman/komponen utama | Data/aksi |
|---|---|---|
| `/member` | ringkasan booking, CTA katalog | my reservations |
| `/member/reservations` | `ReservationList`, `StatusBadge` | `/api/reservasi/my` |
| `/member/reservations/new` | `ReservationStepper`, jadwal, availability, promo, ringkasan | availability, promo check, create reservation |
| `/member/reservations/[id]` | detail, status timeline, cancel, e-ticket link | reservation detail, cancel |
| `/member/reservations/[id]/ticket` | `ETicket`, `QRCode`, `PrintButton` | e-ticket |
| `/member/history` | `MonthYearFilter`, summary, list | history `month`,`year` |
| `/member/profile` | profil read-only sesuai kontrak | auth profile; update diri tidak tersedia di kontrak |

### 2.3 Admin Space

| Route | Halaman/komponen utama | Data/aksi |
|---|---|---|
| `/admin` | KPI ringkas, antrean reservasi, shortcut | admin reservations/report (fetch minimum) |
| `/admin/profile` | `CoworkingProfileForm` | get/put profile |
| `/admin/members` | search, responsive table/card, add CTA | list members `search` |
| `/admin/members/new` | `MemberForm`, `ImageUpload` | upload + create |
| `/admin/members/[id]` | detail + edit/delete actions | member detail/delete |
| `/admin/members/[id]/edit` | edit form | update member |
| `/admin/spaces` | list space | admin spaces |
| `/admin/spaces/new` | `SpaceForm`, image upload | upload + create |
| `/admin/spaces/[id]` | detail/edit/delete | admin space detail/delete |
| `/admin/spaces/[id]/edit` | edit form | update space |
| `/admin/discounts` | list diskon | admin diskon |
| `/admin/discounts/new` | `DiscountForm` | create diskon |
| `/admin/discounts/[id]` | detail/edit/delete | detail/delete |
| `/admin/discounts/[id]/edit` | edit form | update diskon |
| `/admin/reservations` | filter status/bulan/space/tanggal, list | admin reservasi |
| `/admin/reservations/[id]` | detail, status actions, check-in/out, ticket | detail, status, check-in/out, e-ticket |
| `/admin/reports` | `MonthYearFilter`, KPI, breakdown tipe | monthly report; income alias tidak didobel fetch |

### 2.4 App Maker

| Route | Halaman/komponen utama | Data/aksi |
|---|---|---|
| `/maker` | setup status + navigasi | session lokal Maker |
| `/maker/register` | `MakerRegisterForm` | maker register |
| `/maker/login` | `MakerLoginForm` | maker login |
| `/maker/profile` | profil dan copy `app_key` | maker me |
| `/maker/stats` | statistik tenant | maker stats |

Tidak ada route untuk `/api/maker/list` pada aplikasi umum.

## 3. Guard dan redirect matrix

| Kondisi | Route publik | Route Member | Route Admin | Route Maker |
|---|---|---|---|---|
| tenant belum disiapkan | tampilkan setup CTA/blocked state | arahkan `/maker` | arahkan `/maker` | izinkan setup |
| anon | izinkan | `/login?returnTo=...` | `/login?returnTo=...` | maker login/register |
| role `member` | izinkan | izinkan | `/forbidden` | hanya jika sesi Maker terpisah valid |
| role `admin_space` | izinkan | `/forbidden` | izinkan | hanya jika sesi Maker terpisah valid |
| token kedaluwarsa | publik tetap bisa tampil bila tenant ada | clear user cache → `/session-expired` | sama | clear Maker session → `/maker/login` |
| 403 dari API, sesi valid | tetap pada halaman dengan forbidden | forbidden, jangan logout otomatis | forbidden, jangan logout otomatis | forbidden |
| role tak dikenal | jangan render data privat | logout aman/forbidden | logout aman/forbidden | tidak relevan |

Server guard, middleware, dan client guard tidak boleh hanya membaca cookie yang belum tervalidasi. Profil `/api/auth/profile` adalah sumber role. Hindari redirect loop dengan menandai route login/session-expired sebagai public.

## 4. Alur utama dan alternatif

### 4.1 Setup App Maker

1. Pengguna membuka `/maker`.
2. Bila belum memiliki sesi/key, pilih register atau login.
3. Register mengirim `name`, `username`, `email`, `password`.
4. Setelah 201, tampilkan `app_key` sekali pada success panel, sediakan copy, dan peringatan tidak menaruhnya di URL/log.
5. Verifikasi profil melalui maker me, lalu buka statistik atau aplikasi publik tenant.

Alternatif/gagal:

- 400 duplikat: pertahankan field non-password, fokus summary error.
- 401 login: pesan generik, password dikosongkan.
- timeout mutasi: jangan menyatakan akun gagal dibuat; tawarkan login/reconcile.
- maker profile 401: hanya sesi Maker yang dibersihkan, bukan sesi Member/Admin.

### 4.2 Register/login Member

1. Pengunjung dapat upload foto opsional, lalu mengirim field registrasi.
2. Upload sukses tidak berarti registrasi sukses; tampilkan status “foto terunggah, profil belum tersimpan”.
3. Setelah register/login valid, bootstrap profile.
4. Role `member` diarahkan ke `returnTo` yang valid atau `/member`.

Alternatif/gagal: file invalid, upload orphan, username duplikat, kredensial salah, tenant invalid, response schema berubah, network offline.

### 4.3 Reservasi Member

1. Pilih space dari katalog/detail.
2. Isi `tanggal_reservasi`, `jam_mulai`, `durasi_jam`.
3. Cek availability; hasil menampilkan waktu terakhir diperiksa.
4. Pilih satu promo (`id_diskon`) atau masukkan `kode_promo`; jangan kirim keduanya sampai precedence resmi.
5. Tinjau estimasi, bukan harga final.
6. Saat konfirmasi, lock submit dan refetch availability.
7. Kirim `POST /api/reservasi` tanpa retry otomatis.
8. Pada 201, tampilkan success dengan `kode_booking`, `status`, dan nilai server; tautkan detail/e-ticket.

Alternatif/gagal:

- input berubah: availability dan preview promo langsung stale/reset;
- slot tidak tersedia: tampilkan conflict dekat jadwal dan kembali ke pemilihan;
- promo invalid/kedaluwarsa: pengguna dapat menghapus promo dan lanjut;
- 401: simpan hanya return path non-sensitif, login ulang, jangan auto-submit;
- timeout setelah POST: state “hasil belum diketahui”, refetch my reservations, minta cocokkan jadwal/kode sebelum mencoba lagi;
- klik ganda: invocation kedua ditolak;
- response malformed: contract error, jangan tampilkan sukses.

### 4.4 E-ticket dan print

1. Member/Admin berwenang membuka route ticket.
2. Data menampilkan nomor tiket, `kode_booking`, coworking, member, space, jadwal, pembayaran, status.
3. QR mengenkode `qr_code_payload` sebagai teks/data tanpa navigasi otomatis.
4. Tombol cetak membuka print browser.
5. `@media print` menyembunyikan navigation/action, mempertahankan QR dan identitas tiket, serta memakai A4 dengan fallback monochrome.

Alternatif/gagal: 403 → forbidden; 404 → not found; QR gagal dirender → payload teks + pesan; printer dialog dibatalkan → tidak dianggap error; session expired → login ulang lalu kembali ke ticket tanpa membawa token di URL.

### 4.5 Admin CRUD

Pola Members/Spaces/Discounts:

1. List → search/filter → detail → create/edit/delete.
2. Form memvalidasi field kontrak dan memuat data existing tanpa menimpa field dirty saat refetch.
3. Upload foto (jika ada) selesai sebelum mutation entity; state dipisah.
4. Mutation sukses menginvalidasi list/detail dan dependent public data.
5. Delete selalu melalui dialog bernama resource; tidak optimistic remove.

Alternatif/gagal: duplicate, 404 stale, delete direferensikan reservasi, timeout unknown result, upload berhasil tetapi save entity gagal.

### 4.6 Admin check-in/check-out

1. Buka detail reservasi terbaru.
2. UI menampilkan aksi berdasarkan status terakhir, tetapi refetch sebelum aksi.
3. `belum_dikonfirm` dapat ditawarkan approve/cancel hanya bila aturan backend dikonfirmasi.
4. Check-in memakai endpoint khusus dan hasil `aktif`.
5. Check-out memakai endpoint khusus dan hasil `selesai`.
6. Lock mutation per reservation ID dan invalidasi detail/list/ticket/report.

Alternatif/gagal: transisi stale/invalid, aksi dua tab, klik ganda, 403, timeout. UI tidak mengarang status; selalu reconcile dari server.

### 4.7 Laporan

1. Filter `month` dan `year` disimpan di URL.
2. Fetch `/api/admin/reports/monthly` sebagai sumber utama.
3. Render KPI dan `rincian_per_tipe_space` untuk ketiga enum bila tersedia.
4. Empty month menampilkan nol/empty explanation, bukan error.
5. Alias `/income` hanya fallback/use case sempit, tidak dipanggil paralel.

## 5. Acceptance criteria route/flow (Given/When/Then)

| ID | Given | When | Then |
|---|---|---|---|
| FLOW-01 | pengguna anon membuka `/member/reservations` | guard selesai memeriksa sesi | dialihkan ke `/login` dengan `returnTo` internal; tidak ada data privat dirender |
| FLOW-02 | Member membuka `/admin` | role tervalidasi `member` | tampil `/forbidden`; tidak terjadi request data admin |
| FLOW-03 | availability sukses lalu input durasi berubah | perubahan terdeteksi | hasil lama ditandai tidak valid dan tombol submit nonaktif sampai recheck |
| FLOW-04 | create reservation sedang pending | tombol diklik lagi | hanya satu request dikirim dan tombol memiliki disabled + `aria-busy=true` |
| FLOW-05 | response POST timeout | rekonsiliasi dijalankan | UI tidak menampilkan sukses/gagal final dan tidak auto-resubmit |
| FLOW-06 | e-ticket valid dibuka | pengguna memilih print | navigation/action tersembunyi, nomor tiket/kode/QR/jadwal/total terlihat pada A4 |
| FLOW-07 | Admin check-in dari detail stale | server menolak transisi | status direfetch, pesan konflik tampil, tidak ada optimistic `aktif` |
| FLOW-08 | JWT kedaluwarsa pada request privat | API memberi 401 | cache privat subject dibatalkan/dihapus dan route menuju session-expired sekali, tanpa loop |
| FLOW-09 | API memberi 403 dengan sesi valid | error dinormalisasi | sesi tidak otomatis dihapus dan halaman forbidden tampil |
| FLOW-10 | list kosong | fetch sukses dengan `data: []` | empty state domain tampil, bukan error/skeleton permanen |
| FLOW-11 | App Maker dan Member sama-sama login | Member logout | hanya sesi/cache Member yang dibersihkan; Maker session tetap utuh |
| FLOW-12 | viewport 320/768/1440 px | seluruh route utama digunakan | tidak ada kontrol terpotong; tabel admin memiliki region scroll berlabel bila perlu |

## 6. Komponen lintas route

`PublicHeader`, `MemberNav`, `AdminSidebar`, `MakerNav`, `Breadcrumbs`, `PageHeader`, `DataState`, `ErrorSummary`, `FieldError`, `StatusBadge`, `SpaceCard`, `Money`, `DateTime`, `ImageWithFallback`, `SearchField`, `FilterBar`, `ResponsiveDataList`, `ConfirmDialog`, `ToastRegion`, `SessionExpiredNotice`, `ForbiddenState`, `ImageUpload`, `ReservationTimeline`, `ETicket`, `QRCode`, dan `PrintButton`.

Spesifikasi visual dan aksesibilitas ada di [design system](./design-system.md); model API ada di [integrasi API](./api-integration.md).