# Rancangan Deployment, Operasi, Backup, dan Pemulihan

## 1. Status

Dokumen ini adalah **rancangan**, bukan bukti bahwa infrastruktur, pipeline, deployment, backup, atau restore telah dibuat/dijalankan. Target yang diminta pengguna adalah AWS EC2–RDS–S3. Region, domain, SLA, DBMS, dan anggaran belum dikonfirmasi. Target RTO/RPO dikelola sebagai `OQ-011` dengan owner dan closure criteria eksplisit di [Decisions & Open Questions](decisions-and-open-questions.md).

## 2. Topologi target

```text
Internet
  → DNS
  → HTTPS endpoint (ALB direkomendasikan; atau reverse proxy EC2 untuk dev terbatas)
  → EC2 private application tier (min. 2 AZ untuk produksi HA)
      → RDS private subnets (Multi-AZ untuk produksi)
      → S3 media bucket melalui IAM role/VPC endpoint bila tersedia
      → CloudWatch/telemetry
  → Secrets Manager/SSM Parameter Store
```

- **EC2:** menjalankan artefak aplikasi immutable sebagai systemd service atau container. Tidak menyimpan media/user state pada disk lokal. Security group hanya menerima traffic aplikasi dari ALB; SSH publik dinonaktifkan, akses operasional memakai SSM Session Manager.
- **RDS:** tidak public-accessible; koneksi hanya dari security group aplikasi; encryption at rest dan TLS in transit; automated backup/PITR; Multi-AZ sesuai target availability.
- **S3:** bucket terpisah per environment, Block Public Access default, versioning dan SSE aktif. Akses aplikasi melalui instance profile/IAM role least privilege. Jika media harus publik, gunakan CloudFront/presigned URL atau prefix policy terkontrol setelah keputusan keamanan—bukan ACL publik per object secara ad hoc.
- **ALB/TLS:** sertifikat ACM, redirect HTTP→HTTPS, health check readiness, request size/timeout diselaraskan aplikasi. WAF/rate-based rules dipertimbangkan untuk produksi publik.
- **Jaringan:** ALB di public subnets; EC2/RDS di private subnets. Egress dibatasi sesuai kebutuhan. RDS dan S3 tidak berbagi credential statis.

**Asumsi DEP-A-001:** satu service cukup untuk beban saat ini. Tidak ditambahkan queue/cache sampai kebutuhan terukur membenarkannya.

## 3. Pemisahan environment

`local`, `test`, `staging`, dan `production` memakai database, bucket, secret, host, dan IAM policy berbeda. Data produksi tidak disalin ke nonproduksi tanpa sanitasi. Nama environment wajib menjadi tag/resource prefix; deployment staging tidak boleh memiliki akses ke secret produksi.

Environment variable yang direferensikan tanpa nilai:

- aplikasi: `APP_ENV`, `APP_HOST`, `APP_PORT`, `APP_BASE_URL`, `TRUST_PROXY`, `LOG_LEVEL`, `REQUEST_TIMEOUT_MS`;
- DB: `DATABASE_URL` atau `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`, `DB_POOL_MIN`, `DB_POOL_MAX`;
- auth/credential encryption: `JWT_ACCESS_SECRET`/pasangan `JWT_PRIVATE_KEY` dan `JWT_PUBLIC_KEY`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_TTL`, `APP_KEY_LOOKUP_SECRET`, `APP_KEY_KEK_ID` (referensi KMS/secret manager; tidak ada key material dalam source/config plaintext);
- HTTP security: `CORS_ALLOWED_ORIGINS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`;
- S3: `STORAGE_DRIVER`, `AWS_REGION`, `S3_BUCKET_NAME`, `S3_PUBLIC_BASE_URL`, `UPLOAD_MAX_BYTES`, `UPLOAD_ALLOWED_MIME_TYPES`;
- observability: `OTEL_EXPORTER_OTLP_ENDPOINT`, `ERROR_REPORTING_DSN`, `HEALTH_DB_TIMEOUT_MS` bila digunakan.

Aplikasi tidak boleh mengandalkan `localhost` untuk URL media produksi seperti contoh Soal baris 235-241 dan 1071-1103; URL dibentuk dari konfigurasi/adapter storage.

## 4. Persiapan lokal

1. Gunakan versi runtime/package manager yang dipin dan lockfile.
2. Sediakan DB lokal/disposable serta S3 emulator atau bucket development terisolasi.
3. Buat file environment lokal dari template yang diabaikan Git; jangan menyalin secret produksi.
4. Install dependency, jalankan migration, lalu seed data dummy.
5. Jalankan service dan cek root, liveness, readiness, OpenAPI.
6. Jalankan lint, typecheck, unit, integration, API/Postman, dan production build.

Perintah aktual belum dapat ditetapkan sebelum stack diperiksa. Pipeline harus menyediakan script stabil: `lint`, `typecheck`, `test:*`, `build`, `migration:up`, dan `start`.

## 5. Artefak dan konfigurasi runtime

- Build sekali di CI; promosikan checksum/image/artifact yang sama ke staging lalu production.
- Artefak tidak memuat `.env`, source map publik yang sensitif, test fixture, atau development dependency yang tidak diperlukan.
- Process berjalan sebagai user non-root, filesystem read-only bila memungkinkan, dan menerima SIGTERM untuk graceful shutdown.
- Set body/upload limits, request/DB timeout, connection pool, dan maximum header size.
- `TRUST_PROXY` hanya disetel pada jumlah/proxy yang benar agar IP/rate limit tidak dapat dipalsukan.
- Health:
  - `/health` liveness: process/event loop hidup, murah, tidak membocorkan detail.
  - readiness terpisah direkomendasikan untuk dependency kritis. Bila kontrak hanya mengizinkan `/health`, bentuk final perlu diputuskan tanpa merusak API-EP-002.

## 6. CI

Pada pull request:

1. checkout dan install terkunci;
2. secret scan, SAST, dependency audit;
3. format check/lint/typecheck;
4. unit test;
5. start DB/storage disposable dan migration dari nol;
6. integration, API, security, dan OpenAPI/Postman tests;
7. production build dan artefak SBOM/checksum;
8. scan image bila container digunakan.

PR diblok bila ada kegagalan, migrasi tidak repeatable, perubahan kontrak tanpa review, atau vulnerability Blocker/High tanpa mitigasi yang disetujui.

## 7. CD

### Staging

1. Ambil artefak immutable dari CI.
2. Verifikasi signature/checksum dan approval.
3. Jalankan pre-deploy backup bila migration berisiko.
4. Jalankan migration backward-compatible dengan job tunggal dan lock.
5. Deploy rolling/blue-green.
6. Jalankan readiness, smoke API-EP kritis, tenant isolation, upload, dan alur reservasi.
7. Tahan promosi jika metric/error/log menunjukkan regresi.

### Production

1. Approval manual dengan release note, migration plan, rollback plan, owner, dan change window.
2. Verifikasi backup terakhir dan kapasitas RDS/EC2.
3. Terapkan migration **expand** terlebih dahulu.
4. Deploy artefak secara rolling atau blue/green; ALB mengalihkan traffic hanya ke instance ready.
5. Smoke test dengan data sintetis/tenant khusus; jangan memodifikasi data pelanggan sembarangan.
6. Monitor error rate, latency, saturation, DB connection/lock, 4xx/5xx, dan upload failure selama observation window.
7. Contract cleanup (**contract migration**) dilakukan pada rilis terpisah setelah semua versi lama tidak digunakan.

## 8. Strategi migration

- Migration append-only, versioned, reviewed, dan diuji dari DB kosong serta salinan schema staging.
- Gunakan expand/migrate/contract untuk rename/drop/type change: tambah struktur baru → dual-read/write atau backfill terukur → deploy aplikasi → verifikasi → hapus struktur lama pada rilis berikutnya.
- Backfill besar dibatch, resumable, memiliki timeout/monitoring, dan tidak dijalankan otomatis saat setiap instance boot.
- DDL berisiko lock panjang harus memiliki estimasi dan maintenance plan.
- Data migration tidak meng-hardcode generated ID.

## 9. Rollback

### Aplikasi

- Simpan minimal beberapa artefak sebelumnya yang tervalidasi.
- Hentikan promosi, alihkan ALB ke target group/versi sehat sebelumnya, lalu verifikasi smoke test.
- Jangan otomatis rollback schema destruktif. Versi aplikasi N-1 harus kompatibel dengan schema expand rilis N.

### Database

- Untuk perubahan non-destruktif, roll forward lebih aman.
- Untuk korupsi/data loss, isolasi writer, ambil snapshot forensik, tentukan restore point, restore RDS ke instance baru, validasi, lalu lakukan cutover terkontrol.
- Rollback yang kehilangan transaksi setelah restore point memerlukan persetujuan bisnis dan rekonsiliasi.

### S3

- Versioning memungkinkan pemulihan object terhapus/tertimpa. Lifecycle delete marker/noncurrent version harus lebih lama dari target RPO/retensi.
- DB dan S3 tidak berada dalam transaksi tunggal; cleanup job/rekonsiliasi object yatim direncanakan, tetapi queue tidak diperlukan pada tahap awal.

## 10. Backup dan restore

### Kebijakan rancangan

- RDS automated backup + PITR, snapshot manual sebelum migration berisiko, enkripsi KMS, retensi sesuai keputusan organisasi.
- S3 versioning, encryption, lifecycle, dan bila risiko menuntut, replication/cross-account backup.
- Backup configuration/IaC dan release artifact disimpan versioned; secret dikelola oleh secret manager dan memiliki prosedur rotasi, bukan diekspor ke dokumen.
- Akses backup dibatasi, diaudit, dan terpisah dari role runtime aplikasi.

### Runbook restore

1. Deklarasikan incident, hentikan writer bila perlu, catat waktu dan suspected restore point.
2. Restore RDS PITR/snapshot ke instance terisolasi—jangan overwrite production langsung.
3. Terapkan security group minimal dan credential sementara.
4. Verifikasi schema version, migration history, row count, FK/check, tenant isolation, sampel status reservasi, dan rekonsiliasi total uang.
5. Verifikasi referensi object terhadap S3; pulihkan versi object/delete marker yang diperlukan.
6. Jalankan test read-only dan smoke terkontrol.
7. Rencanakan DNS/connection cutover, freeze window, dan rekonsiliasi delta.
8. Cutover setelah approval; monitor; rotasi credential sementara.
9. Simpan laporan RTO/RPO aktual dan hapus resource restore setelah retensi investigasi.

**OPEN QUESTION `OQ-011`:** Product Owner menetapkan toleransi downtime/data loss dan Operations Owner menetapkan desain/runbook, dengan review Security/Privacy untuk retention. Pertanyaan ditutup hanya setelah target angka dan scope disetujui, backup/PITR/lifecycle dikonfigurasi terhadap target, owner alarm/escalation tercatat, dan drill `TST-DR-001` membuktikan hasil aktual memenuhi target atau memiliki mitigasi risiko yang disetujui. Sebelum penutupan itu, backup tidak boleh dinyatakan memadai.

## 11. Keamanan deployment

- TLS wajib; CORS allowlist eksplisit; security headers; error tanpa stack trace.
- JWT key, DB password, dan credential lain dari Secrets Manager/SSM; rotasi dan akses diaudit.
- IAM least privilege: aplikasi hanya object action pada bucket/prefix environment dan secret yang diperlukan.
- IMDSv2 wajib pada EC2; EBS encrypted; patching AMI/runtime terjadwal.
- RDS/S3 access logging dan CloudTrail sesuai kebijakan; log aplikasi meredaksi authorization, cookie, password, app key, payload QR sensitif, dan PII.
- Upload diverifikasi magic bytes, MIME, ukuran, dan key; pertimbangkan malware scan sebelum publikasi.
- Rate limit untuk login, register, upload, promo check, dan reservasi; limit berlaku benar di belakang ALB.

## 12. Observability dan alarm

Structured log minimal: timestamp, level, service/version, environment, request ID, route template, method, status, latency, tenant/user pseudonymous ID—tanpa secret/PII mentah. Metric: request count/latency/error, event-loop/CPU/memory, DB pool/latency/lock, reservation conflict, auth failure, rate-limit, upload failure, report latency. Alarm harus memiliki owner dan runbook; health endpoint tidak menampilkan hostname DB, stack, atau credential.

## 13. Acceptance deployment

Deployment siap produksi hanya jika IaC/review tersedia; staging parity memadai; seluruh test gate lulus; backup ditemukan dan restore drill berhasil; rollback aplikasi diuji; migration backward-compatible; smoke test dan alarm tervalidasi; domain/TLS/CORS final; serta tidak ada keputusan keamanan kritis terbuka. Sampai itu terpenuhi, status rancangan deployment adalah **belum dieksekusi**.
