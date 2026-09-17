# Validasi dan Penanganan Error

## 1. Lapisan validasi

1. **Client form validation** untuk feedback cepat dan mencegah request jelas invalid.
2. **Runtime response validation** di boundary API untuk mencegah UI memakai response yang berubah/rusak.
3. **Backend validation/authorization** tetap sumber kebenaran; client tidak dipercaya.
4. **Business result handling** menangani konflik jadwal, promo kedaluwarsa, dan transisi status walau input sintaksis valid.

Skema frontend harus berbagi nama field dan enum kontrak, tetapi tidak boleh mengimpor ORM/backend entity. Referensi backend: [kontrak API backend](../../backend/docs/api-contract.md) dan [security and validation backend](../../backend/docs/security-and-validation.md).

## 2. Aturan field

Aturan “wajib/opsional” berikut pasti dari kontrak; aturan yang tidak disebut tidak boleh dikarang sebagai backend guarantee.

| DTO | Wajib | Opsional / aturan |
|---|---|---|
| `RegisterMakerDto` | `name`, `username`, `email`, `password` | `password` minimal 6; email harus valid. |
| `LoginMakerDto` | `usernameOrEmail`, `password` | trim identifier, jangan trim password. |
| `RegisterMemberDto` | `username`, `password`, `nama_member`, `instansi`, `alamat`, `telp` | `foto`; password minimal 6. |
| `RegisterAdminSpaceDto` | `username`, `password`, `nama_coworking`, `nama_pemilik`, `telp` | password minimal 6. |
| `LoginDto` | `username`, `password` | keduanya nonempty. |
| `CheckPromoDto` | `nama_diskon` | nonempty; jangan ubah case kecuali backend mengonfirmasi case-insensitive. |
| `CreateReservasiDto` | `id_space`, `tanggal_reservasi`, `jam_mulai`, `durasi_jam` | `id_diskon`, `kode_promo`; durasi integer minimal 1; kirim satu mekanisme promo. |
| `UpdateCoworkingProfileDto` | `nama_coworking`, `nama_pemilik`, `telp` | semua wajib pada `PUT`. |
| `CreateMemberAdminDto` | `username`, `password`, `nama_member`, `instansi`, `alamat`, `telp` | `foto`; password minimal 6. |
| `UpdateMemberAdminDto` | tidak ada | `nama_member`, `instansi`, `alamat`, `telp`, `password`, `foto`; minimal satu field berubah. |
| `CreateSpaceDto` | `nama_space`, `harga_per_jam`, `tipe`, `kapasitas`, `deskripsi` | `foto`; harga number IDR, kapasitas integer positif; `tipe`: `desk`/`meeting_room`/`private_office`. |
| `UpdateSpaceDto` | tidak ada | field CreateSpace opsional; minimal satu field berubah. |
| `CreateDiskonDto` | `nama_diskon`, `persentase_diskon`, `tanggal_awal`, `tanggal_akhir` | persen `1..100`; awal/akhir ISO 8601; akhir sesudah awal. |
| `UpdateDiskonDto` | tidak ada | field CreateDiskon opsional; minimal satu field berubah; validasi rentang memakai nilai existing+baru. |
| `UpdateReservasiStatusDto` | `status` | enum `belum_dikonfirm`/`disetujui`/`aktif`/`selesai`/`dibatalkan`. |

Validasi query: `month` 1–12; `year` integer; semua ID integer positif; `tanggal` `YYYY-MM-DD`; `jam_mulai` `HH:mm`; `search` di-trim dan dibatasi panjang UI. Validasi nomor telepon sebagai string agar nol awal tidak hilang; jangan memaksakan format negara yang tidak ditentukan.

### Tanggal dan waktu

- Pertahankan `YYYY-MM-DD` sebagai string kalender, bukan `Date` UTC.
- Waktu promo full ISO ditampilkan dengan timezone yang eksplisit. Kontrak tidak menyebut zona bisnis; jangan mengklaim tanggal aktif berdasarkan jam client sebagai keputusan final.
- Availability dan promo tetap diverifikasi server sesaat sebelum mutasi.

### Nilai uang

Gunakan `number` integer dari server dan format `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`. Jangan menghitung nominal final dengan floating point client. `persentase_diskon` hanya preview; `total_bayar` server adalah nilai final.

## 3. Upload validation dan state

State upload: `idle -> validating -> uploading -> uploaded` atau `error`; sesudah entity tersimpan menjadi `attached`. Jangan tampilkan sukses entity hanya karena upload sukses.

Client checks:

- satu file pada field `file`;
- `/api/upload/image`: `.jpg`, `.jpeg`, `.png`, `.webp`;
- `/api/upload/spaces` dan `/api/upload/members`: `.jpg`, `.jpeg`, `.png`;
- cek MIME dan ekstensi; ukuran maksimum belum ada di kontrak, sehingga nilai final harus dikonfirmasi;
- preview URL direvoke pada replace/unmount;
- nama file response (`filename`) yang dikirim ke DTO entity, bukan `original_name`.

Jangan mempercayai MIME browser atau file name sebagai kontrol keamanan. Backend wajib melakukan validasi signature, ukuran, storage path, random filename, dan akses. Endpoint upload yang disebut publik adalah risiko kontrak.

## 4. Normalisasi error

```ts
type AppErrorKind =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'network'
  | 'timeout'
  | 'contract';

type AppError = {
  kind: AppErrorKind;
  statusCode?: number;
  message: string;
  fieldErrors?: Record<string, string>;
  requestId?: string;
  retryable: boolean;
};
```

Mapping:

| Kondisi | UI | Retry |
|---|---|---|
| validasi client | field error + fokus field pertama | setelah koreksi |
| `400` | pesan API; petakan ke field hanya jika field terbukti; konflik availability/promo tampil dekat section terkait | manual setelah koreksi/refetch |
| `401` | clear sesi user terkait, arahkan login; jangan menghapus Maker session yang berbeda tanpa alasan | setelah login |
| `403` | halaman/inline forbidden, jangan menyamarkan sebagai not found | tidak |
| `404` | empty/not-found untuk resource; jangan mempertahankan data edit stale | tidak |
| `409` bila backend menggunakannya | conflict dan refetch | manual |
| `429` | pesan rate limit; hormati `Retry-After` | manual/terjadwal terbatas |
| `500` | pesan generik aman; simpan detail teknis hanya observability tersanitasi | GET terbatas; mutasi tidak |
| network/timeout GET | error state dengan tombol coba lagi | ya, terbatas |
| network/timeout mutation | “hasil belum diketahui”; rekonsiliasi state | tidak otomatis |
| schema response tidak cocok | contract error; jangan render data parsial seolah valid | tidak |

Kontrak error tidak menyediakan `fieldErrors`. Karena itu mapping field berdasarkan parsing teks `message` harus dihindari; tampilkan sebagai form-level error kecuali backend menambahkan format terstruktur.

## 5. Form state dan feedback

Setiap halaman/form harus memiliki keadaan terpisah:

- **initial loading**: skeleton yang mempertahankan layout;
- **empty**: pesan domain dan tindakan yang relevan;
- **ready**: data berhasil;
- **background fetching**: data lama boleh tetap terlihat dengan indikator refresh;
- **submitting**: tombol disabled dan `aria-busy`, input kritis dikunci;
- **success**: feedback spesifik dan navigasi hanya setelah response valid;
- **validation error**: inline per field + summary aksesibel;
- **API error**: inline form atau page-level sesuai scope;
- **offline/network error**: tindakan retry aman;
- **unknown mutation outcome**: jangan menyatakan gagal/sukses sebelum refetch.

Password tidak boleh dipopulasi ulang, dicatat, atau ikut error telemetry. Error server yang mungkin berisi data input harus disanitasi sebelum logging.

## 6. Alur form penting

### Reservasi

1. Validasi `id_space`, `tanggal_reservasi`, `jam_mulai`, `durasi_jam`.
2. Query availability; reset hasil bila input berubah.
3. Jika promo manual, panggil `/api/diskon/check`; simpan `id`/`nama_diskon` response.
4. Tampilkan estimasi sebagai estimasi.
5. Saat submit: disable, refetch availability, lalu `POST /api/reservasi` bila masih available.
6. Kirim hanya `id_diskon` atau `kode_promo` sampai prioritas backend jelas.
7. Pada 201, gunakan `total_harga_awal`, `potongan_diskon`, `total_bayar`, `kode_booking`, `status` dari server.
8. Pada timeout, refetch `/api/reservasi/my`; jangan auto-resubmit.

### Status/check-in/check-out

UI dapat membatasi aksi berdasarkan status terakhir, tetapi backend tetap wajib menolak transisi invalid/stale. Sebelum aksi, refetch detail. Setelah sukses invalidasi semua daftar/detail/tiket/laporan terkait. Klik ganda diblokir per reservation ID.

### Delete

Dialog menyebut resource; tombol delete baru aktif setelah konfirmasi. Jika delete gagal karena relasi reservasi, tampilkan pesan backend tanpa menghilangkan item. Tidak ada optimistic removal default.

## 7. Keamanan rendering

- Render seluruh `message`, nama, alamat, deskripsi, dan field API sebagai teks, bukan `innerHTML`.
- Jangan merender HTML dari `deskripsi` tanpa sanitizer dan kebutuhan eksplisit.
- URL gambar divalidasi scheme/host; gunakan fallback bila gagal.
- `qr_code_payload` dikodekan oleh library QR sebagai data; jangan dieksekusi atau dijadikan URL otomatis.
- Redirect setelah login hanya ke allowlist route internal; jangan menerima URL eksternal mentah.
- Role guard adalah UX, bukan authorization. Semua endpoint tetap harus mengotorisasi server-side.
