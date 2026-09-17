# Keputusan, Asumsi, Konflik, dan Pertanyaan Terbuka

## 1. Status sumber

Sumber normatif yang tersedia:

1. `Rev_Soal_UKK_2026-2027_Paket_B (1).md` (**Soal**), termasuk Bagian II, Bagian III, dan Lampiran A–E.
2. Instruksi pengguna: hanya membuat lima dokumen di `backend/docs`, bahasa Indonesia teknis, memasukkan strategi test, requirement/test ID, vertical slice, deployment EC2-RDS-S3, traceability 50 endpoint, checklist kategori, dan conflict log; tidak mengklaim implementasi/deployment.

Tidak ada keputusan stack, source code, schema aktual, konfigurasi cloud, atau hasil test yang dijadikan source truth pada pekerjaan dokumentasi ini. Karena itu semua rancangan teknis di bawah berstatus provisional sampai dikonfirmasi.

## 2. Decision register provisional

| ID | Keputusan provisional | Alasan | Dampak jika berubah | Perlu konfirmasi |
|---|---|---|---|---|
| DEC-001 | Perlakukan pekerjaan sebagai kategori Backend | path target `backend/docs`; Lampiran B mendefinisikan 50 endpoint | checklist/build/test berubah bila kategori lain | Ya |
| DEC-002 | Gunakan modular monolith + satu DB relasional | scope UKK tidak membenarkan microservice/queue/cache | struktur module/repository dan deployment | Ya, bersama pilihan stack/DBMS |
| DEC-003 | OpenAPI sebagai kontrak kanonis implementasi, dengan compatibility pada Soal | eksplisit, dapat lint/generate test/docs | perlu review jika contoh Soal ambigu | Ya |
| DEC-004 | Semua data bisnis membawa `maker_id` dan semua query di-scope tenant | Soal baris 221-225 mewajibkan isolasi | schema, index, auth middleware | Tidak untuk prinsip; ya untuk detail |
| DEC-005 | Uang berupa integer IDR; harga/potongan disnapshot pada reservasi | Soal baris 233 dan entity 459-485 | kalkulasi/report/migration | Konfirmasi aturan pembulatan |
| DEC-006 | Gunakan interval waktu setengah-terbuka `[mulai, selesai)` dan DB-level concurrency control | memungkinkan booking berdampingan, mencegah race | availability/reservation constraints | Ya |
| DEC-007 | Status reservasi dikelola state machine, bukan bebas diubah | mencegah transisi ilegal | API-EP-024/043..045 | Ya |
| DEC-008 | Produksi menyimpan media di S3; lokal memakai storage adapter | kebutuhan desain EC2-RDS-S3 dan disk EC2 tidak durable | response URL, IAM, backup | Ya untuk public/private policy |
| DEC-009 | Collection memakai query opsional `page`/`limit` (default 1/20, max 100), body array source-compatible, header `X-Page`/`X-Per-Page`/`X-Total-Count`, dan sort deterministik | mencegah unbounded query tanpa mengubah shape body sumber | nilai batas dapat dituning setelah volume/SLA, dengan contract review | Tidak untuk shape; ya untuk tuning batas |
| DEC-010 | Deploy menggunakan immutable artifact dan migration expand/contract | rollback aman | CI/CD dan schema workflow | Ya |

## 3. Asumsi eksplisit

| ID | Asumsi | Risiko bila salah | Validasi yang diperlukan |
|---|---|---|---|
| ASM-001 | Hanya kategori Backend yang akan diserahkan | artefak kategori salah/kurang | konfirmasi peserta/penguji |
| ASM-002 | Satu App Maker dapat memiliki data member, owner, space, diskon, reservasi sendiri | tenant model salah | contoh multi-owner/multi-location |
| ASM-003 | Satu akun admin memiliki satu profil lokasi | tidak mendukung banyak cabang/admin | cardinality bisnis |
| ASM-004 | Tarif tidak negatif dan kapasitas > 0 | acceptance berbeda | aturan penguji |
| ASM-005 | Reservasi aktif terhadap konflik adalah status belum_dikonfirm/disetujui/aktif; dibatalkan/selesai tidak memblokir slot | availability salah | kebijakan final |
| ASM-006 | Zona waktu bisnis tunggal dan disimpan/diolah konsisten | boundary promo/report/check-in salah | nama zona waktu |
| ASM-007 | Upload satu file per request | parser/kontrak berbeda | konfirmasi API |
| ASM-008 | RDS dan S3 target produksi, bukan ketentuan Soal | overengineering/biaya | target deployment dan anggaran |
| ASM-009 | Root/health tidak memerlukan app key | sesuai ringkasan, tetapi global wording ambigu | kontrak final |
| ASM-010 | Tidak ada payment gateway; `total_bayar` adalah nilai reservasi | istilah realisasi pendapatan ambigu | definisi pembayaran/realisasi |

## 4. Conflict log terperinci

### CONFLICT-001 — Jumlah endpoint dan penomoran

- **Referensi sumber:** Soal ringkasan baris 151-217 menomori 1..50; nomor 1 adalah `/`, nomor 50 adalah `/api/upload/members`.
- **Konflik/ambiguity:** istilah “50 endpoint” jelas, tetapi beberapa pihak dapat menghitung method/path unik; `/api/admin/profile` GET/PUT adalah dua endpoint dan semua method memang harus dihitung terpisah.
- **Dampak:** traceability dan completeness dapat salah bila dikelompokkan hanya berdasarkan path.
- **Keputusan provisional:** pertahankan API-EP-001..050 satu per nomor/method seperti ringkasan.
- **Perlu konfirmasi:** Tidak, kecuali kontrak resmi baru diterbitkan.

### CONFLICT-002 — Header tenant “wajib setiap request” vs endpoint publik

- **Referensi sumber:** Soal baris 221-225 menyatakan `x-maker-key`/`x-app-key` wajib pada setiap request frontend; root/health dan maker register/login pada baris 495-541 tidak mencantumkannya, sementara katalog menyebut “tidak diperlukan / Header x-maker-key” (baris 609-619).
- **Konflik:** app key belum tersedia saat maker register; root/health semestinya dapat dipanggil tanpa tenant.
- **Dampak:** middleware global dapat memblokir bootstrap/health atau, sebaliknya, membocorkan data tenant pada endpoint katalog.
- **Keputusan provisional:** root, health, maker register/login bebas app key; endpoint data tenant wajib key; maker bearer dapat mengidentifikasi tenant pada endpoint maker yang secara eksplisit mengizinkannya.
- **Perlu konfirmasi:** Ya—buat matriks header per endpoint pada OpenAPI.

### CONFLICT-003 — Alias header `x-maker-key` dan `x-app-key`

- **Referensi sumber:** Soal baris 223 mengizinkan keduanya; contoh selanjutnya konsisten memakai `x-maker-key`.
- **Konflik:** dua header dapat diberikan dengan nilai berbeda.
- **Dampak:** tenant confusion/security bypass jika precedence diam-diam diterapkan.
- **Keputusan provisional:** dukung keduanya untuk kompatibilitas; jika keduanya hadir nilainya harus sama, selain itu 400; dokumentasi memprioritaskan `x-maker-key`.
- **Perlu konfirmasi:** Ya.

### CONFLICT-004 — `/api/maker/list` publik tetapi mengungkap app key dan PII

- **Referensi sumber:** ringkasan baris 161 dan detail baris 553-559 menyatakan publik untuk pengujian serta menampilkan nama, email, username, dan `app_key`.
- **Konflik:** app key adalah boundary tenant menurut baris 221-225; mempublikasikannya merusak isolasi.
- **Dampak:** siapa pun dapat mengakses/memanipulasi data tenant bila app key dipakai sebagai bukti akses.
- **Keputusan provisional:** lindungi dengan role guru/penguji dan redaksi app key/email; bila kontrak ujian mutlak menuntut publik, batasi pada environment ujian nonproduksi dan jangan gunakan app key sebagai satu-satunya otorisasi mutasi.
- **Perlu konfirmasi:** **Ya, blocker keamanan sebelum produksi.**

### CONFLICT-005 — Upload auth ringkasan vs detail

- **Referensi sumber:** ringkasan API-EP-048 menyebut User/Admin, EP-049 Admin, EP-050 User/Admin (baris 208, 216-217); detail EP-048..050 menyebut “Tidak diperlukan / Header x-maker-key” (baris 1071-1103).
- **Konflik:** siapa pun yang mengetahui app key dapat mengunggah object.
- **Dampak:** abuse biaya/storage, konten berbahaya, spoofing foto, tenant pollution.
- **Keputusan provisional:** wajib bearer; EP-049 admin, EP-050 member pemilik atau admin, EP-048 user terautentikasi; rate limit dan quota.
- **Perlu konfirmasi:** **Ya, high security/contract impact.**

### CONFLICT-006 — Penyimpanan lokal publik vs S3 production

- **Referensi sumber:** Soal baris 235-241 menetapkan folder backend dan URL `http://localhost:3000/uploads/...`; instruksi pengguna meminta desain EC2-RDS-S3.
- **Konflik:** localhost/disk EC2 tidak tepat untuk multi-instance dan production durability.
- **Dampak:** response URL dan strategi backup/deploy berbeda.
- **Keputusan provisional:** pertahankan pola path/filename secara kompatibel melalui storage abstraction; lokal boleh filesystem, production S3/CloudFront/presigned URL berdasarkan policy final.
- **Perlu konfirmasi:** Ya, terutama apakah object harus publik.

### CONFLICT-007 — Profil admin membutuhkan alamat/deskripsi tetapi DTO tidak menyediakannya

- **Referensi sumber:** kebutuhan Admin baris 118-119 meminta nama space, pemilik, alamat, telepon, deskripsi fasilitas; `RegisterAdminSpaceDto` baris 289-299 dan `UpdateCoworkingProfileDto` baris 341-350 hanya nama, pemilik, telepon.
- **Konflik:** API tidak dapat memenuhi seluruh fitur profil.
- **Dampak:** schema/DTO/OpenAPI dan UI tidak lengkap.
- **Keputusan provisional:** tambahkan `alamat` dan `deskripsi_fasilitas` sebagai field opsional backward-compatible, lalu tetapkan wajib/tidak setelah konfirmasi.
- **Perlu konfirmasi:** Ya.

### CONFLICT-008 — Foto pada registrasi member

- **Referensi sumber:** fitur Member baris 98 mewajibkan foto profil sebagai bagian daftar; DTO baris 285 menandai `foto` opsional dan upload terpisah EP-050.
- **Konflik:** registrasi multipart atau upload-before-register tidak didefinisikan.
- **Dampak:** alur UI/API dan orphan object.
- **Keputusan provisional:** `foto` opsional saat register sesuai DTO; upload setelah autentikasi, lalu update profil/admin; kewajiban bisnis dipenuhi sebelum profil dianggap lengkap.
- **Perlu konfirmasi:** Ya.

### CONFLICT-009 — `id_diskon` dan `kode_promo` bersamaan

- **Referensi sumber:** CreateReservasiDto baris 326-337 dan contoh request baris 697-705 menerima keduanya.
- **Konflik:** tidak ada precedence bila keduanya menunjuk promo berbeda.
- **Dampak:** salah diskon/financial integrity.
- **Keputusan provisional:** bila keduanya ada harus merujuk record sama; jika berbeda 400; server menghitung dari record DB.
- **Perlu konfirmasi:** Ya.

### CONFLICT-010 — Check promo disebut “hitung potongan” tanpa nominal transaksi

- **Referensi sumber:** ringkasan baris 170 menyebut hitung potongan; `CheckPromoDto` baris 316-323 hanya `nama_diskon`; response baris 675-681 hanya persen dan status.
- **Konflik:** nominal potongan tidak dapat dihitung tanpa harga/durasi.
- **Dampak:** ekspektasi response klien.
- **Keputusan provisional:** endpoint hanya memvalidasi dan mengembalikan persen; nominal dihitung pada reservasi oleh server.
- **Perlu konfirmasi:** Ya untuk wording/OpenAPI.

### CONFLICT-011 — State transition tidak ditentukan

- **Referensi sumber:** daftar status baris 106-107 dan 449-455; endpoint status/check-in/out baris 1011-1043.
- **Konflik:** `PATCH status` tampak dapat menerima semua enum tanpa aturan; cancel member tidak menyebut state yang diizinkan.
- **Dampak:** check-out sebelum check-in, reaktivasi selesai, atau cancel aktif.
- **Keputusan provisional:** state machine: belum_dikonfirm→disetujui/dibatalkan; disetujui→aktif/dibatalkan; aktif→selesai; selesai/dibatalkan terminal. Endpoint check-in/out menjadi cara normal menuju aktif/selesai.
- **Perlu konfirmasi:** Ya.

### CONFLICT-012 — Definisi overlap, jam operasional, lintas hari

- **Referensi sumber:** availability/reservasi baris 619-629 dan 697-713; format waktu baris 233; tidak ada jam buka atau max duration.
- **Konflik:** booking berdampingan/lintas tengah malam dan status yang memblokir tidak ditentukan.
- **Dampak:** double booking atau penolakan yang salah.
- **Keputusan provisional:** interval `[start,end)`, tidak lintas hari, hanya status non-cancel/non-finished yang memblokir; batas durasi dan jam operasi harus dikonfirmasi.
- **Perlu konfirmasi:** Ya.

### CONFLICT-013 — Zona waktu dan boundary promo/laporan

- **Referensi sumber:** tanggal dapat date-only atau UTC full ISO (baris 233); promo contoh `Z`; reservasi menggunakan waktu lokal tanpa offset; report per bulan.
- **Konflik:** tidak ada zona waktu bisnis.
- **Dampak:** promo aktif, histori bulanan, check-in/out dapat bergeser tanggal.
- **Keputusan provisional:** simpan timestamp UTC, interpretasikan tanggal/jam reservasi dalam satu business timezone yang dikonfigurasi; laporan memakai timezone bisnis.
- **Perlu konfirmasi:** Ya—nama IANA timezone.

### CONFLICT-014 — “Realisasi” pendapatan tanpa pembayaran

- **Referensi sumber:** kebutuhan hanya estimasi pendapatan (baris 130); API laporan menyebut estimasi dan realisasi (baris 1045-1069); tidak ada endpoint pembayaran.
- **Konflik:** status apa yang dianggap realisasi tidak ditentukan.
- **Dampak:** laporan finansial tidak dapat diverifikasi.
- **Keputusan provisional:** estimasi mencakup reservasi disetujui/aktif/selesai; realisasi hanya selesai—ini bukan bukti pembayaran dan label harus dijelaskan.
- **Perlu konfirmasi:** Ya.

### CONFLICT-015 — Collection tanpa pagination

- **Referensi sumber:** katalog/admin list/history/reservasi mengembalikan array dan filter (mis. baris 631-641, 803-811, 997-1009) tanpa `page`/`limit`.
- **Konflik:** kontrak contoh tidak menyediakan pagination, tetapi collection tak terbatas berisiko operasional.
- **Dampak:** perubahan response/query parameter dapat memengaruhi klien.
- **Keputusan final dokumentasi:** tambahkan query opsional `page`, `limit` dengan default 1/20 dan maksimum 100, sort deterministik; pertahankan body array sumber-compatible (`data.items` untuk history) dan kirim metadata melalui header wajib `X-Page`, `X-Per-Page`, `X-Total-Count`.
- **Perlu konfirmasi:** Tidak untuk shape; tuning angka tetap dinilai terhadap SLA/volume melalui `OQ-016`.

### CONFLICT-016 — Semantik DELETE terhadap histori

- **Referensi sumber:** CRUD delete member/space/diskon baris 859-867, 925-937, 985-993; reservation memiliki FK historis dan snapshot.
- **Konflik:** hard delete dapat merusak reservasi/e-ticket/laporan.
- **Dampak:** kehilangan histori dan FK failure.
- **Keputusan provisional:** soft-delete atau `RESTRICT` bila masih direferensikan; histori mempertahankan snapshot. Pilih satu perilaku konsisten dalam OpenAPI.
- **Perlu konfirmasi:** Ya.

### CONFLICT-017 — QR membocorkan app key

- **Referensi sumber:** contoh `qr_code_payload` baris 743-749 memuat `mk_...`.
- **Konflik:** app key berfungsi sebagai tenant credential/header.
- **Dampak:** siapa pun yang memotret tiket memperoleh app key.
- **Keputusan provisional:** QR berisi opaque random/signed verification token berumur/berscope, tidak memuat app key, JWT, atau ID mudah ditebak.
- **Perlu konfirmasi:** **Ya, high security/contract impact.**

### CONFLICT-018 — Password minimal 6 vs keamanan produksi

- **Referensi sumber:** DTO baris 256, 280, 296 menyebut minimal 6.
- **Konflik:** minimum 6 lemah untuk aplikasi publik; contoh password bukan secret aktual.
- **Dampak:** account takeover risk dan compatibility test.
- **Keputusan provisional:** kompatibilitas ujian minimal 6; rekomendasi produksi minimum lebih kuat/passphrase, rate limit, breached-password control bila tersedia; jangan memaksa aturan yang belum disepakati pada kontrak ujian.
- **Perlu konfirmasi:** Ya.

### CONFLICT-019 — Health hanya status proses, deployment butuh readiness

- **Referensi sumber:** `/health` response hanya status/timestamp (baris 499-503); instruksi pengguna meminta deployment andal.
- **Konflik:** ALB tidak boleh mengirim traffic ke instance tanpa DB, sementara liveness tidak seharusnya gagal hanya karena dependency sesaat.
- **Dampak:** restart loop atau traffic ke instance tidak siap.
- **Keputusan provisional:** pertahankan `/health` kompatibel sebagai liveness dan tambah readiness internal/path baru, atau perluas check tanpa membocorkan detail setelah persetujuan kontrak.
- **Perlu konfirmasi:** Ya.

### CONFLICT-020 — “Real-time” tanpa protokol real-time

- **Referensi sumber:** pengantar API baris 147 menyebut transaksi reservasi real-time; tidak ada WebSocket/SSE endpoint dalam 50 endpoint.
- **Konflik:** istilah dapat berarti konsistensi langsung, bukan push update.
- **Dampak:** risiko menambah infrastruktur/protokol yang tidak dibutuhkan.
- **Keputusan provisional:** interpretasikan sebagai validasi availability dan commit sinkron/atomik melalui REST; tidak menambah WebSocket.
- **Perlu konfirmasi:** Tidak, kecuali penguji meminta push notification.

### CONFLICT-021 — Provenance ERD

- **Referensi sumber:** pengguna memberikan transkripsi ERD secara langsung dalam percakapan; transkripsi tersebut adalah sumber otoritatif baseline. Berkas gambar ERD asli tidak tersedia pada pekerjaan ini, sedangkan OCR/ekstraksi gambar pada Soal baris 134-141 korup/tidak dapat diandalkan.
- **Konflik:** hasil OCR tidak boleh dipakai untuk mengoreksi transkripsi pengguna, tetapi detail visual di luar transkripsi tidak dapat diverifikasi.
- **Dampak:** baseline dapat didokumentasikan konsisten; kecocokan pixel/cardinality yang tidak ditranskripsikan tetap tidak dapat dibuktikan tanpa gambar asli.
- **Keputusan:** pertahankan tabel/field/relasi dari transkripsi pengguna sebagai baseline otoritatif; proposal tambahan ditandai eksplisit dan diturunkan dari fitur, DTO, invariant, tenant isolation, serta 50 operasi.
- **Perlu konfirmasi:** Hanya bila evaluator mensyaratkan pemeriksaan terhadap gambar asli.

### CONFLICT-022 — Framework dan DBMS belum dipilih

- **Referensi sumber:** Lampiran B baris 1147-1151 membolehkan Node.js/Express, Laravel, atau NestJS; tidak menetapkan DBMS.
- **Konflik:** migration, overlap constraint, command lokal, dan artefak deployment bergantung pilihan.
- **Dampak:** rencana belum dapat menjadi command executable.
- **Keputusan provisional:** tetap teknologi-netral; pilih stack sebelum VS-00.
- **Perlu konfirmasi:** Ya.

## 5. Pertanyaan terbuka prioritas

### Wajib sebelum implementasi

1. `OQ-001`: Kategori final Backend atau kategori lain?
2. `OQ-002`: Framework/runtime, package manager, ORM, DBMS, dan versi yang dipilih?
3. `OQ-003`: Matriks endpoint mana yang wajib app key, JWT, dan role apa?
4. `OQ-004`: Apakah kontrak harus identik byte-for-byte dengan contoh atau boleh extension backward-compatible (pagination, readiness, field profil)?
5. `OQ-005`: Cardinality App Maker→owner/admin→lokasi: satu atau banyak?
6. `OQ-006`: State machine, status pemblokir availability, jam operasional, max duration, cancel policy?
7. `OQ-007`: Business timezone dan aturan pembulatan diskon IDR?
8. `OQ-008`: Semantik delete terhadap data dengan histori?

### Wajib sebelum deployment produksi

9. `OQ-SEC-001`: Bagaimana autentikasi Guru/Penguji untuk `/api/maker/list`, dan field apa yang boleh terlihat?
10. `OQ-SEC-002`: Apakah endpoint upload wajib bearer dan apakah media public, private, atau presigned?
11. `OQ-009`: JWT TTL, refresh/revocation, signing algorithm, rotasi key?
12. `OQ-010`: Region AWS, VPC/domain/TLS, target availability, capacity, dan anggaran?
13. `OQ-011`: Tetapkan RTO, RPO, backup retention, dan legal/PII retention. **Owner:** Product Owner (toleransi kehilangan/downtime) + Operations Owner (feasibility/runbook), dengan Security/Privacy reviewer untuk retention. **Closure criteria:** angka dan scope layanan disetujui tertulis; konfigurasi backup/PITR/S3 lifecycle memenuhi target; alarm/runbook/escalation owner tercatat; `TST-DR-001` mengukur hasil aktual ≤ target; gap memiliki mitigasi dan approval risiko.
14. `OQ-012`: SLA/latency/error-rate, monitoring destination, on-call/incident owner?
15. `OQ-013`: Apakah extension endpoint QR verify khusus diperlukan? Jalur mandatory tetap inspect e-ticket API-EP-022 lalu check-in API-EP-044; extension tidak boleh menggantikan authorization/state check EP-044 atau mengubah hitungan 50 operasi.

### Dapat ditunda tetapi harus tercatat

16. `OQ-014`: Apakah audit trail perubahan status/admin diwajibkan evaluator?
17. `OQ-015`: Apakah malware scanning media diperlukan pada skala/risiko target?
18. `OQ-016`: Validasi/tuning default 20 dan maksimum 100 berdasarkan SLA/volume, serta tetapkan retention object yatim; shape body/header pagination tidak dibuka kembali tanpa contract change review.
19. `OQ-017`: Definisi tepat estimasi vs realisasi pendapatan tanpa payment gateway?

## 6. Kriteria penutupan keputusan

Sebuah pertanyaan dianggap tertutup hanya bila jawaban dicatat dalam ADR/OpenAPI/schema/rencana test yang relevan, reviewer/owner menyetujui, dan traceability diperbarui. Keputusan keamanan CONFLICT-004, CONFLICT-005, dan CONFLICT-017 harus selesai sebelum klaim siap produksi. Sampai saat itu dokumen ini tidak mendukung klaim implementasi atau deployment siap.
