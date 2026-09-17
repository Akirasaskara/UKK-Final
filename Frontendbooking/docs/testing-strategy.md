# Strategi Pengujian Frontend

## 1. Tujuan dan piramida

Pengujian membuktikan integrasi kontrak, workflow Member/Admin, isolasi sesi/tenant pada client, keadaan gagal, dan responsivitas laptop/tablet. Tool final mengikuti framework yang dipilih; contoh stack: test runner unit (Vitest/Jest), Testing Library, Mock Service Worker, dan Playwright. Ini rancangan, bukan klaim bahwa tool atau test sudah tersedia.

- **Unit**: schema/parser, validator, formatter, query-key, reducer/session.
- **Component/integration**: form + mocked network + cache invalidation.
- **Contract**: fixture seluruh endpoint terhadap runtime schema/OpenAPI bila tersedia.
- **E2E**: browser terhadap environment terkontrol, tanpa memakai data produksi/panitia secara destruktif.
- **Nonfunctional**: accessibility, responsive, performance budget, dependency/security checks.

Referensi backend: [testing strategy backend](../../backend/docs/testing-strategy.md), [API contract](../../backend/docs/api-contract.md), [security and validation backend](../../backend/docs/security-and-validation.md).

## 2. Matriks pengujian yang diminta

| Area | Happy path | Failure/boundary | Level |
|---|---|---|---|
| Root/health | envelope dan field terbaca | timeout, 500, schema drift; tidak polling | contract/integration |
| Maker register/login/me/stats | token Maker dan `app_key` dipisah | duplicate 400, credential 401, missing header | integration/E2E setup |
| Maker list | client aplikasi tidak mengekspos route | data berisi `app_key` tidak masuk UI/log | security |
| User register/login/profile | role `member`/`admin_space` mengarah route benar | 400 duplicate, 401, 403, role tak dikenal | integration/E2E |
| Header | `x-maker-key` selalu terkirim; Bearer hanya endpoint perlu | pergantian tenant clear cache; token tidak masuk URL/log | unit/integration/security |
| Katalog space | filter `tipe`/`search`, detail dan foto | empty, 404, broken image, XSS di `deskripsi`, list besar | component/E2E |
| Availability | valid true, estimasi tampil | durasi 0/noninteger, tanggal/jam invalid, 400 occupied, stale input, race response | unit/integration/E2E |
| Promo | active/detail/check valid | unknown/expired 400, persen 1/100, periode boundary, timezone | unit/integration |
| Create reservasi | 201 dan nilai server dipakai | double-click, 400 collision, timeout unknown outcome, promo ambiguity | integration/E2E |
| Reservasi saya/history | list dan bulan/tahun | empty, month 0/13, status unknown, totals mismatch ditolak schema | component/contract |
| Detail/e-ticket | role Member/Admin, printable ticket, QR payload | 403 object-level, 404, XSS, print layout | integration/E2E |
| Cancel | confirm dan status berubah | stale status, double submit, timeout, 403 | integration/E2E |
| Admin profile | read/update | required field kosong, 401/403, concurrent stale response | integration |
| CRUD member | create/read/update/delete + search | duplicate, partial PUT, delete relation, 404, upload orphan | integration/E2E |
| CRUD space | enum/price/capacity, invalidasi katalog | negative/zero, enum invalid, delete booked space, stale availability | unit/integration/E2E |
| CRUD diskon | create/update/delete | persen 0/101, akhir < awal, duplicate code, active cache stale | unit/integration/E2E |
| Admin reservasi | seluruh filter URL | kombinasi filter, invalid enum/ID/date, unbounded response | integration/E2E |
| Status | perubahan ke `disetujui`/`dibatalkan` | semua transisi invalid/stale; double submit | integration/E2E |
| Check-in/out | approved→active→finished | out sebelum in, in dua kali, race dua tab, timeout | integration/E2E |
| Laporan/alias | angka dan rincian 3 tipe | month/year invalid, endpoint alias shape sempit, empty month | contract/component |
| Upload general/spaces/members | FormData field `file`, filename dipakai | MIME/ext salah, oversize, 401/403, network abort, entity save gagal | integration/security |
| Error envelope | status code dipetakan | malformed JSON, `statusCode` beda HTTP status, message sensitif | unit/contract |
| State/cache | key terisolasi tenant+subject, invalidasi tepat | logout/tenant switch leak, stale race, aborted request | unit/integration |
| Responsive | laptop/tablet sesuai syarat | 320px graceful, zoom 200%, long Indonesian text | visual/E2E |
| Accessibility | keyboard, label, focus, live error | dialog trap, contrast, screen reader status | automated+manual |

## 3. Matriks role dan authorization UX

| Route/aksi | Publik | Member | Admin Space | Maker |
|---|---:|---:|---:|---:|
| katalog/availability/promo | ya (dengan tenant key) | ya | ya | tidak perlu |
| reservasi create/my/history/cancel | tidak | ya | tidak | tidak |
| detail/e-ticket reservasi | tidak | milik sendiri | tenant admin | tidak |
| admin profile/CRUD/check-in/out/report | tidak | tidak | ya | tidak |
| maker me/stats | tidak | tidak | tidak | ya |
| maker list | tidak diekspos aplikasi | tidak | tidak | tidak |

Test frontend memastikan route guard dan tidak menampilkan aksi; test API/backend tetap wajib memastikan authorization karena route guard dapat dilewati.

## 4. Contract tests seluruh 50 endpoint

Sediakan satu fixture sukses dan minimal satu error representatif per endpoint. Untuk endpoint yang berbagi path beda method, test terpisah. Assertion minimum:

- HTTP status konsisten dengan `statusCode`;
- `status`, `message`, `timestamp`, dan `data`/`error` tersedia;
- nama field persis, termasuk `belum_dikonfirm`, `persentase_diskon`, `rincian_per_tipe_space`, `qr_code_payload`;
- number tidak diterima sebagai numeric string kecuali kontrak diubah;
- optional/null diuji (`id_diskon`, `member`, `space_owner`, `foto`);
- response alias income tidak diparse sebagai `MonthlyReport` penuh;
- response model tidak mengandalkan field database yang tidak didokumentasikan.

Jika backend menerbitkan OpenAPI, generate/validasi client dari [OpenAPI backend](../../backend/docs/openapi.yaml), lalu pertahankan runtime validation pada boundary eksternal.

## 5. Skenario E2E kritis

1. **Member booking**: register/login → katalog → detail → availability → promo → submit → status → detail → e-ticket/print → history.
2. **Admin operation**: register/login → update profile → CRUD member → upload+CRUD space → CRUD diskon → filter reservasi → approve → check-in → check-out → monthly report.
3. **Cancellation**: Member membatalkan reservasi eligible; Admin list/report berubah setelah invalidasi.
4. **Collision**: dua session memilih slot sama; satu sukses, satu menerima unavailable; tidak ada optimistic success palsu.
5. **Unknown result**: interupsi respons create booking; UI rekonsiliasi list sebelum menawarkan retry.
6. **Session isolation**: logout/login role lain dan ganti maker key; data cache lama tidak terlihat.
7. **Failure recovery**: API 500/network offline lalu recover; hanya GET aman yang retry.

Data E2E harus unik per run dan cleanup melalui API admin bila aman. Jangan menjalankan delete/check-in/out terhadap environment bersama tanpa tenant test khusus.

## 6. Test upload

Gunakan file fixture kecil yang benar-benar memiliki signature JPEG/PNG/WebP, bukan hanya ekstensi. Uji polyglot/HTML renamed `.jpg` sebagai rejection backend (bila environment backend tersedia), file kosong, multiple file, oversize di boundary final, filename Unicode/path traversal, dan abort. Frontend test memastikan tidak menetapkan multipart boundary manual dan object URL direvoke.

## 7. Test tanggal, zona waktu, dan uang

Jalankan unit test setidaknya pada zona `Asia/Jakarta` dan `UTC`:

- `2026-08-30` tetap tanggal yang sama;
- promo pada tepat `tanggal_awal` dan `tanggal_akhir`;
- pergantian bulan/tahun;
- jam `00:00`, `23:59`, durasi melintasi hari (perilaku backend masih open question);
- IDR integer dan nilai `0`, besar, serta pembulatan preview tidak menggantikan server total.

## 8. Quality gates sebelum merge/deploy

Nama command menunggu package manager/framework, tetapi pipeline wajib memetakan pemeriksaan berikut:

1. install lockfile deterministik;
2. format check;
3. lint tanpa warning baru;
4. TypeScript strict/typecheck;
5. unit + component tests dengan failure paths;
6. contract tests fixtures;
7. production build;
8. E2E critical flows pada environment test;
9. dependency audit dan secret scan;
10. accessibility automated + smoke manual;
11. bundle/source-map review untuk token, `app_key`, atau konfigurasi server-only.

Hasil test harus menyebut command aktual, commit, environment, dan artefak. Tidak boleh mengklaim lolos sebelum repository frontend dan backend test environment tersedia.
