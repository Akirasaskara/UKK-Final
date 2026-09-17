# Design System Frontend

## 1. Status dan tujuan

Dokumen ini mendefinisikan baseline UI/UX untuk Smart Space Booking. Nilai token dan contoh komponen adalah rancangan, belum stylesheet atau komponen yang telah dibuat. Tujuannya menjaga konsistensi Publik, Member, Admin Space, App Maker, layar, dan print.

## 2. Prinsip

1. **Jelas sebelum dekoratif:** harga, jadwal, status, dan tindakan utama mudah dipindai.
2. **Status tidak hanya warna:** selalu sertakan teks/icon yang memiliki accessible name.
3. **Progressive disclosure:** detail kompleks muncul saat dibutuhkan, bukan menyembunyikan informasi kritis.
4. **Server authoritative:** label estimasi jelas; hasil server final dibedakan dari preview.
5. **Mobile-first dan content-first:** urutan DOM tetap logis pada semua breakpoint.
6. **Failure-aware:** error, empty, forbidden, expired, offline, dan unknown outcome adalah first-class state.
7. **Bahasa Indonesia ringkas:** hindari jargon internal API pada copy pengguna, tetapi identifier payload tidak diubah.

## 3. Token provisional

### 3.1 Warna semantik

Nilai final wajib lolos contrast check pada implementasi.

```css
:root {
  --color-brand-50: #eef6ff;
  --color-brand-600: #175cd3;
  --color-brand-700: #1849a9;
  --color-surface: #ffffff;
  --color-surface-subtle: #f8fafc;
  --color-text: #101828;
  --color-text-muted: #475467;
  --color-border: #d0d5dd;
  --color-focus: #155eef;
  --color-success: #067647;
  --color-warning: #b54708;
  --color-danger: #b42318;
  --color-info: #175cd3;
}
```

- Teks normal: rasio kontras minimum 4.5:1.
- Teks besar/ikon esensial: minimum 3:1.
- Focus indicator: kontras minimum 3:1 terhadap warna sekitar.
- Jangan memakai opacity rendah untuk teks penting.

### 3.2 Tipografi

Gunakan system font stack agar cepat dan stabil:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
```

Skala awal:

| Token | Mobile | Desktop | Kegunaan |
|---|---:|---:|---|
| `display` | 32/40 | 48/56 | hero saja |
| `h1` | 28/36 | 36/44 | satu per halaman |
| `h2` | 24/32 | 28/36 | section |
| `h3` | 20/28 | 22/30 | card/group |
| `body` | 16/24 | 16/24 | default |
| `small` | 14/20 | 14/20 | metadata, bukan informasi kritis tunggal |

Jangan mengecilkan input di bawah 16 px pada mobile agar browser tidak auto-zoom.

### 3.3 Spacing, radius, shadow

- Spacing: `4, 8, 12, 16, 24, 32, 48, 64` px.
- Radius: 6 px input, 8 px button, 12 px card/dialog.
- Shadow hanya untuk elevation dialog/dropdown; border tetap terlihat pada high contrast.
- Target sentuh minimum 44×44 CSS px.

### 3.4 Layout dan breakpoint

Breakpoint adalah alat layout, bukan device detection:

- mobile: `< 640px`;
- tablet: `640–1023px`;
- desktop: `>= 1024px`;
- wide container maksimum: 1200–1280 px.

| Area | Mobile | Tablet | Desktop |
|---|---|---|---|
| navigasi publik/member | header + menu/drawer | header | header penuh |
| admin | top bar + drawer | collapsible sidebar | sidebar tetap |
| katalog | 1 kolom | 2 kolom | 3–4 kolom |
| form | 1 kolom | 1–2 kolom sesuai relasi | max-width 720–840 px |
| detail | stacked | 2 kolom bila cukup | media + content |
| table | card list atau scroll region | scroll/table | table penuh |

Tidak ada informasi yang hanya tersedia saat hover. Pada zoom 200%, layout boleh berpindah ke pola mobile.

## 4. Komponen dasar

### Button

Varian: `primary`, `secondary`, `tertiary`, `danger`, `link`. State: default, hover, focus-visible, active, disabled, loading.

- Loading mempertahankan lebar dan label konteks (“Menyimpan…”).
- Disabled tidak menjadi satu-satunya penjelasan; tampilkan helper text bila prasyarat belum terpenuhi.
- Destructive action memakai dialog konfirmasi, bukan hanya warna merah.

### Form controls

`TextField`, `PasswordField`, `Textarea`, `Select`, `Combobox` bila opsi besar, `DateField`, `TimeField`, `NumberField`, `FileField`, `Checkbox`, `RadioGroup`.

Urutan: label → required marker tekstual → control → helper/error. Gunakan `aria-describedby`; error summary menautkan ke field pertama. Placeholder bukan label. Password dapat ditampilkan/sembunyikan tetapi tidak pernah dipopulasi ulang setelah error.

### Card dan data display

- `SpaceCard`: foto/fallback, nama, label tipe, kapasitas, harga per jam, fasilitas ringkas, CTA.
- `ReservationCard/Row`: `kode_booking`, jadwal, space, total, `StatusBadge`, aksi valid.
- `MetricCard`: label, angka, konteks periode; tidak menjadikan angka nol sebagai missing.
- `DescriptionList`: detail profil/reservasi/e-ticket.

### Navigation

Navigasi memiliki skip link ke konten utama, landmark `header/nav/main/footer`, active state dengan `aria-current="page"`, breadcrumb pada hirarki detail/edit, dan judul halaman yang unik.

### Dialog

- fokus masuk ke judul/aksi aman;
- trap fokus selama terbuka;
- Escape menutup bila aman;
- fokus kembali ke trigger;
- destructive dialog menyebut nama resource dan konsekuensi;
- tidak memakai dialog untuk error panjang yang perlu dirujuk kembali.

### Toast dan feedback

Toast hanya pelengkap; informasi wajib juga tersedia dekat aksi atau dalam halaman. Region memakai `aria-live="polite"`; error kritis dapat `role="alert"` tanpa mengumumkan ulang setiap keystroke.

## 5. Komponen domain

### `StatusBadge`

| Enum | Label UI | Semantik awal |
|---|---|---|
| `belum_dikonfirm` | Belum dikonfirmasi | warning |
| `disetujui` | Disetujui | info/success |
| `aktif` | Aktif/digunakan | success kuat |
| `selesai` | Selesai | neutral |
| `dibatalkan` | Dibatalkan | danger/neutral |

Enum tidak diterjemahkan dalam payload. Status tak dikenal harus menghasilkan fallback “Status tidak dikenal” dan contract telemetry tersanitasi, bukan crash.

### `SpaceTypeBadge`

| Enum | Label UI |
|---|---|
| `desk` | Personal Desk |
| `meeting_room` | Meeting Room |
| `private_office` | Private Office |

### `AvailabilityPanel`

Menampilkan parameter yang diperiksa, tersedia/tidak, estimasi, jam selesai, timestamp “terakhir diperiksa”, background refreshing, dan stale state saat input berubah. Warna bukan satu-satunya indikator.

### `ReservationStepper`

Tahap: `Pilih jadwal` → `Promo & ringkasan` → `Konfirmasi` → `Hasil`. Stepper bukan pengganti heading; pada mobile menjadi daftar ringkas. Pengguna dapat kembali tanpa kehilangan input valid, tetapi perubahan jadwal menghapus availability/promo preview lama.

### `ImageUpload`

State: idle, validating, uploading, uploaded, attached, error. Menampilkan preview, nama, ukuran, replace/remove lokal. Upload berhasil tidak boleh diberi label “Data tersimpan”. Object URL direvoke.

### `ResponsiveDataList`

Desktop menggunakan table semantik (`caption`, header scope); mobile dapat memakai cards dengan urutan label-nilai yang konsisten. Bila table horizontal scroll, region focusable diberi nama dan petunjuk.

### `ReservationTimeline`

Menjelaskan status saat ini dan timestamp yang benar-benar disediakan server. Jangan mengarang event historis dari status tunggal.

## 6. Keadaan UI wajib

| State | Pola |
|---|---|
| Initial loading | skeleton dengan dimensi stabil dan label status tersembunyi/terbaca screen reader |
| Background loading | data lama tetap terlihat, indikator “Memperbarui…” |
| Empty | ikon opsional, heading domain, penjelasan, CTA yang sah |
| Error | heading, pesan aman, request/retry action bila aman |
| Success | hasil spesifik; untuk mutasi tampilkan identitas hasil dari server |
| Forbidden | jelaskan tidak memiliki akses; tautan ke area role sendiri; tanpa detail resource |
| Session expired | jelaskan sesi berakhir; login ulang; tidak menyatakan forbidden |
| Not found | resource tidak ditemukan; kembali ke list |
| Offline | jelaskan koneksi; retry GET; mutasi pending tidak otomatis dikirim ulang |
| Unknown mutation outcome | warning berbeda dari gagal; rekonsiliasi sebelum retry |
| Contract error | pesan generik; jangan render response parsial |

## 7. Accessibility baseline

Target: WCAG 2.2 AA sejauh relevan.

- Semua fungsi dapat dilakukan keyboard tanpa keyboard trap.
- Urutan fokus mengikuti DOM/visual; jangan memakai positive `tabindex`.
- Focus-visible selalu terlihat.
- Satu `h1`, hirarki heading tidak melompat tanpa alasan.
- Input memiliki label dan error terasosiasi.
- Update availability, upload, dan submit diumumkan secukupnya.
- Icon-only button memiliki accessible name.
- Foto dekoratif memakai `alt=""`; foto space informatif memakai alt berbasis nama space, bukan nama file.
- QR memiliki alternatif teks: nomor tiket/kode booking dan payload tidak perlu dibacakan penuh.
- Animasi menghormati `prefers-reduced-motion`.
- Jangan mengunci orientation atau zoom.
- Bahasa dokumen `lang="id"`; istilah Inggris domain dapat diberi konteks.
- Uji keyboard, axe, zoom 200%, contrast, dan minimal satu screen reader secara manual.

## 8. Format angka, tanggal, dan copy

- IDR: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`.
- `YYYY-MM-DD` dipertahankan sebagai kalender lokal; jangan round-trip melalui UTC.
- Jam tampil 24 jam.
- Tanggal promo full ISO ditampilkan dengan timezone eksplisit setelah business timezone dikonfirmasi.
- Nomor telepon tetap string agar nol awal tidak hilang.
- Gunakan “estimasi” untuk preview; “total” hanya dari response reservasi.
- Error tidak menampilkan stack trace, raw HTML, token, `app_key`, atau body sensitif.

## 9. E-ticket dan print

### Konten wajib

- `e_ticket_number` dan `kode_booking`;
- coworking: nama dan telepon;
- member: nama, instansi, telepon;
- space: nama, tipe, harga/jam;
- jadwal: tanggal, jam mulai/selesai, durasi;
- rincian pembayaran: tarif kotor, promo, potongan, total;
- `status_reservasi`;
- QR dari `qr_code_payload` dan fallback teks yang aman.

### Aturan print

- ukuran A4 portrait; margin minimum 12–16 mm;
- hide navigation, breadcrumb, filter, toast, dan seluruh tombol;
- background tidak wajib untuk memahami status;
- QR minimum sekitar 30–35 mm dengan quiet zone dan kontras hitam-putih;
- hindari page break di dalam blok identitas/QR;
- URL/token tidak dicetak otomatis lewat pseudo-element;
- footer menyatakan tiket perlu diverifikasi oleh sistem lokasi, bukan bukti pembayaran jika payment tidak ada.

Uji screenshot/print preview Chromium dan cetak PDF; scan QR dari layar dan PDF. Payload QR dianggap data tidak tepercaya dan tidak dibuka sebagai URL otomatis.

## 10. Acceptance criteria Given/When/Then

| ID | Given | When | Then |
|---|---|---|---|
| DS-01 | pengguna hanya memakai keyboard | menavigasi route/form/dialog | semua kontrol terjangkau, fokus terlihat, dialog mengembalikan fokus |
| DS-02 | error validasi beberapa field | submit dilakukan | summary diumumkan dan fokus menuju field invalid pertama |
| DS-03 | status reservasi apa pun dari enum | card/detail dirender | teks status terlihat tanpa bergantung warna |
| DS-04 | viewport 320 px | katalog/form/admin list dibuka | tidak ada kontrol terpotong atau body horizontal scroll |
| DS-05 | zoom 200% | workflow reservasi dijalankan | konten reflow dan aksi tetap dapat digunakan |
| DS-06 | API sukses dengan list kosong | loading selesai | empty state dan CTA relevan tampil, bukan error |
| DS-07 | sesi valid tetapi API 403 | state dirender | forbidden tampil tanpa menghapus sesi otomatis |
| DS-08 | token expired/401 | handler berjalan | session-expired berbeda secara visual/semantik dari forbidden |
| DS-09 | e-ticket valid | print preview A4 dibuka | semua data wajib dan QR terlihat; navigasi/aksi tidak terlihat |
| DS-10 | `prefers-reduced-motion: reduce` | transisi UI terjadi | animasi non-esensial dinonaktifkan/dipersingkat |

## 11. Governance

Komponen baru harus memakai token semantik, mendokumentasikan state, keyboard behavior, accessible name, responsive behavior, dan print behavior bila relevan. Perubahan enum/label harus ditelusurkan ke [PRD](./PRD.md), [integrasi API](./api-integration.md), dan [traceability](./requirements-traceability.md).