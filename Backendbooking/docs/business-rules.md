# Business Rules

## 1. Status dan terminologi

Aturan berikut adalah spesifikasi domain, bukan bukti implementasi.

- **REQUIRED:** field/enum dari soal dipertahankan.
- **DESIGN DECISION:** aturan tambahan yang diperlukan agar reservasi deterministik dan aman.
- **ASSUMPTION:** default sementara karena sumber tidak lengkap.
- **OPEN QUESTION:** harus diputuskan sebelum OpenAPI/schema final.

Status: `belum_dikonfirm`, `disetujui`, `aktif`, `selesai`, `dibatalkan`. Tipe space: `desk`, `meeting_room`, `private_office`.

## 2. Lima belas topik aturan reservasi

### BR-RSV-01 — Identitas dan ownership

- **REQUIRED:** hanya member terautentikasi dapat membuat reservasi.
- `id_member` berasal dari token/profile, bukan body.
- `id_owner` berasal dari `space.id_owner`, bukan pilihan client.
- Admin hanya dapat mengoperasikan reservasi dengan `reservasi.id_owner` miliknya.
- Semua relasi harus berada dalam tenant yang sama bila tenant mode aktif.

### BR-RSV-02 — Input tanggal dan waktu

- `tanggal_reservasi` berformat kalender `YYYY-MM-DD`; `jam_mulai` `HH:mm`; `durasi_jam` integer minimal 1.
- `jam_selesai` dihitung server: `start + durasi_jam`.
- **ASSUMPTION:** reservasi tidak boleh melintasi tengah malam dan tanggal lampau ditolak.
- **OPEN QUESTION:** jam operasional, durasi maksimum, lead time, dan business timezone.

### BR-RSV-03 — Interval dan overlap

Gunakan interval setengah-terbuka `[start, end)`. Dua interval overlap bila:

```text
requested_start < existing_end
AND existing_start < requested_end
```

Akibatnya `[09:00,10:00)` dan `[10:00,11:00)` tidak overlap. Overlap parsial, penuh, atau interval yang melingkupi booking lain ditolak.

### BR-RSV-04 — Status pemblokir availability

- **ASSUMPTION:** `belum_dikonfirm`, `disetujui`, dan `aktif` memblokir slot.
- `dibatalkan` dan `selesai` tidak memblokir booking baru.
- Perubahan state harus segera memengaruhi query availability dalam transaksi yang konsisten.
- **OPEN QUESTION:** apakah booking belum dikonfirmasi memiliki expiry/hold timeout.

### BR-RSV-05 — Pemeriksaan availability

Endpoint availability bersifat advisory. Hasil `available=true` tidak memesan atau mengunci slot. POST reservasi wajib mengulang seluruh pemeriksaan pada transaksi write. Estimasi harga dari endpoint ini bukan snapshot kontraktual.

### BR-RSV-06 — Locking dan concurrency

- **DESIGN DECISION:** invariant tidak-overlap ditegakkan database (PostgreSQL exclusion constraint pada space + time range untuk status pemblokir) atau locking ekuivalen yang terbukti.
- Transaksi booking memasukkan `reservasi` dan tepat satu `detail_reservasi` secara atomik.
- Dua request konkuren untuk slot sama: tepat satu commit; lainnya 409.
- Jangan memakai cache atau check-then-insert tanpa lock/constraint.

### BR-RSV-07 — Satu booking, satu detail

- Satu `reservasi` wajib memiliki tepat satu `detail_reservasi`.
- `detail_reservasi.id_reservasi` unique dan non-null.
- Satu detail menunjuk tepat satu space; tidak ada multi-space cart pada scope ini.
- Insert reservasi tanpa detail atau detail ganda harus gagal/rollback.

### BR-RSV-08 — Harga dasar dan snapshot

Pada saat booking:

```text
harga_per_jam_snapshot = space.harga_per_jam
total_harga_awal = harga_per_jam_snapshot × durasi_jam
```

Semua nilai integer IDR dan nonnegatif. Perubahan harga space setelah commit tidak mengubah reservasi lama.

Baseline `detail_reservasi.total_harga` dipertahankan sebagai total bersih. Proposal menyimpan snapshot tambahan agar nota/laporan dapat direkonsiliasi.

### BR-RSV-09 — Promo dan validitas

- Promo opsional; hanya satu promo per reservasi.
- Persentase 1..100.
- Promo valid bila kode/id ada, belum diarsipkan, berada pada scope owner/tenant, dan waktu referensi berada inklusif antara `tanggal_awal` dan `tanggal_akhir` menurut business timezone.
- Jika `id_diskon` dan `kode_promo` dikirim, keduanya harus menunjuk record sama; bila tidak, 400.
- Endpoint check promo hanya memvalidasi persen/periode; nominal final dihitung saat booking.

### BR-RSV-10 — Formula diskon dan pembulatan

```text
total_harga_awal = harga_per_jam_snapshot × durasi_jam
raw_potongan = total_harga_awal × persentase_diskon / 100
potongan_diskon = ROUNDING_RULE(raw_potongan)
total_bayar = max(0, total_harga_awal - potongan_diskon)
```

- **ASSUMPTION:** karena tarif dan durasi integer, gunakan pembulatan half-up ke integer IDR.
- Promo 100% menghasilkan total bayar 0.
- Client tidak dapat mengirim/menimpa total.
- **OPEN QUESTION:** aturan pembulatan final perlu persetujuan.

### BR-RSV-11 — Pembuatan dan idempotensi

Reservasi baru berstatus `belum_dikonfirm` dan memiliki kode booking unik. Semua kalkulasi/relasi dibuat dalam satu transaksi.

- **DESIGN DECISION:** dukung `Idempotency-Key` untuk POST reservasi, scoped ke member+route, dengan fingerprint payload dan response replay terbatas.
- Key sama + payload beda ditolak 409.
- **OPEN QUESTION:** TTL/storage idempotency dan apakah extension header diterima evaluator.

### BR-RSV-12 — Perubahan status

Status tidak boleh diubah bebas. Endpoint status admin mengikuti matrix pada bagian 3; check-in/out adalah jalur normal menuju `aktif`/`selesai`. Terminal state tidak dapat diaktifkan kembali. Mutasi memakai row lock/optimistic version agar stale update gagal.

### BR-RSV-13 — Pembatalan

- Member hanya membatalkan reservasi miliknya.
- **ASSUMPTION:** member dapat cancel dari `belum_dikonfirm` dan `disetujui`, bukan `aktif`, `selesai`, atau `dibatalkan`.
- Admin dapat menolak/membatalkan dari `belum_dikonfirm` atau `disetujui`.
- Cancel idempotent dapat mengembalikan state saat ini atau konflik konsisten; pilihan response final harus didokumentasikan.
- **OPEN QUESTION:** batas waktu cancellation dan refund tidak ada karena payment di luar scope.

### BR-RSV-14 — Check-in, check-out, dan QR

- Check-in hanya untuk `disetujui`; hasil `aktif`; catat `check_in_at` sekali.
- Check-out hanya untuk `aktif`; hasil `selesai`; catat `check_out_at` sekali.
- Admin harus owner reservasi.
- QR berisi token opaque/random atau payload signed dengan expiry/audience/reservation binding; tidak berisi app key, JWT, atau PII.
- Verifikasi token harus tahan replay sesuai policy check-in.
- Jalur wajib 50 operasi: admin scan/input QR, menginspeksi e-ticket melalui API-EP-022 dalam scope yang sah, mencocokkan booking/status/owner, lalu memanggil API-EP-044; EP-044 tetap mengulang authorization dan state check server-side.
- Endpoint scan/verify QR khusus adalah OPTIONAL; open question hanya menentukan apakah extension tersebut dibutuhkan. Grace period, early/late check-in, dan offline mode tetap belum ditetapkan.

### BR-RSV-15 — Histori, laporan, archive, dan perubahan master

- Histori dan e-ticket menggunakan snapshot transaksi; rename/archive space, member, owner, atau diskon tidak boleh merusaknya.
- Data master yang direferensikan diarsipkan atau delete ditolak; hard delete hanya jika tidak direferensikan dan policy mengizinkan.
- Query bulan memakai business timezone dan rentang `[awal_bulan, awal_bulan_berikutnya)`.
- Semua list/report dibatasi dan diurutkan deterministik.

## 3. Matriks transisi status

`✓` diizinkan; `—` no-op/idempotent hanya jika kontrak memilih demikian; `✗` ditolak.

| Dari \ Ke | belum_dikonfirm | disetujui | aktif | selesai | dibatalkan |
|---|---:|---:|---:|---:|---:|
| belum_dikonfirm | — | ✓ Admin approve | ✗ | ✗ | ✓ Member/Admin |
| disetujui | ✗ | — | ✓ Admin check-in | ✗ | ✓ Member/Admin (ASSUMPTION) |
| aktif | ✗ | ✗ | — | ✓ Admin check-out | ✗ |
| selesai | ✗ | ✗ | ✗ | — | ✗ |
| dibatalkan | ✗ | ✗ | ✗ | ✗ | — |

`PATCH /status` tidak boleh menjadi bypass untuk check-in/out timestamp. **DESIGN DECISION:** status `aktif` dan `selesai` hanya dicapai melalui endpoint check-in/check-out; PATCH status digunakan untuk approve/cancel.

## 4. Aturan master data

### User/member/owner

- Username unique pada scope tenant final.
- Role dan profil harus cocok; satu user tidak menjadi member sekaligus owner pada baseline.
- Password update selalu menghasilkan hash baru.

### Space

- `harga_per_jam` integer >= 0; `kapasitas` integer > 0.
- `tipe` hanya tiga enum sumber.
- Space archived tidak dapat dipesan tetapi tetap muncul sebagai snapshot histori.

### Diskon

- `nama_diskon` diperlakukan sebagai kode; normalisasi uppercase/trim adalah **DESIGN DECISION**.
- Unique per owner/tenant; periode akhir >= awal.
- Edit promo tidak mengubah snapshot reservasi lama.

## 5. Formula laporan

Periode dan scope: reservasi owner/tenant dengan `tanggal_reservasi` dalam bulan bisnis.

Definisi proposal:

```text
total_transaksi = COUNT(reservasi yang masuk set laporan)
total_jam_terpakai = SUM(durasi_jam)
estimasi_pendapatan_kotor = SUM(total_harga_awal)
total_potongan_diskon = SUM(potongan_diskon)
realisasi_pendapatan_bersih = SUM(total_bayar untuk status = selesai)
```

Set laporan estimasi:

```text
status IN (disetujui, aktif, selesai)
```

Reservasi `belum_dikonfirm` dan `dibatalkan` tidak dihitung dalam estimasi proposal. Rincian per tipe:

```text
total_booking = COUNT(*)
total_jam = SUM(durasi_jam)
total_pendapatan = SUM(total_bayar)
GROUP BY tipe_snapshot
```

Invariant rekonsiliasi untuk set status yang sama:

```text
SUM(rincian.total_booking) = total_transaksi
SUM(rincian.total_jam) = total_jam_terpakai
SUM(total_harga_awal) - SUM(potongan_diskon) = SUM(total_bayar)
```

**OPEN QUESTION:** sumber menyebut “realisasi” tanpa payment gateway. Definisi `status=selesai` adalah proxy penyelesaian layanan, bukan bukti pembayaran, dan label API harus menjelaskannya.

## 6. Kasus batas wajib diuji

Durasi 0/negatif/pecahan/maksimum; `24:00`; lintas hari; leap day; boundary timezone; booking berdampingan; seluruh bentuk overlap; dua booking simultan; promo pada tepat awal/akhir; 1%/100%; harga berubah; retry timeout; transisi ilegal; cancel setelah aktif; duplicate check-in/out; master archived; laporan bulan kosong dan rekonsiliasi per tipe.

Lihat [Testing Strategy](testing-strategy.md) untuk ID test dan [Database Design](database-design.md) untuk enforcement database.