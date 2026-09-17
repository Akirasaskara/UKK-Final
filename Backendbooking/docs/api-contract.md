# Kontrak API Smart Space Booking

## Status dan konvensi

Dokumen ini adalah kontrak target kategori Backend, bukan bukti implementasi. Urutan `API-EP-001..050` mengikuti tepat urutan sumber `Rev_Soal_UKK_2026-2027_Paket_B (1).md`. Base URL contoh sumber adalah `https://learn.smktelkom-mlg.sch.id/coworking/`; server lokal/produksi harus dikonfigurasi, bukan di-hard-code.

Semua response JSON memakai envelope:

- sukses: `{"status":true,"statusCode":200|201,"message":"...","data":...,"timestamp":"date-time"}`;
- gagal: `{"status":false,"statusCode":400|401|403|404|409|413|429|500,"message":"pesan aman","error":"NamaError","timestamp":"date-time"}`.

Konvensi global:

- `x-maker-key` dan `x-app-key` adalah alias tenant key. Untuk endpoint tenant-scoped, salah satu wajib; bila keduanya dikirim nilainya wajib sama. Root, health, maker register/login tidak memerlukannya.
- `Authorization: Bearer <JWT>` wajib pada endpoint terproteksi. Claim role bisnis hanya `member|admin_space`; bearer App Maker dipakai pada endpoint maker. Resource selalu diperiksa tenant, role, ownership, dan state di server.
- ID adalah integer positif. Tanggal reservasi `YYYY-MM-DD`, jam `HH:mm`, durasi integer minimal 1, uang integer IDR. Enum tipe: `desk|meeting_room|private_office`. Enum status: `belum_dikonfirm|disetujui|aktif|selesai|dibatalkan`.
- **Ekstensi pagination final:** seluruh collection menerima `page` dan `limit` opsional (default 1/20, maksimum 100). Bentuk body tetap source-compatible: `data` tetap array; khusus history, `data.items` tetap array dalam object ringkasan sumber. Setiap response collection wajib mengirim `X-Page`, `X-Per-Page`, dan `X-Total-Count`; header adalah integer nonnegatif dan diekspos melalui CORS. Urutan default stabil berdasarkan `id` menaik, kecuali histori/reservasi menggunakan tanggal lalu `id` menurun. Header opsional `Idempotency-Key` didukung pada pembuatan reservasi.
- **Konflik upload:** detail sumber menyebut cukup app key/tanpa bearer, sedangkan ringkasan memberi scope User/Admin. Kontrak ini memilih default aman: bearer wajib; general untuk member/admin, spaces khusus admin, members untuk member/admin. Maksimum file ditetapkan 5 MiB; JPEG/PNG/WebP, satu file, magic-byte tervalidasi, nama storage dibuat server.
- **Konflik maker list:** sumber menyebut publik dan menampilkan app key/PII. Kontrak aman mewajibkan bearer Guru/Penguji dan meredaksi `email`/`app_key`; mekanisme penerbitan role tersebut berada di luar 50 endpoint.
- **Konflik QR:** contoh sumber memuat app key. Kontrak ini menggantinya dengan token opaque/signed tanpa app key, JWT, atau PII.
- **Ekstensi profil:** `alamat` dan `deskripsi_fasilitas` opsional ditambahkan karena kebutuhan fitur menyebutnya tetapi DTO sumber tidak.
- DELETE member/space/diskon berarti archive/soft-delete bila sudah direferensikan histori; response tetap `deleted:true` untuk kompatibilitas.

## Endpoint dalam urutan sumber

### API-EP-001 — `GET /`
- **Auth/scope:** publik; tanpa tenant key. **Header/parameter/body:** tidak ada.
- **Sukses:** 200; `data` berisi `name`, `version`, `status`, `swagger_docs`, `description`, `documentation_links`. Contoh ringkas: `{"status":true,"statusCode":200,"data":{"name":"Coworking Space Backend API - UKK RPL Paket B","version":"1.0.0","status":"online","swagger_docs":"/docs"}}`.
- **Error:** 500 envelope standar. **Aturan:** hanya metadata publik; URL dibentuk dari konfigurasi dan tidak membocorkan dependency/secret.

### API-EP-002 — `GET /health`
- **Auth/scope:** publik; liveness proses. **Header/parameter/body:** tidak ada.
- **Sukses:** 200; `data:{status:"ok",timestamp:"date-time"}`. **Error:** 500 bila proses tidak dapat melayani.
- **Aturan:** check murah dan tidak membeberkan hostname/status dependency; readiness terpisah bukan bagian 50 endpoint.

### API-EP-003 — `POST /api/maker/register`
- **Auth/scope:** publik. **Header:** `Content-Type: application/json`. **Body:** `name`, `username`, `email`, `password` wajib; password minimal 6 sesuai sumber.
- **Sukses:** 201; profil maker, `app_key`, timestamps, `access_token`. Contoh data: `{"id":5,"name":"Budi Santoso","username":"budisantoso","email":"budi@smk.sch.id","app_key":"mk_...","access_token":"ey..."}`.
- **Error:** 400 validasi/duplikat kompatibel sumber, 409 race unique, 429 abuse, 500. **Aturan:** username/email unik; password di-hash; maker+key dibuat atomik; key CSPRNG. Agar raw key source-compatible dapat dikembalikan lagi oleh login/me, DB menyimpan lookup digest `app_key_hash` dan authenticated `app_key_ciphertext` recoverable dengan versioned KEK terpisah; tidak ada raw plaintext at rest dan key tidak pernah dicatat di log/trace/error.

### API-EP-004 — `POST /api/maker/login`
- **Auth/scope:** publik. **Body:** `usernameOrEmail`, `password` wajib.
- **Sukses:** 200; profil maker, `app_key`, `access_token`. **Error:** 400 payload, 401 kredensial generik, 429, 500.
- **Aturan:** rate limit; perbandingan password hash; response tidak mengungkap identifier valid. Setelah autentikasi berhasil, server mendekripsi `app_key_ciphertext` untuk maker tersebut; kegagalan decrypt bersifat fail-closed dan tidak membocorkan ciphertext/key.

### API-EP-005 — `GET /api/maker/me`
- **Auth/scope:** bearer App Maker. **Header:** `Authorization`; tanpa app key karena token menentukan tenant.
- **Sukses:** 200; `id,name,username,email,app_key,created_at`. **Error:** 401, 403, 500.
- **Aturan:** hanya profil maker token; raw `app_key` diperoleh dari decrypt terotorisasi untuk kompatibilitas sumber; password, lookup hash, ciphertext, dan key version tidak pernah keluar.

### API-EP-006 — `GET /api/maker/stats`
- **Auth/scope:** bearer App Maker **atau** tenant key valid sesuai sumber. **Header:** `Authorization` atau salah satu tenant key.
- **Sukses:** 200; `total_members,total_spaces,total_diskon,total_reservasi,total_pendapatan`. Contoh: `{"total_members":5,"total_spaces":4,"total_diskon":3,"total_reservasi":12,"total_pendapatan":1450000}`.
- **Error:** 400 header konflik, 401 key/token invalid, 429, 500. **Aturan:** agregat hanya tenant terkait; pendapatan integer IDR.

### API-EP-007 — `GET /api/maker/list`
- **Auth/scope:** **ekstensi keamanan:** bearer Guru/Penguji, bukan publik. **Query opsional:** `page`, `limit`.
- **Sukses:** 200; array maker `id,name,username,email_masked,app_key_masked,created_at`; header pagination wajib. **Error:** 400, 401, 403, 429, 500.
- **Aturan/konflik:** sumber mempublikasikan email dan app key utuh; hal itu merusak boundary tenant. Daftar dibatasi, diurutkan, diaudit, dan credential diredaksi.

### API-EP-008 — `POST /api/auth/register/member`
- **Auth/scope:** publik dalam tenant. **Header:** tenant key. **Body:** `username,password,nama_member,instansi,alamat,telp` wajib; `foto` opsional.
- **Sukses:** 201; wajib `id,username,role:"member",member,access_token`; `maker_id` dan `space_owner:null` tidak diwajibkan agar source-compatible. **Error:** 400, 409 duplikat, 429, 500.
- **Aturan:** User+Member satu transaksi; username unik per tenant; foto opsional mengikuti DTO meski fitur umum menyebut foto saat daftar.

### API-EP-009 — `POST /api/auth/register/admin-space`
- **Auth/scope:** publik dalam tenant. **Header:** tenant key. **Body:** `username,password,nama_coworking,nama_pemilik,telp` wajib; `alamat,deskripsi_fasilitas` opsional (ekstensi).
- **Sukses:** 201; wajib `id,username,role:"admin_space",space_owner,access_token`; `maker_id` dan `member:null` tidak diwajibkan agar source-compatible. **Error:** 400, 409, 429, 500.
- **Aturan:** User+Owner atomik; username unik per tenant; field profil tambahan menutup gap kebutuhan tanpa mematahkan klien lama.

### API-EP-010 — `POST /api/auth/login`
- **Auth/scope:** publik dalam tenant. **Header:** tenant key. **Body:** `username,password`.
- **Sukses:** 200; wajib `id,username,role,access_token`; `maker_id` source-compatible opsional; `member` dan `space_owner` opsional/nullable, dengan profil role terkait hadir bila data konsisten. Frontend harus menoleransi field opsional atau `null`. **Error:** 400, 401 generik, 429, 500.
- **Aturan:** login selalu di-scope tenant; invariant backend memastikan tepat satu profil cocok dengan role, tanpa menjadikan profil role lain wajib dalam payload.

### API-EP-011 — `GET /api/auth/profile`
- **Auth/scope:** bearer member/admin tenant yang sama. **Header:** bearer + tenant key.
- **Sukses:** 200; wajib `id,username,role`; `maker_id` opsional dan profil `member`/`space_owner` opsional/nullable agar sesuai source/frontend, sementara profil role terkait harus konsisten secara bisnis. **Error:** 400 mismatch header/token, 401, 403, 500.
- **Aturan:** profil diri sendiri; tidak ada password/hash/internal claim; frontend menoleransi absent maupun `null` untuk profil yang tidak terkait.

### API-EP-012 — `GET /api/spaces/types`
- **Auth/scope:** katalog tenant, tanpa bearer; tenant key wajib. **Body/parameter:** tidak ada.
- **Sukses:** 200; tiga item `{tipe,label,deskripsi}` untuk `desk`, `meeting_room`, `private_office`. **Error:** 400, 401 tenant key invalid, 500.
- **Aturan:** enum tetap persis sumber.

### API-EP-013 — `GET /api/spaces/availability`
- **Auth/scope:** katalog tenant; tenant key wajib. **Query wajib:** `id_space,tanggal,jam_mulai,durasi_jam`.
- **Sukses:** 200; `available,id_space,nama_space,tanggal,jam_mulai,jam_selesai,durasi_jam,harga_per_jam,estimasi_total`. **Error:** 400 invalid/tidak tersedia sesuai sumber, 404 space, 500.
- **Aturan:** interval `[start,end)`; durasi ≥1; tidak lintas hari; status `belum_dikonfirm|disetujui|aktif` memblokir. Hasil hanya advisory, bukan lock.

### API-EP-014 — `GET /api/spaces`
- **Auth/scope:** katalog tenant; tenant key wajib. **Query:** `tipe`, `search`, `page`, `limit` opsional.
- **Sukses:** 200 array Space dengan `owner` dan `foto_url`. **Error:** 400 filter/pagination, 401, 500.
- **Aturan:** hanya space aktif tenant; tipe allowlist; search dibatasi/di-escape; query bounded dan tanpa N+1.

### API-EP-015 — `GET /api/spaces/{id}`
- **Auth/scope:** katalog tenant; tenant key wajib. **Path:** `id` integer positif.
- **Sukses:** 200 Space detail (`id,nama_space,harga_per_jam,tipe,kapasitas,foto,deskripsi,id_owner,owner,foto_url`). **Error:** 400, 404 termasuk lintas tenant, 500.
- **Aturan:** projection DTO, bukan entity database.

### API-EP-016 — `GET /api/diskon/active`
- **Auth/scope:** tenant catalog; tenant key wajib. **Query:** `page`, `limit`.
- **Sukses:** 200 array Diskon. **Error:** 400, 401, 500.
- **Aturan:** hanya promo belum diarsipkan dan waktu sekarang inklusif dalam periode menurut business timezone.

### API-EP-017 — `POST /api/diskon/check`
- **Auth/scope:** tenant catalog; tenant key wajib. **Body:** `nama_diskon` wajib.
- **Sukses:** 200 Diskon plus `is_active:true`. **Error:** 400 kode tidak ada/kedaluwarsa, 401, 429, 500.
- **Aturan/konflik:** endpoint hanya memvalidasi kode/periode dan persen; nominal tidak dapat dihitung tanpa harga/durasi dan dihitung saat reservasi.

### API-EP-018 — `GET /api/diskon/{id}`
- **Auth/scope:** tenant catalog; tenant key wajib. **Path:** `id`.
- **Sukses:** 200 Diskon. **Error:** 400, 404 termasuk lintas tenant, 500.
- **Aturan:** hanya promo dalam tenant; data arsip tidak ditawarkan untuk booking baru.

### API-EP-019 — `POST /api/reservasi`
- **Auth/scope:** bearer `member`, milik sendiri. **Header:** bearer + tenant key; `Idempotency-Key` opsional. **Body:** `id_space,tanggal_reservasi,jam_mulai,durasi_jam` wajib; `id_diskon,kode_promo` opsional.
- **Sukses:** 201 Reservation lengkap termasuk `kode_booking,jam_selesai,harga_per_jam,total_harga_awal,potongan_diskon,total_bayar,status:"belum_dikonfirm"`. **Error:** 400 payload/promo, 401, 403, 404, 409 overlap/idempotency, 429, 500.
- **Aturan:** member dari token; owner dari space; kedua referensi promo bila hadir wajib menunjuk record sama; harga/total server-side; insert booking+detail atomik dan overlap dicegah pada DB/lock.

### API-EP-020 — `GET /api/reservasi/my`
- **Auth/scope:** bearer `member`; hanya milik sendiri. **Header:** bearer + tenant key. **Query:** `page`, `limit`.
- **Sukses:** 200 array ringkasan Reservation dengan SpaceSummary. **Error:** 400, 401, 403, 500.
- **Aturan:** urutan tanggal reservasi dan id menurun; bounded; tidak dapat memilih `id_member` dari query.

### API-EP-021 — `GET /api/reservasi/my/history`
- **Auth/scope:** bearer `member`; hanya milik sendiri. **Query:** `month` 1..12, `year` 2000..2100, `page`, `limit`, seluruhnya opsional.
- **Sukses:** 200 `{month,year,total_reservasi,total_pengeluaran,items}`. **Error:** 400, 401, 403, 500.
- **Aturan:** bulan memakai business timezone; total dari snapshot transaksi; default bulan/tahun berjalan.

### API-EP-022 — `GET /api/reservasi/{id}/e-ticket`
- **Auth/scope:** bearer member pemilik atau admin pemilik space; tenant sama. **Path:** `id`.
- **Sukses:** 200 E-Ticket berisi nomor tiket, booking, coworking, member, space, jadwal, pembayaran, status, `qr_code_payload`. **Error:** 400, 401, 403/404 tersamar, 500.
- **Aturan/konflik:** QR adalah token opaque/signed; contoh app key dalam sumber sengaja tidak dipertahankan demi keamanan. Jalur wajib scan/validate adalah admin memindai/memasukkan QR, menginspeksi response e-ticket EP-022 dalam scope otorisasi, lalu memanggil EP-044 dengan `id` reservasi yang telah cocok. Endpoint verifikasi QR khusus tetap OPTIONAL dan bukan operasi ke-51.

### API-EP-023 — `GET /api/reservasi/{id}`
- **Auth/scope:** bearer member pemilik atau admin owner. **Path:** `id`.
- **Sukses:** 200 ReservationDetail dengan member/space. **Error:** 400, 401, 403/404, 500.
- **Aturan:** query langsung scoped tenant+ownership; snapshot transaksi tidak berubah setelah master diedit.

### API-EP-024 — `PATCH /api/reservasi/{id}/cancel`
- **Auth/scope:** bearer `member`, reservasi sendiri. **Path:** `id`; body kosong.
- **Sukses:** 200 `{id,status:"dibatalkan",updated_at}`. **Error:** 400, 401, 403/404, 409 state/stale write, 500.
- **Aturan:** hanya dari `belum_dikonfirm|disetujui`; `aktif|selesai|dibatalkan` tidak dapat dibatalkan; perubahan atomik.

### API-EP-025 — `GET /api/admin/profile`
- **Auth/scope:** bearer `admin_space`, profil sendiri. **Header:** bearer + tenant key.
- **Sukses:** 200 Owner (`id,nama_coworking,nama_pemilik,telp,alamat?,deskripsi_fasilitas?`). **Error:** 401, 403, 404, 500.
- **Aturan:** owner berasal dari token, bukan parameter klien.

### API-EP-026 — `PUT /api/admin/profile`
- **Auth/scope:** bearer `admin_space`, profil sendiri. **Body:** `nama_coworking,nama_pemilik,telp` wajib; extension `alamat,deskripsi_fasilitas` opsional.
- **Sukses:** 200 Owner terbaru. **Error:** 400, 401, 403, 500.
- **Aturan:** full update untuk tiga field sumber; whitespace-only ditolak; field internal tidak dapat diubah.

### API-EP-027 — `GET /api/admin/members`
- **Auth/scope:** bearer `admin_space`, tenant sendiri. **Query:** `search,page,limit`.
- **Sukses:** 200 array Member. **Error:** 400, 401, 403, 500.
- **Aturan:** search nama/instansi/telp, bounded dan deterministic; archived tidak tampil.

### API-EP-028 — `POST /api/admin/members`
- **Auth/scope:** bearer `admin_space`, tenant sendiri. **Body:** `username,password,nama_member,instansi,alamat,telp` wajib; `foto` opsional.
- **Sukses:** 201 Member. **Error:** 400, 401, 403, 409 username, 500.
- **Aturan:** User+Member atomik; password di-hash; admin tidak dapat menentukan role/tenant.

### API-EP-029 — `GET /api/admin/members/{id}`
- **Auth/scope:** bearer `admin_space`; member dalam tenant/scope admin. **Path:** `id`.
- **Sukses:** 200 Member. **Error:** 400, 401, 403/404, 500.
- **Aturan:** object-level authorization; response tanpa user password/hash.

### API-EP-030 — `PUT /api/admin/members/{id}`
- **Auth/scope:** bearer `admin_space`; member dalam scope. **Body:** semua opsional: `nama_member,instansi,alamat,telp,password,foto`; minimal satu field.
- **Sukses:** 200 Member terbaru. **Error:** 400, 401, 403/404, 409, 500.
- **Aturan:** update whitelist; password bila ada di-hash; field kosong/null ilegal.

### API-EP-031 — `DELETE /api/admin/members/{id}`
- **Auth/scope:** bearer `admin_space`; member dalam scope. **Path:** `id`.
- **Sukses:** 200 `{id,deleted:true}`. **Error:** 400, 401, 403/404, 409, 500.
- **Aturan:** archive bila memiliki histori; reservasi/snapshot tidak dihapus.

### API-EP-032 — `GET /api/admin/spaces`
- **Auth/scope:** bearer `admin_space`; hanya space owner sendiri. **Query:** `page`, `limit`.
- **Sukses:** 200 array Space. **Error:** 400, 401, 403, 500.
- **Aturan:** bounded; archived tidak tampil; `foto_url` dari storage adapter.

### API-EP-033 — `POST /api/admin/spaces`
- **Auth/scope:** bearer `admin_space`. **Body:** `nama_space,harga_per_jam,tipe,kapasitas,deskripsi` wajib; `foto` opsional.
- **Sukses:** 201 Space dengan `id_owner` dari token. **Error:** 400, 401, 403, 500.
- **Aturan:** harga integer ≥0, kapasitas >0, tipe enum; owner/body internal diabaikan/ditolak.

### API-EP-034 — `GET /api/admin/spaces/{id}`
- **Auth/scope:** bearer `admin_space`; space owner sendiri. **Path:** `id`.
- **Sukses:** 200 Space. **Error:** 400, 401, 403/404, 500.
- **Aturan:** object-level owner predicate diterapkan pada query.

### API-EP-035 — `PUT /api/admin/spaces/{id}`
- **Auth/scope:** bearer `admin_space`; space owner sendiri. **Body:** seluruh field CreateSpace opsional; minimal satu.
- **Sukses:** 200 Space terbaru. **Error:** 400, 401, 403/404, 409, 500.
- **Aturan:** perubahan harga tidak mengubah snapshot reservasi lama.

### API-EP-036 — `DELETE /api/admin/spaces/{id}`
- **Auth/scope:** bearer `admin_space`; space owner sendiri. **Path:** `id`.
- **Sukses:** 200 `{id,deleted:true}`. **Error:** 400, 401, 403/404, 409, 500.
- **Aturan:** archive bila direferensikan; space archived tidak dapat dipesan tetapi histori tetap valid.

### API-EP-037 — `GET /api/admin/diskon`
- **Auth/scope:** bearer `admin_space`; promo owner/tenant sendiri. **Query:** `page`, `limit`.
- **Sukses:** 200 array Diskon. **Error:** 400, 401, 403, 500.
- **Aturan:** bounded/deterministic; termasuk promo belum aktif/kedaluwarsa tetapi bukan archived.

### API-EP-038 — `POST /api/admin/diskon`
- **Auth/scope:** bearer `admin_space`. **Body:** `nama_diskon,persentase_diskon,tanggal_awal,tanggal_akhir` wajib.
- **Sukses:** 201 Diskon. **Error:** 400, 401, 403, 409 kode duplikat, 500.
- **Aturan:** kode trim+uppercase, unik per owner/tenant; persen 1..100; akhir ≥ awal.

### API-EP-039 — `GET /api/admin/diskon/{id}`
- **Auth/scope:** bearer `admin_space`; promo dalam scope. **Path:** `id`.
- **Sukses:** 200 Diskon. **Error:** 400, 401, 403/404, 500.
- **Aturan:** lintas owner/tenant disamarkan sebagai not found.

### API-EP-040 — `PUT /api/admin/diskon/{id}`
- **Auth/scope:** bearer `admin_space`; promo dalam scope. **Body:** semua field diskon opsional; minimal satu.
- **Sukses:** 200 Diskon terbaru. **Error:** 400 periode/persen, 401, 403/404, 409, 500.
- **Aturan:** periode hasil akhir tetap valid; perubahan tidak mengubah snapshot booking lama.

### API-EP-041 — `DELETE /api/admin/diskon/{id}`
- **Auth/scope:** bearer `admin_space`; promo dalam scope. **Path:** `id`.
- **Sukses:** 200 `{id,deleted:true}`. **Error:** 400, 401, 403/404, 409, 500.
- **Aturan:** archive jika direferensikan; promo archived tidak valid untuk booking baru.

### API-EP-042 — `GET /api/admin/reservasi`
- **Auth/scope:** bearer `admin_space`; reservasi owner sendiri. **Query:** `month,year,status,id_space,tanggal,page,limit` opsional.
- **Sukses:** 200 array AdminReservation dengan member/space. **Error:** 400, 401, 403, 500.
- **Aturan:** month 1..12; tanggal `YYYY-MM-DD`; seluruh filter di-scope owner/tenant; urutan tanggal/id menurun.

### API-EP-043 — `PATCH /api/admin/reservasi/{id}/status`
- **Auth/scope:** bearer `admin_space`; reservasi owner sendiri. **Body:** `status` enum sumber.
- **Sukses:** 200 `{id,status,updated_at}`. **Error:** 400, 401, 403/404, 409 transisi/stale, 500.
- **Aturan:** endpoint hanya mengizinkan `belum_dikonfirm→disetujui|dibatalkan` dan `disetujui→dibatalkan`; `aktif/selesai` hanya melalui check-in/out walau enum DTO sumber lebih luas.

### API-EP-044 — `POST /api/admin/reservasi/{id}/check-in`
- **Auth/scope:** bearer `admin_space`; reservasi owner sendiri. **Path:** `id`; body kosong.
- **Sukses:** 200 `{id,status:"aktif",check_in_time}`. **Error:** 400, 401, 403/404, 409 state/duplicate, 500.
- **Aturan:** sebelum mutasi, admin wajib telah menginspeksi e-ticket EP-022 (termasuk kecocokan booking/status/owner) dari hasil scan/input operasional; lalu EP-044 menjalankan hanya `disetujui→aktif` dan mencatat timestamp sekali dalam transaksi. EP-044 tetap melakukan seluruh authorization/state check sehingga inspeksi UI bukan kontrol keamanan.

### API-EP-045 — `POST /api/admin/reservasi/{id}/check-out`
- **Auth/scope:** bearer `admin_space`; reservasi owner sendiri. **Path:** `id`; body kosong.
- **Sukses:** 200 `{id,status:"selesai",check_out_time}`. **Error:** 400, 401, 403/404, 409 state/duplicate, 500.
- **Aturan:** hanya `aktif→selesai`; timestamp sekali dan tidak lebih awal dari check-in.

### API-EP-046 — `GET /api/admin/reports/monthly`
- **Auth/scope:** bearer `admin_space`; agregat owner sendiri. **Query:** `month` 1..12 dan `year` 2000..2100 opsional (default bulan berjalan).
- **Sukses:** 200 MonthlyReport dengan `total_transaksi,total_jam_terpakai,estimasi_pendapatan_kotor,total_potongan_diskon,realisasi_pendapatan_bersih,rincian_per_tipe_space`. **Error:** 400, 401, 403, 500.
- **Aturan/konflik:** estimasi mencakup `disetujui|aktif|selesai`; realisasi hanya `selesai` sebagai proxy layanan selesai, bukan bukti payment; snapshot dan business timezone dipakai.

### API-EP-047 — `GET /api/admin/reports/income`
- **Auth/scope:** bearer `admin_space`. **Query:** `month`, `year` seperti EP-046.
- **Sukses:** 200 `{month,year,realisasi_pendapatan_bersih}`. **Error:** 400, 401, 403, 500.
- **Aturan:** alias memakai scope, periode, status, dan formula yang sama dengan EP-046.

### API-EP-048 — `POST /api/upload/image`
- **Auth/scope:** **lebih aman dari detail sumber:** bearer `member|admin_space`, tenant sama. **Header/body:** bearer + tenant key; `multipart/form-data`, field tunggal `file` binary JPEG/PNG/WebP.
- **Sukses:** 201 `{filename,original_name,mimetype,size,url}`. **Error:** 400 file invalid, 401, 403, 413 >5 MiB, 429, 500.
- **Aturan:** magic bytes/MIME/extension cocok; key server-generated pada kategori general; nama asli hanya metadata aman; quota/rate limit.

### API-EP-049 — `POST /api/upload/spaces`
- **Auth/scope:** **lebih aman dari detail sumber:** bearer `admin_space`. **Body:** multipart field `file`, JPEG/PNG/WebP, maksimum 5 MiB.
- **Sukses:** 201 `{filename,url}`. **Error:** 400, 401, 403, 413, 429, 500.
- **Aturan:** object berada pada prefix tenant/spaces; tidak ada overwrite/path traversal; URL environment-aware.

### API-EP-050 — `POST /api/upload/members`
- **Auth/scope:** **lebih aman dari detail sumber:** bearer `member|admin_space`. **Body:** multipart field `file`, JPEG/PNG/WebP, maksimum 5 MiB.
- **Sukses:** 201 `{filename,url}`. **Error:** 400, 401, 403, 413, 429, 500.
- **Aturan:** member hanya dapat memakai foto untuk dirinya; admin hanya untuk member dalam scope; object prefix tenant/members dan key dibuat server.

## Ringkasan konflik dan ekstensi yang mengikat

1. Upload tidak mengikuti klaim “tanpa auth” pada detail sumber; bearer diwajibkan untuk mencegah abuse dan tenant pollution.
2. `/api/maker/list` tidak publik dan tidak mengembalikan credential utuh.
3. QR tidak memuat app key seperti contoh sumber.
4. `alamat`/`deskripsi_fasilitas` owner, pagination query + response headers (body array tetap source-compatible), error 409/413/429, soft-delete, dan `Idempotency-Key` adalah ekstensi backward-compatible.
5. `PATCH status` mempertahankan enum sumber pada schema, tetapi state machine membatasi transisi agar check-in/out tidak dapat dilewati.
6. Timezone bisnis, JWT TTL/revocation, jam operasional, durasi maksimum, dan kebijakan media public/private tetap keputusan deployment; kontrak ini tidak mengarang nilainya. OpenAPI menetapkan validasi minimum yang dapat dibuktikan dari sumber dan default aman di atas.
