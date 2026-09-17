# Product Requirements Document (PRD)

## 1. Status

PRD ini menerjemahkan requirement UKK Paket B menjadi kebutuhan frontend yang dapat diuji. Ini bukan klaim fitur telah diimplementasikan. Sumber utama: [`../../Rev_Soal_UKK_2026-2027_Paket_B (1).md`](../../Rev_Soal_UKK_2026-2027_Paket_B%20%281%29.md).

Kategori target: **Frontend (Web)** yang mengonsumsi API panitia. Next.js App Router + TypeScript adalah keputusan desain provisional. Ambiguitas SSR dibahas di [TRD](./TRD.md).

## 2. Persona

- **Pengunjung:** membandingkan space/promo sebelum membuat akun.
- **Member (`member`):** freelancer, mahasiswa, startup, atau profesional yang memesan space.
- **Admin Space (`admin_space`):** pengelola coworking yang mengelola data dan operasi kunjungan.
- **App Maker:** peserta frontend yang mendapatkan `app_key` untuk tenant data ujian.

## 3. Bahasa kontrak yang wajib dipertahankan

- Role: `member`, `admin_space`.
- Tipe: `desk`, `meeting_room`, `private_office`.
- Status: `belum_dikonfirm`, `disetujui`, `aktif`, `selesai`, `dibatalkan`.
- Header tenant kanonik: `x-maker-key`.
- Date-only: `YYYY-MM-DD`; jam: `HH:mm`; uang: integer IDR.

Label UI boleh “Personal Desk”, “Meeting Room”, “Private Office”, dan label status Bahasa Indonesia, tetapi payload tidak boleh mengganti nilai enum.

## 4. Kebutuhan halaman dan komponen

### 4.1 Publik

| ID | Halaman | Komponen/kebutuhan |
|---|---|---|
| PUB-01 | Landing/katalog | header, hero, search, filter tipe, space cards, promo strip, empty/error/loading |
| PUB-02 | Daftar space | filter `tipe`, `search` di URL; foto, nama, kapasitas, deskripsi/fasilitas, harga/jam |
| PUB-03 | Detail space | image fallback, owner, tipe, kapasitas, fasilitas, harga, availability form |
| PUB-04 | Promo | active list dan detail periode/persen |
| AUTH-01 | Login | username/password, role-based redirect, error aman, session-expired return |
| AUTH-02 | Register Member | `username`, `password`, `nama_member`, `instansi`, `alamat`, `telp`, `foto?` |
| AUTH-03 | Register Admin | `username`, `password`, `nama_coworking`, `nama_pemilik`, `telp` |

### 4.2 Member

| ID | Halaman | Komponen/kebutuhan |
|---|---|---|
| MEM-01 | Dashboard | reservasi terkini dan CTA cari space |
| MEM-02 | Reservasi baru | jadwal, durasi, availability, promo, estimasi, konfirmasi, result |
| MEM-03 | Reservasi saya | list semua booking dengan lima status |
| MEM-04 | Detail reservasi | kode, space, jadwal, total, status, cancel bila server mengizinkan |
| MEM-05 | Histori | filter `month` 1–12 dan `year`, summary total dan empty state |
| MEM-06 | E-ticket | detail nota, `kode_booking`, QR, print A4 |
| MEM-07 | Profil | profil login yang tersedia dari `/api/auth/profile`; tidak mengarang endpoint update |

### 4.3 Admin Space

| ID | Halaman | Komponen/kebutuhan |
|---|---|---|
| ADM-01 | Dashboard | KPI ringkas, antrean reservasi, shortcut; tidak duplicate-fetch tanpa kebutuhan |
| ADM-02 | Profil lokasi | read/update `nama_coworking`, `nama_pemilik`, `telp`; alamat/deskripsi terblokir kontrak |
| ADM-03 | Member | list/search/detail/create/edit/delete dan foto |
| ADM-04 | Space | list/detail/create/edit/delete `nama_space`, `harga_per_jam`, `tipe`, `kapasitas`, `deskripsi`, `foto?` |
| ADM-05 | Diskon | list/detail/create/edit/delete nama, persen, awal, akhir |
| ADM-06 | Reservasi | filter `month`, `year`, `status`, `id_space`, `tanggal`; detail dan e-ticket |
| ADM-07 | Operasional | update status, check-in, check-out dengan confirmation dan stale refetch |
| ADM-08 | Laporan | filter bulan/tahun; KPI pendapatan dan rincian per tipe |

### 4.4 App Maker

| ID | Halaman | Komponen/kebutuhan |
|---|---|---|
| MKR-01 | Register | `name`, `username`, `email`, `password`; success menampilkan `app_key` |
| MKR-02 | Login | `usernameOrEmail`, `password` |
| MKR-03 | Profile | identity, `app_key`, copy action, redaction opsional saat idle |
| MKR-04 | Stats | `total_members`, `total_spaces`, `total_diskon`, `total_reservasi`, `total_pendapatan` |

`/api/maker/list` tidak memiliki halaman umum karena contoh response mengekspos `app_key` semua maker.

## 5. Functional requirements

### 5.1 Tenant dan auth

- FR-AUTH-01: seluruh request domain tenant membawa `x-maker-key` setelah tersedia.
- FR-AUTH-02: endpoint privat membawa Bearer sesuai sesi User atau Maker yang benar.
- FR-AUTH-03: login User mengarahkan `member` ke Member area dan `admin_space` ke Admin area.
- FR-AUTH-04: route salah-role menampilkan forbidden dan tidak memanggil data privat role tersebut.
- FR-AUTH-05: 401 membersihkan hanya sesi/cache terkait; 403 tidak otomatis logout.
- FR-AUTH-06: JWT tidak masuk URL, log, analytics, atau Web Storage.

### 5.2 Katalog dan availability

- FR-SPC-01: katalog menampilkan foto/fallback, `nama_space`, `tipe`, `kapasitas`, `deskripsi`, `harga_per_jam`.
- FR-SPC-02: filter `tipe` dan `search` tersimpan di URL.
- FR-SPC-03: availability hanya dipanggil ketika semua parameter valid.
- FR-SPC-04: hasil availability menjadi stale saat input berubah dan diperiksa lagi sebelum submit.

### 5.3 Reservasi dan promo

- FR-RES-01: hanya Member dapat membuat reservasi.
- FR-RES-02: payload memakai `id_space`, `tanggal_reservasi`, `jam_mulai`, `durasi_jam`, dan maksimal satu dari `id_diskon`/`kode_promo` sampai backend menetapkan precedence.
- FR-RES-03: UI memakai `kode_booking`, total, potongan, dan status dari response server.
- FR-RES-04: mutasi reservasi tidak retry otomatis dan klik ganda diblokir.
- FR-RES-05: timeout menampilkan unknown outcome dan memicu rekonsiliasi.
- FR-RES-06: Member hanya menampilkan reservasi dari endpoint “my”; object ownership tetap server-side.

### 5.4 Status dan operasi

- FR-OPS-01: UI memahami kelima enum status tanpa menganggap semua transisi legal.
- FR-OPS-02: check-in dan check-out menggunakan endpoint khusus.
- FR-OPS-03: detail direfetch sebelum aksi operasional.
- FR-OPS-04: tidak ada optimistic update untuk cancel/status/check-in/out.
- FR-OPS-05: mutasi paralel pada ID yang sama ditolak di UI.

### 5.5 CRUD dan upload

- FR-CRUD-01: form create/update memvalidasi field required/optional persis kontrak.
- FR-CRUD-02: delete membutuhkan dialog bernama resource dan tidak menghilangkan item sebelum sukses.
- FR-UPL-01: state upload dan save entity dipisah.
- FR-UPL-02: endpoint general menerima WebP; spaces/members tidak.
- FR-UPL-03: URL media invalid/broken memakai fallback.

### 5.6 E-ticket

- FR-TKT-01: Member pemilik dan Admin berwenang dapat membuka ticket sesuai response API.
- FR-TKT-02: QR mengenkode `qr_code_payload` sebagai data.
- FR-TKT-03: print A4 berisi identitas, jadwal, pembayaran, status, kode, dan QR tanpa navigation/action controls.
- FR-TKT-04: ticket bukan bukti pembayaran karena tidak ada payment endpoint.

## 6. State requirements per halaman

Setiap halaman/data surface harus mendefinisikan:

1. loading awal;
2. ready;
3. empty;
4. background refresh;
5. validation error;
6. API/network/contract error;
7. submitting/disabled;
8. success;
9. forbidden;
10. session-expired;
11. unknown mutation outcome untuk mutasi non-idempotent.

State yang tidak relevan dapat tidak dirender, tetapi keputusan harus eksplisit dalam test.

## 7. Nonfunctional requirements

### Responsive

- Mobile 320/375 px, tablet 768 px, desktop 1024/1440 px.
- Tidak ada body horizontal overflow.
- Admin table boleh scroll dalam region berlabel atau berubah card.
- Navigasi dan tindakan tetap dapat digunakan pada zoom 200%.

### Accessibility

- WCAG 2.2 AA baseline.
- Keyboard complete, focus visible, skip link, semantic landmarks/headings.
- Label/error terasosiasi; dynamic status diumumkan secukupnya.
- Warna bukan satu-satunya pembeda.
- Target sentuh minimum 44×44 px.
- Reduced motion dihormati.

### Reliability/security

- Runtime response validation.
- Request dapat dibatalkan untuk pencarian/filter superseded.
- Tidak render HTML dari API.
- Redirect internal allowlist.
- Cache terisolasi tenant+subject.
- Error/log tidak mengandung token, password, key, PII lengkap, atau QR payload.

### Performance/scalability

- Server Component menjadi default untuk mengurangi JS.
- Images responsive dan lazy kecuali hero/LCP.
- Collection API tanpa pagination merupakan risiko; virtualisasi hanya mitigasi UI.
- Tidak menambah cache/infrastruktur tanpa metrik.

## 8. Acceptance criteria Given/When/Then

### App Maker dan auth

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | Maker baru mengisi empat field valid | register memberi 201 | `app_key` dan identitas tampil, token/key tidak masuk URL/log |
| AC-02 | username/email Maker duplikat | API memberi 400 | form-level error tampil, password kosong, tidak ada success state |
| AC-03 | User login sebagai `member` | profile tervalidasi | diarahkan ke return path Member atau `/member`, bukan Admin |
| AC-04 | Member membuka route Admin | guard mengevaluasi role | forbidden tampil dan request admin tidak dilakukan |
| AC-05 | token privat kedaluwarsa | API memberi 401 | private cache subject dihapus dan session-expired tampil tanpa redirect loop |

### Katalog/reservasi

| ID | Given | When | Then |
|---|---|---|---|
| AC-06 | katalog sukses berisi ketiga tipe | page render | enum dipetakan ke label benar, harga IDR dan kapasitas terlihat |
| AC-07 | katalog sukses kosong | loading selesai | empty state dan reset-filter CTA tampil |
| AC-08 | parameter availability valid | server memberi available true | jadwal, jam selesai, estimasi, dan waktu cek tampil |
| AC-09 | input berubah setelah AC-08 | user mengubah durasi | hasil lama invalid dan submit tidak aktif sampai recheck |
| AC-10 | reservasi pending | user klik submit dua kali | satu request dibuat dan control `aria-busy=true` |
| AC-11 | slot diambil setelah availability | POST memberi 400 | tidak ada success; conflict tampil dekat jadwal dan recheck tersedia |
| AC-12 | POST timeout | response tidak diketahui | UI menampilkan unknown outcome, refetch list, tanpa retry otomatis |
| AC-13 | promo invalid | check memberi 400 | promo tidak diterapkan; user dapat lanjut tanpa promo |

### Member ticket/history

| ID | Given | When | Then |
|---|---|---|---|
| AC-14 | history `month=13` | URL dinormalisasi | request invalid tidak dikirim dan filter kembali ke default valid |
| AC-15 | e-ticket valid | page render | nomor tiket, kode booking, jadwal, pembayaran, status, dan QR tersedia |
| AC-16 | ticket dicetak | print preview | navigation/action hilang; data wajib dan QR tetap terlihat pada A4 |
| AC-17 | ticket resource forbidden | API memberi 403 | tidak ada detail ticket bocor dan forbidden tampil |

### Admin

| ID | Given | When | Then |
|---|---|---|---|
| AC-18 | upload foto space sukses, save gagal | entity mutation error | UI menyatakan belum tersimpan/terasosiasi dan mempertahankan retry manual |
| AC-19 | delete resource masih direferensikan | API menolak | item tetap ada dan pesan server aman tampil |
| AC-20 | status detail stale | Admin check-in dan server menolak | status direfetch; tidak ada optimistic `aktif` |
| AC-21 | check-in sedang pending | aksi sama dipicu kembali | request kedua untuk reservation ID yang sama ditolak |
| AC-22 | laporan bulan kosong | response sukses nol/koleksi kosong | empty report tampil, bukan error |
| AC-23 | monthly report tersedia | page render | total dan rincian per `tipe` memakai angka server; alias tidak didobel fetch |

### Responsive/accessibility/states

| ID | Given | When | Then |
|---|---|---|---|
| AC-24 | viewport 320, 768, 1024, 1440 | alur kritis dijalankan | tidak ada kontrol terpotong/body overflow; informasi tetap lengkap |
| AC-25 | pengguna keyboard | membuka/menutup dialog delete | fokus terjebak saat dialog dan kembali ke trigger setelah tutup |
| AC-26 | beberapa field invalid | form disubmit | error summary diumumkan dan fokus berpindah ke field invalid pertama |
| AC-27 | API GET gagal lalu pulih | retry dipilih | loading→success berjalan tanpa duplikasi request tak terkendali |
| AC-28 | sesi valid menerima 403 | error diproses | forbidden berbeda dari session-expired dan sesi tidak dihapus |

## 9. Alternate/failure matrix

| Kondisi | Perilaku produk |
|---|---|
| API offline | shell tetap tampil; GET retry manual; mutasi tidak auto-resend |
| malformed response | contract error; tidak render data parsial |
| broken image/mixed content | fallback visual + alt yang tepat |
| list sangat besar | filter/virtualized rendering; catat risiko backend tanpa pagination |
| search response terlambat | request lama dibatalkan/tidak boleh menimpa hasil terbaru |
| upload file invalid | ditolak sebelum upload dengan alasan format; size menunggu batas resmi |
| role tidak dikenal | tidak akses route privat; logout/forbidden aman |
| resource 404 setelah form edit terbuka | hentikan edit, not-found, jangan submit stale |
| printer dibatalkan | bukan error aplikasi; ticket tetap terbuka |
| QR render gagal | kode/nomor tiket tetap tersedia; jangan mengklaim QR berhasil |

## 10. Dependency dan konflik

PRD bergantung pada API 50 endpoint dan keputusan backend. Konflik utama: field profil admin kurang, upload auth ambigu, URL media localhost, collection tanpa pagination, QR memuat key, promo ganda, timezone/state transition/idempotency tidak ditentukan. Lihat [keputusan frontend](./decisions-and-open-questions.md) dan [keputusan backend](../../backend/docs/decisions-and-open-questions.md).

## 11. Definition of Done produk

Fitur hanya selesai bila UI, API integration, validation, auth/role UX, seluruh state, responsive, accessibility, cache invalidation, failure path, dan test terkait selesai; production build lulus; tidak ada Blocker/High; serta hasil diverifikasi pada tenant staging. Dokumen atau mockup saja tidak memenuhi DoD implementasi.