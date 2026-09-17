# State dan Data Fetching

## 1. Prinsip kepemilikan state

Pisahkan state menurut sumber kebenarannya. Jangan menyalin server state ke global store karena menghasilkan dua cache yang dapat berbeda.

| Jenis | Contoh | Pemilik |
|---|---|---|
| URL state | `tipe`, `search`, `month`, `year`, `status`, `id_space`, `tanggal`, halaman/tab yang dapat dibagikan | Router/search params |
| Server state | space, diskon, reservasi, member, laporan, profil | Query cache (mis. TanStack Query bila dipilih) |
| Session state | role, profil login, status autentikasi; token in-memory atau session BFF | auth provider khusus |
| Form state | nilai input, touched/dirty, field error, submit state | library form/lokal per halaman |
| UI lokal | dialog terbuka, preview file, sort presentasional, toast | komponen terdekat |

Nilai harga, ketersediaan, diskon, status reservasi, dan laporan selalu berasal dari respons server. Perhitungan client hanya preview dan tidak boleh menggantikan hasil server.

## 2. Normalisasi parameter URL

- `month`: integer `1..12`; `year`: integer empat digit yang diterima backend.
- ID (`id`, `id_space`): integer positif.
- `durasi_jam`: integer minimal `1`.
- `tanggal`/`tanggal_reservasi`: literal lokal `YYYY-MM-DD`; jangan parse lalu serialisasi melalui UTC karena dapat bergeser hari.
- `jam_mulai`: `HH:mm`, 24 jam.
- `status`: salah satu `belum_dikonfirm`, `disetujui`, `aktif`, `selesai`, `dibatalkan`.
- `tipe`: salah satu `desk`, `meeting_room`, `private_office`.
- `search`: trim, panjang dibatasi UI, debounce 250–400 ms; nilai tetap berada di URL.

Parameter invalid dinormalisasi ke default aman dan URL diganti (`replace`), bukan menembakkan request invalid. Filter admin reservasi dan histori bulan harus dapat di-bookmark dan dipertahankan saat reload.

## 3. Query-key factory

Query key harus serializable, deterministik, dan mencakup tenant serta identitas/role untuk mencegah cache lintas sesi.

```ts
const qk = {
  root: ['root'] as const,
  health: ['health'] as const,
  maker: (makerKey: string) => ['maker', makerKey] as const,
  makerMe: (makerKey: string) => [...qk.maker(makerKey), 'me'] as const,
  makerStats: (makerKey: string) => [...qk.maker(makerKey), 'stats'] as const,
  profile: (makerKey: string, subject: string) => ['profile', makerKey, subject] as const,
  spaceTypes: (makerKey: string) => ['space-types', makerKey] as const,
  spaces: (makerKey: string, f: { tipe?: string; search?: string }) =>
    ['spaces', makerKey, f] as const,
  space: (makerKey: string, id: number) => ['space', makerKey, id] as const,
  availability: (makerKey: string, p: {
    id_space: number; tanggal: string; jam_mulai: string; durasi_jam: number;
  }) => ['availability', makerKey, p] as const,
  activeDiscounts: (makerKey: string) => ['discounts', makerKey, 'active'] as const,
  discount: (makerKey: string, id: number) => ['discount', makerKey, id] as const,
  myReservations: (makerKey: string, subject: string) =>
    ['reservations', makerKey, subject, 'mine'] as const,
  myHistory: (makerKey: string, subject: string, month?: number, year?: number) =>
    ['reservations', makerKey, subject, 'history', { month, year }] as const,
  reservation: (makerKey: string, subject: string, id: number) =>
    ['reservation', makerKey, subject, id] as const,
  ticket: (makerKey: string, subject: string, id: number) =>
    ['ticket', makerKey, subject, id] as const,
  adminMembers: (makerKey: string, search?: string) => ['admin-members', makerKey, { search }] as const,
  adminMember: (makerKey: string, id: number) => ['admin-member', makerKey, id] as const,
  adminSpaces: (makerKey: string) => ['admin-spaces', makerKey] as const,
  adminSpace: (makerKey: string, id: number) => ['admin-space', makerKey, id] as const,
  adminDiscounts: (makerKey: string) => ['admin-discounts', makerKey] as const,
  adminDiscount: (makerKey: string, id: number) => ['admin-discount', makerKey, id] as const,
  adminReservations: (makerKey: string, filters: object) =>
    ['admin-reservations', makerKey, filters] as const,
  monthlyReport: (makerKey: string, month?: number, year?: number) =>
    ['monthly-report', makerKey, { month, year }] as const,
};
```

Jangan masukkan raw access token ke query key/devtools. `subject` adalah ID user non-secret atau fingerprint sesi lokal yang berubah saat login.

## 4. Stale time, refetch, dan availability

| Data | `staleTime` awal | Refetch |
|---|---:|---|
| tipe space | 24 jam | saat invalidasi admin space bila tipe ternyata dinamis |
| katalog/detail space | 1–5 menit | focus opsional; invalidasi setelah CRUD |
| promo aktif/detail | 1 menit | focus; invalidasi setelah CRUD diskon |
| availability | `0` | saat parameter lengkap, focus, kembali ke langkah konfirmasi, dan tepat sebelum submit |
| profil | 5 menit | setelah login/update profile |
| reservasi member/admin | 15–30 detik | focus dan setelah mutasi status/check-in/out/cancel/create |
| e-ticket | 30 detik | invalidasi ketika status reservasi berubah |
| laporan | 1 menit | setelah perubahan status/check-out; focus opsional |
| maker stats | 30–60 detik | setelah operasi yang mengubah agregat |
| root/health | `0` | manual saja; tidak polling dari tiap client |

### Ketersediaan yang stale

Response `available: true` adalah snapshot, bukan lock. UI harus:

1. Hanya menjalankan query bila seluruh parameter valid.
2. Menampilkan waktu terakhir dicek dan status fetching.
3. Menandai hasil stale segera ketika salah satu input berubah.
4. Refetch tepat sebelum submit.
5. Tetap menangani `400` dari `POST /api/reservasi` sebagai konflik ketersediaan yang sah.
6. Tidak melakukan optimistic booking.

Tidak ada polling default. Jika kebutuhan real-time muncul, polling terbatas hanya pada halaman konfirmasi aktif dan berhenti saat tab tersembunyi; keputusan ini belum diperlukan kontrak.

## 5. Invalidation matrix

| Mutasi | Invalidasi/refetch minimum |
|---|---|
| register/login/logout | set/clear profile; pada logout `cancelQueries` lalu hapus seluruh query privat tenant+subject |
| update admin profile | `profile`, admin profile, space detail/list yang memuat `owner` |
| create/update/delete member | daftar/detail member, maker stats; reservasi bila nama member tertanam |
| create/update/delete space | katalog/detail publik, daftar/detail admin, availability terkait, maker stats |
| create/update/delete diskon | promo aktif/detail, daftar/detail admin, maker stats |
| create reservasi | my reservations, history bulan terkait, space availability, admin reservations, maker stats, reports |
| cancel/status/check-in/check-out | detail reservasi, list member/admin terkait, e-ticket, availability, history, reports, maker stats |
| upload | tidak invalidasi sendiri; simpan `filename`, lalu mutasi entity; cache entity diinvalidasi setelah mutasi entity sukses |

Invalidasi berbasis prefix harus tetap dibatasi tenant. Jika upload sukses tetapi penyimpanan entity gagal, tampilkan bahwa berkas belum terasosiasi; API tidak menyediakan delete upload sehingga cleanup merupakan open question.

## 6. Double submit, retry, dan optimistic update

- Tombol submit disabled saat mutation pending, form diberi `aria-busy`, dan handler menolak invocation kedua.
- Destructive/transactional mutation (`reservasi`, cancel, delete, status, check-in/out) tidak di-retry otomatis.
- Kontrak tidak menyediakan idempotency key atau version/ETag. Karena itu UI tidak boleh mengklaim exactly-once.
- Untuk timeout setelah mutasi, jangan langsung mencoba ulang. Refetch state target dan minta rekonsiliasi.
- Optimistic update hanya layak untuk state reversibel dan terverifikasi; pada kontrak ini default-nya **tidak digunakan** untuk workflow reservasi.
- Mutation paralel terhadap resource ID yang sama diserialisasi/ditolak di UI, tetapi backend tetap harus mengatasi concurrency.

## 7. Race condition dan pembatalan request

- Search/filter lama dibatalkan saat key berubah. Query library harus mengoper `AbortSignal` ke fetch.
- Respons lama tidak boleh menimpa form baru; query key memuat seluruh parameter.
- Setelah logout atau pergantian `app_key`, cancel dan clear cache sebelum render tenant berikutnya.
- Preview promo direset bila kode, space, tanggal, jam, atau durasi berubah.
- Hindari menginisialisasi form edit berulang kali dari refetch sehingga input dirty pengguna tertimpa; reset hanya saat ID berubah atau pengguna memilih reset.

## 8. Collection tanpa pagination

Kontrak list (`/api/spaces`, admin members/spaces/diskon/reservasi, maker list) tidak menyediakan `page`/`limit`. Frontend tidak boleh mengarang query pagination. Terapkan filter yang tersedia, virtualisasi/pembatasan render untuk UX, dan catat risiko payload tidak terbatas. Pagination server-side merupakan kebutuhan backend sebelum skala produksi; lihat [keputusan](./decisions-and-open-questions.md) dan referensi yang diharapkan [backend API](../../backend/docs/api-contract.md).
