# Rancangan Deployment Frontend di EC2

## 1. Status dokumen

Ini adalah **desain**, bukan bukti bahwa EC2, DNS, TLS, CI/CD, backend, atau monitoring telah tersedia. Repository frontend belum berisi aplikasi/config deployment yang dapat diverifikasi. Referensi backend: [deployment backend](../../backend/docs/deployment.md), [tech stack backend](../../backend/docs/tech-stack.md), dan [TRD backend](../../backend/docs/TRD.md).

## 2. Topologi yang disarankan

### Opsi A — Static SPA

Artefak statis dibangun di CI lalu disajikan Nginx pada EC2. Cocok bila framework menghasilkan static assets dan token tetap client-side/in-memory. Nginx terminasi HTTP internal; TLS sebaiknya di ALB atau Nginx dengan sertifikat terkelola. API panitia tetap eksternal melalui HTTPS.

Kelemahan: tidak ada BFF untuk cookie HttpOnly; `app_key` dan base URL yang dipakai browser akan terlihat di network/bundle. Jangan menaruh secret di build args.

### Opsi B — SSR/BFF Node

Nginx/ALB meneruskan ke proses Node pada loopback/private port. BFF menyimpan JWT dalam session/cookie HttpOnly dan meneruskan Bearer ke API. Gunakan bila framework dan requirement session mendukung. Tambahan kompleksitas: CSRF untuk cookie-authenticated mutation, session lifecycle, process supervision, server health, dan timeout proxy.

**Keputusan belum final:** pilih Opsi B bila token perlu persist lintas reload tanpa Web Storage; pilih Opsi A bila login ulang setelah reload dapat diterima. Jangan membangun BFF palsu yang hanya memindahkan token ke cookie tanpa CSRF dan lifecycle yang benar.

## 3. Environment variables

Nama final menyesuaikan framework (`NEXT_PUBLIC_*`, `VITE_*`, dan sebagainya). Prinsip klasifikasi:

| Variabel konseptual | Browser-exposed? | Catatan |
|---|---:|---|
| `PUBLIC_API_BASE_URL` | ya | URL API, validasi `https`, tanpa trailing/path ambiguity. |
| `PUBLIC_MEDIA_BASE_URL` | ya bila backend URL tidak absolut | host allowlist media; idealnya API memberi URL benar. |
| `PUBLIC_APP_ENV` | ya | label `production/staging`, bukan secret. |
| `PUBLIC_RELEASE_SHA` | ya | observability, bukan secret. |
| `PUBLIC_DEFAULT_MAKER_KEY` | hanya bila desain memang single-tenant client | `app_key` dikirim browser dan bukan secret kuat; tetap jangan hardcode tanpa keputusan provisioning. |
| `API_BASE_URL` | server-only pada BFF | origin upstream. |
| `APP_MAKER_KEY` | server-only bila BFF menyuntik header | jangan gunakan prefix public. |
| `SESSION_SECRET` | server-only | random, rotasi terencana, tidak pernah di bundle/log. |
| `TOKEN_ENCRYPTION_KEY` | server-only bila benar-benar diperlukan | secret manager, bukan `.env` commit. |
| `SENTRY_DSN`/telemetry public DSN | dapat public sesuai provider | filter PII/token; jangan kirim request body auth. |

JWT Maker/User bukan environment variable. Jangan baking token hasil login ke image. Secret berada di AWS Secrets Manager/SSM Parameter Store dengan IAM least privilege. File `.env` production tidak dikomit.

Validasi environment harus fail-fast saat startup/build sesuai kapan nilai digunakan. Perhatikan static build: variabel public biasanya tertanam pada artefak dan perubahan memerlukan rebuild.

## 4. EC2 baseline

- Instance dalam security group: inbound 443 dari internet/ALB; 80 hanya redirect; SSH sebaiknya via SSM Session Manager, bukan publik.
- Egress hanya yang dibutuhkan (API, package/telemetry saat runtime bila ada).
- IMDSv2 wajib; IAM instance role least privilege.
- OS patching, non-root service user, read-only artifact directory, dan log rotation.
- Nginx/ALB dengan TLS modern, compression untuk text, immutable cache untuk hashed assets, `no-store` untuk HTML/session-sensitive response.
- Node process (jika SSR) dikelola `systemd`/container orchestrator sederhana dengan restart policy terbatas dan graceful shutdown.
- Jangan menambahkan Redis, queue, atau multi-service hanya untuk frontend ini.

## 5. Security headers dan browser policy

Konfigurasi final setelah inventaris domain:

- `Strict-Transport-Security` setelah HTTPS valid dan subdomain policy dipahami;
- `Content-Security-Policy` allowlist `connect-src` API, `img-src` media, serta tanpa `unsafe-eval`; nonce/hash untuk script bila SSR;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin` atau lebih ketat;
- `Permissions-Policy` minimum;
- `frame-ancestors 'none'` atau allowlist kebutuhan melalui CSP;
- cookie BFF: `HttpOnly; Secure; SameSite=Lax/Strict`, path/domain minimal.

CORS dikontrol API backend, bukan frontend/Nginx kecuali Nginx benar-benar menjadi reverse proxy same-origin. Origin produksi harus di-allowlist; jangan menggunakan `*` bersama credentials.

## 6. Build dan release

1. Checkout commit/tag terverifikasi.
2. Install memakai lockfile (`npm ci`/padanan).
3. Lint, typecheck, unit/integration, contract fixture, production build.
4. Dependency/secret scan.
5. Buat artefak immutable dengan release SHA; jangan build di instance produksi jika dapat dihindari.
6. Deploy ke staging, smoke root frontend, assets, login, API connectivity, image, dan critical flow tenant test.
7. Deploy production rolling/blue-green sederhana bila ada load balancer; jika single instance, gunakan atomic symlink + restart dan maintenance risk terdokumentasi.
8. Verifikasi response headers, source maps, console/network errors, dan release marker.

Source map production: simpan privat untuk error monitoring atau nonaktifkan publik; verifikasi tidak berisi source/konfigurasi sensitif.

## 7. Health dan observability

Pisahkan:

- **liveness frontend**: Nginx/static index atau `/healthz` proses Node;
- **readiness frontend**: proses siap menerima request; jangan menjadikan API eksternal sebagai syarat liveness agar outage upstream tidak me-restart frontend;
- **dependency status**: API `/health` ditampilkan di dashboard operasional/server monitor, bukan dipoll semua browser.

Log akses tidak boleh merekam Authorization, cookie, query yang mengandung token, password, `app_key` sensitif-operasional, alamat lengkap, atau nomor telepon. Error telemetry redacts headers/body dan hanya menyimpan release, route template, status, request correlation ID bila tersedia.

Metrik minimum: HTTP 5xx, latency frontend server, restart, disk/memory, asset failure, JS error rate, API error rate dari client (tersanitasi), dan web vitals. Alert threshold ditentukan setelah baseline; belum dapat diklaim.

## 8. Backup, rollback, dan failure behavior

Frontend artifact immutable tidak memerlukan backup data aplikasi. Simpan beberapa release terakhir dan konfigurasi versi. Rollback adalah mengaktifkan artefak sebelumnya; **jangan rollback frontend** bila kontrak backend sudah breaking tanpa kompatibilitas. Uji rollback di staging.

Saat API unavailable, frontend tetap menyajikan shell dan error retry yang jelas; workflow kritis tidak menyatakan sukses. Cache browser tidak digunakan sebagai sumber kebenaran availability/reservasi.

## 9. Risiko integrasi deployment

- Base URL kontrak memiliki trailing `/coworking/`; URL join harus mencegah path hilang/ganda.
- Contoh `foto_url` memakai `http://localhost:3000`, menyebabkan mixed content/host salah di produksi.
- CORS dan header custom `x-maker-key` memicu preflight; backend harus mengizinkan origin, method, `Authorization`, `Content-Type`, dan `x-maker-key`.
- Upload public/ambiguous auth dapat disalahgunakan; deployment frontend tidak memperbaiki kelemahan backend.
- Belum ada SLA, resource sizing, DNS, certificate, account/region, AMI, atau scaling target; semua harus dikonfirmasi sebelum provisioning.
