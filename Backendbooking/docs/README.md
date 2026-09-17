# Dokumentasi Backend Smart Space Booking

## Status

Dokumen dalam direktori ini adalah spesifikasi dan rancangan untuk kategori **Backend** UKK Paket B. Dokumen ini **tidak menyatakan** source code, database, endpoint, pengujian, atau deployment telah tersedia.

- **Actual state:** pada saat dokumentasi disusun, tidak ditemukan implementasi backend atau schema executable yang dapat diverifikasi.
- **REQUIRED:** ketentuan yang berasal langsung dari soal UKK atau instruksi pengguna.
- **DESIGN DECISION:** keputusan rancangan yang diusulkan untuk membuat sistem konsisten, aman, dan dapat dioperasikan.
- **ASSUMPTION:** asumsi sementara yang harus divalidasi.
- **OPTIONAL:** kemampuan yang boleh ditambahkan tanpa mengurangi kebutuhan wajib.
- **OPEN QUESTION:** keputusan yang belum ditetapkan dan dapat memengaruhi implementasi.

## Peta dokumen

| Dokumen | Isi |
|---|---|
| [Project Brief](projectbrief.md) | konteks, sasaran, aktor, scope, dan ukuran keberhasilan |
| [PRD](PRD.md) | requirement ber-ID stabil, user story, acceptance criteria, alur, NFR, dan DoD |
| [TRD](TRD.md) | rancangan arsitektur, modul, request flow, transaksi, API, dan operasi |
| [Tech Stack](tech-stack.md) | status pemilihan teknologi dan stack usulan |
| [Database Design](database-design.md) | ERD baseline/usulan, kamus data, constraint, index, migrasi, seed, dan DTO mapping |
| [Business Rules](business-rules.md) | aturan domain reservasi, state machine, overlap, harga, QR, dan laporan |
| [Authentication & Authorization](authentication-and-authorization.md) | autentikasi, role, ownership, tenant isolation, dan matriks akses |
| [API Contract](api-contract.md) | kontrak naratif tepat 50 operasi, request/response, pagination, dan compatibility decisions |
| [OpenAPI 3.0.3](openapi.yaml) | kontrak machine-readable tepat 50 operasi untuk lint, Swagger, client, dan contract test |
| [Security & Validation](security-and-validation.md) | threat controls, validasi, upload, rate limit, logging, dan checklist keamanan |
| [Implementation Plan](implementation-plan.md) | vertical slice dan urutan implementasi |
| [Requirements Traceability](requirements-traceability.md) | pemetaan kebutuhan ke 50 endpoint dan pengujian |
| [Testing Strategy](testing-strategy.md) | lapisan, skenario, dan gerbang pengujian |
| [Deployment](deployment.md) | rancangan EC2–RDS–S3, CI/CD, backup, dan restore |
| [Decisions & Open Questions](decisions-and-open-questions.md) | register keputusan, konflik sumber, asumsi, dan pertanyaan terbuka |

## Sumber dan prioritas

1. Soal `Rev_Soal_UKK_2026-2027_Paket_B (1).md` sebagai sumber kebutuhan fitur dan kontrak API.
2. Transkripsi ERD yang diberikan pengguna sebagai baseline struktur tabel dan relasi.
3. Dokumen rancangan dalam direktori ini sebagai proposal implementasi; proposal tidak boleh diam-diam mengganti field atau enum sumber.

Jika sumber bertentangan, konflik dicatat di [Decisions & Open Questions](decisions-and-open-questions.md). Kontrak naratif [API Contract](api-contract.md) dan spesifikasi [OpenAPI 3.0.3](openapi.yaml) sudah tersedia sebagai artefak dokumentasi; keduanya belum membuktikan implementasi endpoint. Migration/schema executable masih belum ada.

## Ringkasan produk

Smart Space Booking melayani dua role bisnis: `member` dan `admin_space`. Member mendaftar, mencari space, memeriksa ketersediaan, memakai promo, membuat reservasi, melihat histori/status, membatalkan sesuai aturan, dan memperoleh e-ticket/QR. Admin mendaftarkan serta mengelola coworking space, member, space, diskon, reservasi, check-in/check-out, dan laporan bulanan.

Soal juga mendeskripsikan App Maker dan header tenant untuk API panitia. Untuk backend produksi, desain tenant harus diputuskan eksplisit; lihat [Authentication & Authorization](authentication-and-authorization.md).

## Batas implementasi

- **REQUIRED:** REST API mengikuti 50 method/path pada soal dan envelope response standar.
- **REQUIRED:** password di-hash, input divalidasi, role/ownership ditegakkan server-side, dan reservasi tidak boleh double-booking.
- **DESIGN DECISION:** modular monolith dan satu database relasional digunakan sebagai baseline proposal; tidak ada kebutuhan terbukti untuk microservice, queue, atau cache.
- **DESIGN DECISION:** entity database tidak diekspos langsung; response dibentuk melalui DTO/serializer.
- **OPEN QUESTION:** framework, ORM, DBMS, business timezone, TTL/revocation token, dan detail kompatibilitas kontrak belum disetujui.

## Cara menggunakan dokumentasi

1. Tutup keputusan kritis dalam [Decisions & Open Questions](decisions-and-open-questions.md).
2. Setujui requirement di [PRD](PRD.md) dan aturan di [Business Rules](business-rules.md).
3. Finalisasi schema dari [Database Design](database-design.md) dan arsitektur dari [TRD](TRD.md).
4. Lint dan review OpenAPI yang tersedia; buat migration, lalu tautkan implementasi/migration ke ID requirement/test.
5. Implementasikan bertahap mengikuti [Implementation Plan](implementation-plan.md).
6. Jalankan seluruh gerbang di [Testing Strategy](testing-strategy.md) sebelum klaim selesai.

## Larangan klaim

Checklist, diagram, command generik, dan acceptance criteria di dokumentasi ini adalah target. Status hanya boleh diubah menjadi terimplementasi/terverifikasi setelah terdapat bukti source code, migration, hasil test, build, dan deployment yang sesuai.