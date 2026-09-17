# Matriks Ketertelusuran Kebutuhan

## 1. Konvensi

- Sumber utama: `Rev_Soal_UKK_2026-2027_Paket_B (1).md` (**Soal**).
- Status seluruh item: **Direncanakan/Belum diverifikasi**, bukan klaim implementasi.
- `API-EP-001..050` mengikuti nomor endpoint pada Soal baris 151-217.
- Test endpoint memakai pola `TST-EP-<NNN>-S/V/A/T/C/F` yang didefinisikan di `testing-strategy.md`.
- `A`: asumsi; `OQ`: open question di `decisions-and-open-questions.md`.

## 2. Kebutuhan lintas sistem

| ID | Kebutuhan | Sumber | Rencana output | Verifikasi |
|---|---|---|---|---|
| REQ-CON-001 | REST API mengikuti kontrak 50 endpoint dan envelope baku | Soal 145-233; Lampiran B 1145-1179 | OpenAPI + controller/serializer | TST-API-001, TST-DOC-001 |
| REQ-TEN-001 | Isolasi data per App Maker melalui `x-maker-key`/`x-app-key` | Soal 147, 221-225 | tenant middleware + tenant FK/scope | TST-SEC-004..005 |
| REQ-AUTH-001 | JWT multi-role member/admin; App Maker auth | Soal 147, 223-225, 505-605 | auth service, role/ownership guard | TST-SEC-002..010 |
| REQ-DATA-001 | Format tanggal ISO, jam HH:mm, durasi min. 1, uang integer IDR | Soal 233 | DTO/domain validation + DB checks | TST-UNIT-001..004, TST-BIZ-001..015 |
| REQ-MED-001 | Foto member/space/general dapat disimpan dan diakses | Soal 235-241, 1071-1103 | storage adapter + upload API | TST-UPL-001..007 |
| REQ-SEC-001 | Validasi input dan hashing password | Soal 1131, 1163 | schema validation + adaptive hash | TST-SEC-007..009, TST-DATA-001 |
| REQ-DOC-001 | Dokumentasi endpoint Postman/Swagger | Soal 79, 1165-1179 | OpenAPI/Swagger + Postman export | TST-DOC-001 |
| REQ-OPS-001 | Status/root dan health check | Soal 153-155, 493-503 | liveness/readiness contract | TST-CON-003..004 |
| REQ-OPS-002 | Local setup, CI/CD, rollback, backup/restore EC2-RDS-S3 | Instruksi pengguna | dokumen/rencana pipeline dan runbook | TST-OPS-001..002, TST-DR-001 |
| REQ-SUB-001 | Checklist penyerahan kategori | Soal 1111-1290; instruksi pengguna | checklist per kategori | review checklist |

## 3. Kebutuhan aktor Member/Pengunjung

| ID | Kebutuhan | Sumber | Endpoint/output | Test |
|---|---|---|---|---|
| REQ-MEM-001 | Register: nama, instansi, telepon, alamat, username, password, foto | Soal 96-99, 273-285 | API-EP-008, API-EP-050 | TST-E2E-001, TST-SEC-008, TST-UPL-* |
| REQ-MEM-002 | Login | Soal 100 | API-EP-010..011 | TST-E2E-001, TST-SEC-002/007 |
| REQ-MEM-003 | Melihat space, foto, kapasitas, fasilitas, harga/jam dan availability | Soal 102-103 | API-EP-012..015 | TST-E2E-001, TST-DATA-004..007 |
| REQ-MEM-004 | Reservasi tanggal, jam, durasi, promo | Soal 104-105 | API-EP-016..019 | TST-BIZ-001..010 |
| REQ-MEM-005 | Melihat status reservasi | Soal 106-107 | API-EP-020, 023 | TST-E2E-001, TST-SEC-006 |
| REQ-MEM-006 | Histori berdasarkan bulan | Soal 108-109 | API-EP-021 | TST-BIZ-014 |
| REQ-MEM-007 | Cetak e-ticket/nota, kode reservasi, QR check-in | Soal 110-111 | API-EP-022 | TST-E2E-001, BOLA/QR test |
| REQ-MEM-008 | Membatalkan reservasi sesuai state | Kontrak API Soal 178-184, 765-775 | API-EP-024 | TST-BIZ-012/013 |

## 4. Kebutuhan aktor Admin Pengelola Space

| ID | Kebutuhan | Sumber | Endpoint/output | Test |
|---|---|---|---|---|
| REQ-ADM-001 | Register lokasi/profil/akun admin dan login | Soal 112-117 | API-EP-009..011 | TST-E2E-002, TST-SEC-* |
| REQ-ADM-002 | Lihat/update profil coworking | Soal 118-119 | API-EP-025..026 | contract + ownership tests |
| REQ-ADM-003 | CRUD member | Soal 120-121 | API-EP-027..031 | TST-DATA-001..007, role/tenant tests |
| REQ-ADM-004 | CRUD space/tipe/kapasitas/harga/deskripsi/foto | Soal 122-123 | API-EP-032..036, 049 | CRUD/upload/ownership tests |
| REQ-ADM-005 | CRUD promo/diskon/periode | Soal 124-125 | API-EP-037..041 | TST-BIZ-007..009 |
| REQ-ADM-006 | Konfirmasi/status/check-in/check-out | Soal 126-127 | API-EP-043..045 | TST-BIZ-011..013 |
| REQ-ADM-007 | Semua reservasi, filter status dan bulan | Soal 128-129 | API-EP-042 | TST-BIZ-014, TST-DATA-004..007 |
| REQ-ADM-008 | Estimasi pendapatan bulanan dan distribusi per tipe | Soal 130-131 | API-EP-046..047 | TST-BIZ-015 |

## 5. Kebutuhan aktor App Maker/Guru

| ID | Kebutuhan | Sumber | Endpoint/output | Test |
|---|---|---|---|---|
| REQ-MKR-001 | Register App Maker dan memperoleh app key | Soal 157, 247-269, 505-521 | API-EP-003 | TST-E2E-003, duplicate/race test |
| REQ-MKR-002 | Login App Maker | Soal 158, 523-537 | API-EP-004 | TST-E2E-003, brute-force test |
| REQ-MKR-003 | Profil dan app key saat ini | Soal 159, 539-545 | API-EP-005 | auth/serialization test |
| REQ-MKR-004 | Statistik tenant | Soal 160, 547-551 | API-EP-006 | tenant/agregasi test |
| REQ-MKR-005 | Guru/penguji melihat daftar App Maker | Soal 161, 553-559 | API-EP-007 | akses/redaction test; OQ-SEC-001 |

## 6. Ketertelusuran seluruh 50 endpoint

Setiap baris di bawah mewajibkan sukses (`S`), validasi (`V`), auth/role/ownership (`A`), tenant (`T`), contract (`C`), dan failure/rollback (`F`) bila relevan.

| ID | Method dan path | Aktor/tujuan | Kebutuhan | Test wajib |
|---|---|---|---|---|
| API-EP-001 | `GET /` | Publik: status/petunjuk | REQ-OPS-001, REQ-DOC-001 | TST-EP-001-S/V/C |
| API-EP-002 | `GET /health` | Publik: health | REQ-OPS-001 | TST-EP-002-S/C, TST-CON-003/004 |
| API-EP-003 | `POST /api/maker/register` | Publik: register App Maker | REQ-MKR-001 | TST-EP-003-S/V/T/C/F, TST-SEC-008 |
| API-EP-004 | `POST /api/maker/login` | Publik: login App Maker | REQ-MKR-002 | TST-EP-004-S/V/A/C, TST-SEC-007 |
| API-EP-005 | `GET /api/maker/me` | App Maker: profil/app key | REQ-MKR-003 | TST-EP-005-S/A/T/C |
| API-EP-006 | `GET /api/maker/stats` | App Maker: statistik | REQ-MKR-004 | TST-EP-006-S/V/A/T/C |
| API-EP-007 | `GET /api/maker/list` | Guru/penguji: daftar maker | REQ-MKR-005 | TST-EP-007-S/V/A/C, TST-SEC-010 |
| API-EP-008 | `POST /api/auth/register/member` | Publik+app key: register member | REQ-MEM-001 | TST-EP-008-S/V/A/T/C/F, TST-SEC-008 |
| API-EP-009 | `POST /api/auth/register/admin-space` | Publik+app key: register admin | REQ-ADM-001 | TST-EP-009-S/V/A/T/C/F |
| API-EP-010 | `POST /api/auth/login` | Publik+app key: login user | REQ-MEM-002, REQ-ADM-001 | TST-EP-010-S/V/A/T/C, TST-SEC-007 |
| API-EP-011 | `GET /api/auth/profile` | Member/admin: profil | REQ-MEM-002, REQ-ADM-001 | TST-EP-011-S/A/T/C |
| API-EP-012 | `GET /api/spaces/types` | Publik/user: tipe space | REQ-MEM-003 | TST-EP-012-S/V/T/C |
| API-EP-013 | `GET /api/spaces/availability` | Publik/user: availability | REQ-MEM-003/004 | TST-EP-013-S/V/T/C, TST-BIZ-001..006 |
| API-EP-014 | `GET /api/spaces` | Publik/user: katalog/filter | REQ-MEM-003 | TST-EP-014-S/V/T/C, TST-DATA-004..007 |
| API-EP-015 | `GET /api/spaces/{id}` | Publik/user: detail space | REQ-MEM-003 | TST-EP-015-S/V/T/C, cross-tenant 404 |
| API-EP-016 | `GET /api/diskon/active` | Publik/user: promo aktif | REQ-MEM-004 | TST-EP-016-S/V/T/C, TST-BIZ-007 |
| API-EP-017 | `POST /api/diskon/check` | Publik/user: validasi promo | REQ-MEM-004 | TST-EP-017-S/V/T/C, TST-BIZ-007..009 |
| API-EP-018 | `GET /api/diskon/{id}` | Publik/user: detail promo | REQ-MEM-004 | TST-EP-018-S/V/T/C |
| API-EP-019 | `POST /api/reservasi` | Member: membuat reservasi | REQ-MEM-004 | TST-EP-019-S/V/A/T/C/F, TST-BIZ-001..010/013 |
| API-EP-020 | `GET /api/reservasi/my` | Member: daftar/status milik sendiri | REQ-MEM-005 | TST-EP-020-S/V/A/T/C, TST-SEC-006 |
| API-EP-021 | `GET /api/reservasi/my/history` | Member: histori bulan/tahun | REQ-MEM-006 | TST-EP-021-S/V/A/T/C, TST-BIZ-014 |
| API-EP-022 | `GET /api/reservasi/{id}/e-ticket` | Member/admin: e-ticket | REQ-MEM-007 | TST-EP-022-S/V/A/T/C, BOLA+QR test |
| API-EP-023 | `GET /api/reservasi/{id}` | Member/admin: detail reservasi | REQ-MEM-005 | TST-EP-023-S/V/A/T/C, TST-SEC-005/006 |
| API-EP-024 | `PATCH /api/reservasi/{id}/cancel` | Member: cancel | REQ-MEM-008 | TST-EP-024-S/V/A/T/C/F, TST-BIZ-012/013 |
| API-EP-025 | `GET /api/admin/profile` | Admin: profil lokasi | REQ-ADM-002 | TST-EP-025-S/A/T/C |
| API-EP-026 | `PUT /api/admin/profile` | Admin: update profil | REQ-ADM-002 | TST-EP-026-S/V/A/T/C/F |
| API-EP-027 | `GET /api/admin/members` | Admin: daftar/search member | REQ-ADM-003 | TST-EP-027-S/V/A/T/C, TST-DATA-004..007 |
| API-EP-028 | `POST /api/admin/members` | Admin: tambah member | REQ-ADM-003 | TST-EP-028-S/V/A/T/C/F, TST-SEC-008 |
| API-EP-029 | `GET /api/admin/members/{id}` | Admin: detail member | REQ-ADM-003 | TST-EP-029-S/V/A/T/C, BOLA test |
| API-EP-030 | `PUT /api/admin/members/{id}` | Admin: update member | REQ-ADM-003 | TST-EP-030-S/V/A/T/C/F, password hash test |
| API-EP-031 | `DELETE /api/admin/members/{id}` | Admin: hapus member | REQ-ADM-003 | TST-EP-031-S/V/A/T/C/F, TST-DATA-003 |
| API-EP-032 | `GET /api/admin/spaces` | Admin: daftar space milik admin | REQ-ADM-004 | TST-EP-032-S/V/A/T/C, bounded-list test |
| API-EP-033 | `POST /api/admin/spaces` | Admin: tambah space | REQ-ADM-004 | TST-EP-033-S/V/A/T/C/F |
| API-EP-034 | `GET /api/admin/spaces/{id}` | Admin: detail space | REQ-ADM-004 | TST-EP-034-S/V/A/T/C, BOLA test |
| API-EP-035 | `PUT /api/admin/spaces/{id}` | Admin: update space | REQ-ADM-004 | TST-EP-035-S/V/A/T/C/F, snapshot-price test |
| API-EP-036 | `DELETE /api/admin/spaces/{id}` | Admin: hapus space | REQ-ADM-004 | TST-EP-036-S/V/A/T/C/F, TST-DATA-003 |
| API-EP-037 | `GET /api/admin/diskon` | Admin: daftar promo | REQ-ADM-005 | TST-EP-037-S/V/A/T/C, bounded-list test |
| API-EP-038 | `POST /api/admin/diskon` | Admin: tambah promo | REQ-ADM-005 | TST-EP-038-S/V/A/T/C/F, TST-BIZ-007..009 |
| API-EP-039 | `GET /api/admin/diskon/{id}` | Admin: detail promo | REQ-ADM-005 | TST-EP-039-S/V/A/T/C, BOLA test |
| API-EP-040 | `PUT /api/admin/diskon/{id}` | Admin: update promo | REQ-ADM-005 | TST-EP-040-S/V/A/T/C/F, boundary-period test |
| API-EP-041 | `DELETE /api/admin/diskon/{id}` | Admin: hapus promo | REQ-ADM-005 | TST-EP-041-S/V/A/T/C/F, TST-DATA-003 |
| API-EP-042 | `GET /api/admin/reservasi` | Admin: daftar/filter reservasi | REQ-ADM-007 | TST-EP-042-S/V/A/T/C, TST-BIZ-014 |
| API-EP-043 | `PATCH /api/admin/reservasi/{id}/status` | Admin: ubah status | REQ-ADM-006 | TST-EP-043-S/V/A/T/C/F, TST-BIZ-011..013 |
| API-EP-044 | `POST /api/admin/reservasi/{id}/check-in` | Admin: check-in | REQ-ADM-006 | TST-EP-044-S/V/A/T/C/F, TST-BIZ-011..013 |
| API-EP-045 | `POST /api/admin/reservasi/{id}/check-out` | Admin: check-out | REQ-ADM-006 | TST-EP-045-S/V/A/T/C/F, TST-BIZ-011..013 |
| API-EP-046 | `GET /api/admin/reports/monthly` | Admin: laporan bulanan/per tipe | REQ-ADM-008 | TST-EP-046-S/V/A/T/C, TST-BIZ-014/015 |
| API-EP-047 | `GET /api/admin/reports/income` | Admin: alias laporan income | REQ-ADM-008 | TST-EP-047-S/V/A/T/C, alias-equivalence test |
| API-EP-048 | `POST /api/upload/image` | User/admin/publik menurut kontrak: media umum | REQ-MED-001 | TST-EP-048-S/V/A/T/C/F, TST-UPL-001..007 |
| API-EP-049 | `POST /api/upload/spaces` | Admin menurut ringkasan; detail menyebut publik | REQ-ADM-004, REQ-MED-001 | TST-EP-049-S/V/A/T/C/F, TST-UPL-*, OQ-SEC-002 |
| API-EP-050 | `POST /api/upload/members` | User/admin: foto member | REQ-MEM-001, REQ-MED-001 | TST-EP-050-S/V/A/T/C/F, TST-UPL-* |

## 7. DTO dan invariant yang harus terlacak

| ID | DTO/entity | Sumber | Verifikasi utama |
|---|---|---|---|
| REQ-DTO-001 | RegisterMakerDto/LoginMakerDto | Soal 247-269 | required, format email, uniqueness, password policy/rate limit |
| REQ-DTO-002 | RegisterMemberDto/RegisterAdminSpaceDto/LoginDto | Soal 273-310 | required, normalization, uniqueness, hash, transaction |
| REQ-DTO-003 | CheckPromoDto/CreateReservasiDto | Soal 316-337 | promo/date/time/duration, dual promo ambiguity, overlap |
| REQ-DTO-004 | UpdateCoworkingProfileDto | Soal 341-350 | required vs partial semantics dikonfirmasi |
| REQ-DTO-005 | Create/UpdateMemberAdminDto | Soal 353-382 | optional update, password hash, foto ownership |
| REQ-DTO-006 | Create/UpdateSpaceDto | Soal 386-412 | enum, capacity, price, description, foto |
| REQ-DTO-007 | Create/UpdateDiskonDto | Soal 416-445 | persen 1..100 dan valid period |
| REQ-DTO-008 | UpdateReservasiStatusDto | Soal 449-455 | allowed enum + legal transition |
| REQ-DTO-009 | Reservation entity | Soal 459-485 | immutable financial snapshot, computed end time/totals |

## 8. Artefak penyerahan dan pengujian kategori

| ID | Kategori | Kebutuhan sumber | Artefak/verifikasi |
|---|---|---|---|
| REQ-CAT-001 | Backend | Soal 1145-1179 | source, migration/SQL, seluruh endpoint, Postman/Swagger, cara jalan, endpoint tests |
| REQ-CAT-002 | Fullstack | Soal 1111-1141 | source, DB, semua fitur, validation/hash, full E2E, cara jalan |
| REQ-CAT-003 | Frontend Web | Soal 1183-1213 | source, integrasi API, laptop/tablet responsive test, cara jalan |
| REQ-CAT-004 | Mobile | Soal 1217-1249 | source, Android 10+ emulator/device test, APK bila ada, cara jalan |
| REQ-CAT-005 | UI/UX | Soal 1262-1290 | 7 member+9 admin screens, 2 prototype flow, PDF/PNG, share link, design system |

Hanya satu kategori dipilih menurut Soal baris 74-82. Asumsi saat ini adalah Backend karena lokasi dokumen; konfirmasi tetap diperlukan.
