# Project Brief — Smart Space Booking Frontend

## 1. Ringkasan

Smart Space Booking adalah aplikasi web untuk menemukan dan mereservasi coworking space/workstation, serta mengelola operasional lokasi. Frontend mengonsumsi API panitia dan memisahkan pengalaman Publik, Member, Admin Space, dan App Maker.

Dokumen ini adalah brief perencanaan. Belum ada aplikasi yang diimplementasikan. Sumber normatif: [`../../Rev_Soal_UKK_2026-2027_Paket_B (1).md`](../../Rev_Soal_UKK_2026-2027_Paket_B%20%281%29.md).

## 2. Masalah yang diselesaikan

### Pengunjung/Member

- Sulit mengetahui jenis, fasilitas, kapasitas, harga, dan ketersediaan space tanpa menghubungi pengelola.
- Pemesanan, promo, dan status reservasi perlu satu alur yang transparan.
- Bukti reservasi perlu dapat dibuka dan dicetak, serta membawa QR untuk proses check-in di lokasi.

### Admin Pengelola Space

- Profil lokasi, member, space, promo, dan reservasi perlu dikelola terpusat.
- Konfirmasi, check-in, dan check-out memerlukan status yang terlihat dan tidak ambigu.
- Rekap bulanan dan distribusi pendapatan per jenis space perlu mudah dibaca.

### App Maker

- Data peserta frontend harus terisolasi melalui `app_key`.
- Maker memerlukan setup awal, profil, dan statistik tenant tanpa mencampur sesi Maker dengan sesi pengguna aplikasi.

## 3. Aktor dan tujuan

| Aktor | Tujuan utama | Batas akses UI |
|---|---|---|
| Publik/Pengunjung | menjelajah katalog, detail, availability, promo; register/login | tidak dapat membuat reservasi sebelum login sebagai Member |
| Member (`member`) | membuat dan mengelola reservasi milik sendiri, histori, e-ticket | tidak dapat membuka panel Admin atau data Member lain |
| Admin Space (`admin_space`) | mengelola lokasi, member, space, promo, reservasi, laporan | tidak memakai aksi khusus Member kecuali endpoint shared detail/e-ticket sesuai server |
| App Maker | setup tenant, melihat `app_key`, profil, statistik | sesi terpisah; tidak otomatis menjadi Member/Admin |
| Guru/Penguji | mengevaluasi hasil | `/api/maker/list` bukan bagian UI umum; panel evaluator berada di luar scope |

## 4. Sasaran produk

1. Member dapat menyelesaikan alur katalog → cek availability → reservasi → status → e-ticket tanpa kehilangan konteks pada mobile, tablet, maupun desktop.
2. Admin dapat menjalankan workflow operasional dengan status, filter, dan feedback yang jelas.
3. Semua form dan aksi terhubung ke kontrak API tanpa mengubah identifier/enum.
4. Sesi, role, tenant, dan cache terisolasi pada client; server tetap menjadi enforcement authority.
5. Error dan hasil mutasi tidak ambigu: UI tidak menampilkan sukses sebelum response tervalidasi.
6. Seluruh alur kritis dapat diuji dengan acceptance criteria terukur.

## 5. Ukuran keberhasilan yang diusulkan

Angka berikut adalah target desain, belum hasil pengukuran:

- 100% route kritis memiliki keadaan loading, empty, error, success, forbidden, dan session-expired sesuai relevansi.
- 100% input interaktif dapat digunakan dengan keyboard dan memiliki accessible name.
- Tidak ada scroll horizontal pada viewport 320, 768, 1024, dan 1440 CSS px, kecuali tabel admin yang sengaja memakai region scroll berlabel.
- Layout tetap operabel pada zoom browser 200%.
- Tombol mutasi kritis menolak klik kedua selama request aktif.
- E-ticket tercetak tanpa navigasi/form/action controls dan QR tetap terbaca pada print A4.
- Semua enum kontrak dipetakan: `desk`, `meeting_room`, `private_office`; `belum_dikonfirm`, `disetujui`, `aktif`, `selesai`, `dibatalkan`; role `member`, `admin_space`.
- Setiap route privat memiliki uji role benar, unauthenticated, wrong-role, dan expired-session.

Target performa numerik (LCP/INP/bundle) baru boleh ditetapkan setelah aplikasi dan lingkungan uji tersedia.

## 6. Scope rilis awal

### Publik

- Landing/katalog space dan promo aktif.
- Filter `tipe`, pencarian `search`, detail space.
- Availability berdasarkan `id_space`, `tanggal`, `jam_mulai`, `durasi_jam`.
- Login pengguna, register Member, register Admin Space.
- Setup App Maker register/login.

### Member

- Dashboard/ringkasan reservasi.
- Form reservasi dengan pengecekan ulang availability dan promo.
- Daftar/status dan detail reservasi.
- Histori `month`/`year`.
- Pembatalan dengan konfirmasi dan rekonsiliasi setelah timeout.
- E-ticket, QR dari `qr_code_payload`, dan print.

### Admin Space

- Dashboard dan profil lokasi.
- CRUD Member, Space, Diskon.
- Upload foto sebagai langkah terpisah dari penyimpanan entity.
- Daftar/filter/detail reservasi.
- Konfirmasi/status, check-in, check-out.
- Laporan bulanan dan rincian per `tipe`.

### App Maker

- Register, login, profil/current key, statistik.
- Copy `app_key` dengan peringatan agar tidak membagikannya.
- Tidak menyediakan UI `/api/maker/list`.

## 7. Di luar scope

- Payment gateway atau status pembayaran.
- Chat, notifikasi push, WebSocket/SSE, maps, kalender eksternal.
- Verifikasi QR oleh scanner/endpoint khusus karena kontraknya tidak tersedia.
- Mengubah database/backend atau menjamin authorization dari guard frontend.
- Mengarang pagination, refresh-token, delete media, alamat/deskripsi profil admin, atau state transition yang tidak ada pada kontrak.
- Panel Guru/Penguji.

## 8. Constraint

- API base URL dan dokumentasi aktual diberikan panitia.
- Semua request tenant menggunakan `x-maker-key`, kecuali bootstrap Maker/root/health yang masih ambigu.
- Endpoint privat memakai Bearer JWT.
- Collection API belum memiliki pagination.
- URL media produksi dan aturan CORS belum dikonfirmasi.
- Format tanggal adalah `YYYY-MM-DD`, jam `HH:mm`, uang integer IDR.
- Framework diizinkan sumber: NextJS/ReactJS/VueJS. Desain memilih Next.js App Router + TypeScript secara provisional.

## 9. Risiko utama

| Risiko | Dampak | Respons desain |
|---|---|---|
| Availability berubah setelah dicek | double booking/false success | recheck sebelum submit; tangani 400; tanpa optimistic success |
| Mutasi timeout | hasil sebenarnya tidak diketahui | jangan retry otomatis; refetch dan rekonsiliasi |
| Sesi/tenant tertukar | kebocoran data UI/cache | pisahkan sesi Maker/User; key cache memuat tenant+subject; clear saat logout/switch |
| Kontrak upload ambigu | abuse/orphan upload | guard UX, Bearer bila tersedia, state uploaded ≠ saved; backend tetap harus diperbaiki |
| List tidak dibatasi | UX/performa buruk | filter dan virtualisasi hanya mitigasi; backend perlu pagination |
| QR memuat data sensitif | kebocoran tenant key | render payload sebagai data saja; minta backend token opaque |
| SSR dianggap kategori Fullstack | artefak dinilai salah | dokumentasikan bahwa API tetap eksternal; konfirmasi evaluator sebelum final |

## 10. Dependensi dan referensi

- [PRD frontend](./PRD.md)
- [TRD frontend](./TRD.md)
- [Route dan alur](./routes-and-user-flows.md)
- [Traceability frontend](./requirements-traceability.md)
- [Keputusan terbuka frontend](./decisions-and-open-questions.md)
- [Traceability backend](../../backend/docs/requirements-traceability.md)
- [Keputusan terbuka backend](../../backend/docs/decisions-and-open-questions.md)

## 11. Exit criteria brief

Brief dapat disetujui untuk implementasi setelah kategori Frontend, App Maker provisioning, strategi sesi, API/OpenAPI aktual, CORS, upload auth, media URL, timezone, dan state transition dikonfirmasi. Persetujuan brief tidak berarti aplikasi siap dirilis.