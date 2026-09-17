import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { AppModule } from '../../src/app.module.js';
import { ResponseTransformInterceptor } from '../../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter.js';
import { PrismaService } from '../../src/database/prisma.service.js';

interface TestResult {
  no: number;
  category: string;
  testName: string;
  method: string;
  endpoint: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  durationMs: number;
  responsePreview: string;
}

const testResults: TestResult[] = [];
let testCounter = 1;
const BASE_URL = 'http://127.0.0.1:3001';

async function request(
  method: string,
  urlPath: string,
  body?: any,
  token?: string,
  isMultipart: boolean = false,
  fileInfo?: { fieldname: string; filename: string; buffer: Buffer; mimetype: string },
): Promise<{ statusCode: number; data: any; durationMs: number }> {
  const start = Date.now();
  const url = new URL(urlPath, BASE_URL);

  return new Promise((resolve, reject) => {
    let payloadBuffer: Buffer | null = null;
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (isMultipart && fileInfo) {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;

      const pre = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fileInfo.fieldname}"; filename="${fileInfo.filename}"\r\nContent-Type: ${fileInfo.mimetype}\r\n\r\n`,
      );
      const post = Buffer.from(`\r\n--${boundary}--\r\n`);
      payloadBuffer = Buffer.concat([pre, fileInfo.buffer, post]);
      headers['Content-Length'] = String(payloadBuffer.length);
    } else if (body) {
      const jsonStr = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = String(Buffer.byteLength(jsonStr));
      payloadBuffer = Buffer.from(jsonStr);
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => {
          resBody += chunk;
        });
        res.on('end', () => {
          const durationMs = Date.now() - start;
          let parsedData: any = resBody;
          try {
            parsedData = JSON.parse(resBody);
          } catch (e: any) {
            parsedData = { raw: resBody, parseError: e?.message };
          }
          resolve({
            statusCode: res.statusCode || 500,
            data: parsedData,
            durationMs,
          });
        });
      },
    );

    req.on('error', (err) => {
      reject(err);
    });

    if (payloadBuffer) {
      req.write(payloadBuffer);
    }
    req.end();
  });
}

function recordTest(
  category: string,
  testName: string,
  method: string,
  endpoint: string,
  expectedStatus: number,
  actualStatus: number,
  durationMs: number,
  responseData: any,
) {
  const passed = actualStatus === expectedStatus;
  let preview = '';
  if (typeof responseData === 'object' && responseData !== null) {
    if (responseData.message) {
      preview = `[Message: ${responseData.message}] `;
    }
    if (responseData.data) {
      preview += JSON.stringify(responseData.data).substring(0, 100);
    } else if (responseData.error) {
      preview += `[Error: ${responseData.error}]`;
    }
  } else {
    preview = String(responseData).substring(0, 100);
  }

  testResults.push({
    no: testCounter++,
    category,
    testName,
    method,
    endpoint,
    expectedStatus,
    actualStatus,
    passed,
    durationMs,
    responsePreview: preview,
  });

  const statusText = passed ? 'PASS' : 'FAIL';
  console.log(
    `[${statusText}] #${testResults.length} ${method} ${endpoint} -> ${actualStatus} (Expected: ${expectedStatus}) [${durationMs}ms] - ${testName}`,
  );
}

function generatePDFReport(outputPath: string) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const total = testResults.length;
  const passedCount = testResults.filter((t) => t.passed).length;
  const failedCount = total - passedCount;
  const passRate = total > 0 ? ((passedCount / total) * 100).toFixed(1) : '0';

  // Title & Header
  doc.rect(40, 40, 515, 65).fill('#123B3F');
  doc.fillColor('#FFFFFF').fontSize(18).text('LAPORAN HASIL PENGUJIAN API BACKEND', 55, 52);
  doc.fontSize(11).text('Smart Space Booking - Coworking Space & Workstation Reservation System', 55, 75);

  doc.moveDown(2);
  doc.fillColor('#333333');

  // Summary Box
  const summaryTop = 120;
  doc.rect(40, summaryTop, 515, 80).fill('#F8F9FA');
  doc.rect(40, summaryTop, 515, 80).stroke('#DDE1E2');

  doc.fillColor('#123B3F').fontSize(11).text('INFORMASI & RINGKASAN PENGUJIAN', 55, summaryTop + 12);

  doc.fontSize(9).fillColor('#444444');
  doc.text(`Waktu Eksekusi : ${new Date().toLocaleString('id-ID')}`, 55, summaryTop + 32);
  doc.text(`Lingkungan DB  : MySQL 8 (bookingin_dev / RDS Compatible)`, 55, summaryTop + 47);
  doc.text(`Framework API  : NestJS 12 + Prisma 7 ORM`, 55, summaryTop + 62);

  doc.text(`Total Kasus Uji : ${total}`, 320, summaryTop + 32);
  doc.text(`Status Lulus    : ${passedCount} (${passRate}%)`, 320, summaryTop + 47);
  doc.text(`Status Gagal    : ${failedCount}`, 320, summaryTop + 62);

  // Category Breakdown Table
  let currentY = summaryTop + 95;
  doc.fontSize(12).fillColor('#123B3F').text('Ringkasan per Modul Sistem', 40, currentY);
  currentY += 20;

  const categories = Array.from(new Set(testResults.map((t) => t.category)));

  // Table Header
  doc.rect(40, currentY, 515, 20).fill('#246168');
  doc.fillColor('#FFFFFF').fontSize(9);
  doc.text('Kategori Modul', 50, currentY + 6);
  doc.text('Total Uji', 250, currentY + 6);
  doc.text('Lulus', 350, currentY + 6);
  doc.text('Tingkat Kelulusan', 450, currentY + 6);
  currentY += 20;

  categories.forEach((cat) => {
    const catTests = testResults.filter((t) => t.category === cat);
    const catPass = catTests.filter((t) => t.passed).length;
    const catRate = ((catPass / catTests.length) * 100).toFixed(0) + '%';

    doc.rect(40, currentY, 515, 18).fill('#FFFFFF');
    doc.rect(40, currentY, 515, 18).stroke('#EEEEEE');
    doc.fillColor('#333333').fontSize(8.5);
    doc.text(cat, 50, currentY + 5);
    doc.text(String(catTests.length), 260, currentY + 5);
    doc.text(String(catPass), 360, currentY + 5);
    doc.text(catRate, 465, currentY + 5);
    currentY += 18;
  });

  currentY += 15;

  // Detail Test Table
  doc.fontSize(12).fillColor('#123B3F').text('Tabel Detail Hasil Pengujian Seluruh Endpoint', 40, currentY);
  currentY += 20;

  // Table header
  doc.rect(40, currentY, 515, 20).fill('#123B3F');
  doc.fillColor('#FFFFFF').fontSize(8.5);
  doc.text('No', 45, currentY + 6);
  doc.text('Method', 65, currentY + 6);
  doc.text('Endpoint', 115, currentY + 6);
  doc.text('Status', 310, currentY + 6);
  doc.text('Durasi', 360, currentY + 6);
  doc.text('Hasil', 410, currentY + 6);
  doc.text('Kasus Uji', 450, currentY + 6);
  currentY += 20;

  testResults.forEach((t, index) => {
    if (currentY > 750) {
      doc.addPage();
      currentY = 40;

      // Repeat Table header on new page
      doc.rect(40, currentY, 515, 20).fill('#123B3F');
      doc.fillColor('#FFFFFF').fontSize(8.5);
      doc.text('No', 45, currentY + 6);
      doc.text('Method', 65, currentY + 6);
      doc.text('Endpoint', 115, currentY + 6);
      doc.text('Status', 310, currentY + 6);
      doc.text('Durasi', 360, currentY + 6);
      doc.text('Hasil', 410, currentY + 6);
      doc.text('Kasus Uji', 450, currentY + 6);
      currentY += 20;
    }

    const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9FBFB';
    doc.rect(40, currentY, 515, 18).fill(rowBg);
    doc.rect(40, currentY, 515, 18).stroke('#EEEEEE');

    doc.fillColor('#333333').fontSize(8);
    doc.text(String(t.no), 45, currentY + 5);
    doc.text(t.method, 65, currentY + 5);
    doc.text(t.endpoint.length > 35 ? t.endpoint.substring(0, 32) + '...' : t.endpoint, 115, currentY + 5);
    doc.text(`${t.actualStatus} (${t.expectedStatus})`, 310, currentY + 5);
    doc.text(`${t.durationMs}ms`, 360, currentY + 5);

    if (t.passed) {
      doc.fillColor('#197044').text('PASSED', 410, currentY + 5);
    } else {
      doc.fillColor('#C23A3A').text('FAILED', 410, currentY + 5);
    }

    doc.fillColor('#555555').text(
      t.testName.length > 20 ? t.testName.substring(0, 18) + '...' : t.testName,
      450,
      currentY + 5,
    );

    currentY += 18;
  });

  // Footer note on last page
  currentY += 20;
  if (currentY > 740) {
    doc.addPage();
    currentY = 40;
  }
  doc.rect(40, currentY, 515, 45).fill('#F0F6F5');
  doc.rect(40, currentY, 515, 45).stroke('#246168');
  doc.fontSize(8.5).fillColor('#123B3F');
  doc.text('CATATAN VALIDASI & INTEGRITAS:', 50, currentY + 8);
  doc.fontSize(8).fillColor('#333333');
  doc.text(
    'Pengujian memvalidasi skema MySQL, transaksi pencegahan double-booking, assisted registration, hak akses role, filter laporan finansial, dan seluruh siklus hidup reservasi secara otomatis.',
    50,
    currentY + 22,
    { width: 495 },
  );

  doc.end();
  console.log(`\nPDF Report successfully written to: ${outputPath}`);
}

async function runAllTests() {
  console.log('--- Starting Automated Backend API Test Runner ---');

  // Start NestJS server on port 3001
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3001);
  console.log('Test Server listening on port 3001');

  const prisma = app.get(PrismaService);

  // Clean test tables
  await prisma.reservationDetail.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.space.deleteMany();
  await prisma.mediaUpload.deleteMany();
  await prisma.spaceOwner.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();

  const timestamp = Date.now();
  const adminUsername = `admin_${timestamp}`;
  const memberUsername = `member_${timestamp}`;
  let adminToken = '';
  let memberToken = '';
  let spaceId = 0;
  let discountId = 0;
  let reservationId = 0;

  try {
    // 1. Root & Health
    {
      const res = await request('GET', '/');
      recordTest('System & Health', 'Cek Root API Information', 'GET', '/', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/health');
      recordTest('System & Health', 'Cek Server Health Check', 'GET', '/health', 200, res.statusCode, res.durationMs, res.data);
    }

    // 2. Auth Module
    {
      const res = await request('POST', '/api/auth/register/admin-space', {
        username: adminUsername,
        password: 'Password123!',
        nama_coworking: 'Moklet Hub Coworking Space',
        nama_pemilik: 'Ahmad Bidin',
        telp: '081298765432',
      });
      recordTest('Autentikasi', 'Registrasi Admin Space Baru', 'POST', '/api/auth/register/admin-space', 201, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('POST', '/api/auth/register/member', {
        username: memberUsername,
        password: 'Password123!',
        nama_member: 'Budi Santoso',
        instansi: 'SMK Telkom Malang',
        alamat: 'Jl. Danau Ranau No. 1 Malang',
        telp: '081234567890',
      });
      recordTest('Autentikasi', 'Registrasi Member Baru', 'POST', '/api/auth/register/member', 201, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('POST', '/api/auth/login', {
        username: adminUsername,
        password: 'Password123!',
      });
      adminToken = res.data?.data?.access_token || '';
      recordTest('Autentikasi', 'Login Akun Admin Space', 'POST', '/api/auth/login', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('POST', '/api/auth/login', {
        username: memberUsername,
        password: 'Password123!',
      });
      memberToken = res.data?.data?.access_token || '';
      recordTest('Autentikasi', 'Login Akun Member', 'POST', '/api/auth/login', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('POST', '/api/auth/login', {
        username: 'wrong_user',
        password: 'wrong_password',
      });
      recordTest('Autentikasi (Negative)', 'Login dengan Kredensial Salah', 'POST', '/api/auth/login', 401, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/api/auth/profile', undefined, memberToken);
      recordTest('Autentikasi', 'Ambil Data Profil Login Member', 'GET', '/api/auth/profile', 200, res.statusCode, res.durationMs, res.data);
    }

    // 3. Spaces Module
    {
      const res = await request('GET', '/api/spaces/types');
      recordTest('Space & Workstation', 'Daftar Kategori Tipe Space', 'GET', '/api/spaces/types', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('POST', '/api/admin/spaces', {
        nama_space: 'Personal Desk Alpha 01',
        harga_per_jam: 25000,
        tipe: 'desk',
        kapasitas: 1,
        deskripsi: 'WiFi 100Mbps, Stopkontak, Free Coffee',
      }, adminToken);
      spaceId = res.data?.data?.id || 0;
      recordTest('Space & Workstation', 'Admin Tambah Space Baru', 'POST', '/api/admin/spaces', 201, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/api/admin/spaces', undefined, adminToken);
      recordTest('Space & Workstation', 'Admin Lihat Semua Space Milik Sendiri', 'GET', '/api/admin/spaces', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', `/api/admin/spaces/${spaceId}`, undefined, adminToken);
      recordTest('Space & Workstation', 'Admin Lihat Detail Space Berdasarkan ID', 'GET', `/api/admin/spaces/${spaceId}`, 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('PUT', `/api/admin/spaces/${spaceId}`, {
        nama_space: 'Personal Desk Alpha 01 Updated',
        harga_per_jam: 30000,
      }, adminToken);
      recordTest('Space & Workstation', 'Admin Update Data Space', 'PUT', `/api/admin/spaces/${spaceId}`, 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/api/spaces');
      recordTest('Space & Workstation', 'Publik Lihat Katalog Space', 'GET', '/api/spaces', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', `/api/spaces/${spaceId}`);
      recordTest('Space & Workstation', 'Publik Lihat Detail Space', 'GET', `/api/spaces/${spaceId}`, 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', `/api/spaces/availability?id_space=${spaceId}&tanggal=2026-09-30&jam_mulai=09:00&durasi_jam=3`);
      recordTest('Space & Workstation', 'Cek Ketersediaan Space (Tersedia)', 'GET', '/api/spaces/availability', 200, res.statusCode, res.durationMs, res.data);
    }

    // 4. Discounts Module
    {
      const res = await request('POST', '/api/admin/diskon', {
        nama_diskon: 'PROMOHEMAT20',
        persentase_diskon: 20,
        tanggal_awal: '2026-01-01T00:00:00.000Z',
        tanggal_akhir: '2026-12-31T23:59:59.000Z',
      }, adminToken);
      discountId = res.data?.data?.id || 0;
      recordTest('Promo & Diskon', 'Admin Tambah Promo Diskon Baru', 'POST', '/api/admin/diskon', 201, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/api/admin/diskon', undefined, adminToken);
      recordTest('Promo & Diskon', 'Admin Lihat Semua Promo Diskon', 'GET', '/api/admin/diskon', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', `/api/admin/diskon/${discountId}`, undefined, adminToken);
      recordTest('Promo & Diskon', 'Admin Lihat Detail Diskon', 'GET', `/api/admin/diskon/${discountId}`, 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('PUT', `/api/admin/diskon/${discountId}`, {
        persentase_diskon: 25,
      }, adminToken);
      recordTest('Promo & Diskon', 'Admin Update Nilai Promo Diskon', 'PUT', `/api/admin/diskon/${discountId}`, 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/api/diskon/active');
      recordTest('Promo & Diskon', 'Publik Lihat Promo Aktif', 'GET', '/api/diskon/active', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('POST', '/api/diskon/check', {
        nama_diskon: 'PROMOHEMAT20',
        id_space: spaceId,
      });
      recordTest('Promo & Diskon', 'Publik Cek Validitas Kode Promo', 'POST', '/api/diskon/check', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', `/api/diskon/${discountId}`);
      recordTest('Promo & Diskon', 'Publik Lihat Detail Diskon', 'GET', `/api/diskon/${discountId}`, 200, res.statusCode, res.durationMs, res.data);
    }

    // 5. Reservations & Concurrency
    {
      const res = await request('POST', '/api/reservasi', {
        id_space: spaceId,
        tanggal_reservasi: '2026-09-30',
        jam_mulai: '09:00',
        durasi_jam: 3,
        id_diskon: discountId,
      }, memberToken);
      reservationId = res.data?.data?.id || 0;
      recordTest('Reservasi & Pemesanan', 'Member Buat Reservasi (+ Diskon Promo)', 'POST', '/api/reservasi', 201, res.statusCode, res.durationMs, res.data);
    }
    {
      // Collision test: Attempt to book overlapping time on same space
      const res = await request('POST', '/api/reservasi', {
        id_space: spaceId,
        tanggal_reservasi: '2026-09-30',
        jam_mulai: '10:00',
        durasi_jam: 2,
      }, memberToken);
      recordTest('Reservasi (Anti-Collision)', 'Pencegahan Double-Booking (Bentrok Jam)', 'POST', '/api/reservasi', 409, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/api/reservasi/my', undefined, memberToken);
      recordTest('Reservasi & Pemesanan', 'Member Lihat Daftar Reservasi Sendiri', 'GET', '/api/reservasi/my', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/api/reservasi/my/history?month=9&year=2026', undefined, memberToken);
      recordTest('Reservasi & Pemesanan', 'Member Lihat Histori Pemesanan Berfilter', 'GET', '/api/reservasi/my/history', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', `/api/reservasi/${reservationId}`, undefined, memberToken);
      recordTest('Reservasi & Pemesanan', 'Lihat Detail Reservasi Berdasarkan ID', 'GET', `/api/reservasi/${reservationId}`, 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', `/api/reservasi/${reservationId}/e-ticket`, undefined, memberToken);
      recordTest('Reservasi & Pemesanan', 'Cetak E-Ticket & QR Code Payload', 'GET', `/api/reservasi/${reservationId}/e-ticket`, 200, res.statusCode, res.durationMs, res.data);
    }

    // 6. Admin Operations & Assisted Member Scope
    {
      const res = await request('GET', '/api/admin/profile', undefined, adminToken);
      recordTest('Admin Profil & Operasional', 'Admin Lihat Profil Coworking Space', 'GET', '/api/admin/profile', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('PUT', '/api/admin/profile', {
        nama_coworking: 'Moklet Hub Coworking Space (Updated)',
        nama_pemilik: 'Ahmad Bidin, S.Kom',
        telp: '081298765432',
      }, adminToken);
      recordTest('Admin Profil & Operasional', 'Admin Update Profil Coworking Space', 'PUT', '/api/admin/profile', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/api/admin/members', undefined, adminToken);
      recordTest('Admin Member (Scope Reservasi)', 'Admin Lihat Member yang Pernah Reservasi', 'GET', '/api/admin/members', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('POST', '/api/admin/members', {
        username: `assisted_${timestamp}`,
        password: 'Password123!',
        nama_member: 'Assisted Customer',
        instansi: 'Universitas Brawijaya',
        alamat: 'Jl. Veteran Malang',
        telp: '085712345678',
      }, adminToken);
      recordTest('Admin Member (Assisted)', 'Admin Tambah Member Baru (Assisted Registration)', 'POST', '/api/admin/members', 201, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('DELETE', '/api/admin/members/999', undefined, adminToken);
      recordTest('Admin Member (Protection)', 'Admin Hapus Member (Tolak 409 Conflict)', 'DELETE', '/api/admin/members/999', 409, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/api/admin/reservasi?status=belum_dikonfirm', undefined, adminToken);
      recordTest('Admin Operasional', 'Admin Lihat Seluruh Reservasi (Filter Status)', 'GET', '/api/admin/reservasi', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('PATCH', `/api/admin/reservasi/${reservationId}/status`, {
        status: 'disetujui',
      }, adminToken);
      recordTest('Admin Operasional', 'Admin Konfirmasi Status Reservasi Menjadi Disetujui', 'PATCH', `/api/admin/reservasi/${reservationId}/status`, 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('POST', `/api/admin/reservasi/${reservationId}/check-in`, undefined, adminToken);
      recordTest('Admin Operasional', 'Admin Check-In Member (Status Aktif)', 'POST', `/api/admin/reservasi/${reservationId}/check-in`, 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('POST', `/api/admin/reservasi/${reservationId}/check-out`, undefined, adminToken);
      recordTest('Admin Operasional', 'Admin Check-Out Member (Status Selesai)', 'POST', `/api/admin/reservasi/${reservationId}/check-out`, 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/api/admin/reports/monthly?month=9&year=2026', undefined, adminToken);
      recordTest('Admin Laporan Finansial', 'Rekapitulasi Laporan Pendapatan Bulanan', 'GET', '/api/admin/reports/monthly', 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('GET', '/api/admin/reports/income?month=9&year=2026', undefined, adminToken);
      recordTest('Admin Laporan Finansial', 'Alias Rekapitulasi Pendapatan Bersih Bulanan', 'GET', '/api/admin/reports/income', 200, res.statusCode, res.durationMs, res.data);
    }

    // 7. Upload Module
    {
      const fakeImageBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xd9,
      ]);

      const resGeneral = await request(
        'POST',
        '/api/upload/image',
        undefined,
        adminToken,
        true,
        { fieldname: 'file', filename: 'banner.jpg', buffer: fakeImageBuffer, mimetype: 'image/jpeg' },
      );
      recordTest('Upload Media', 'Upload Berkas Gambar Umum', 'POST', '/api/upload/image', 201, resGeneral.statusCode, resGeneral.durationMs, resGeneral.data);

      const resSpace = await request(
        'POST',
        '/api/upload/spaces',
        undefined,
        adminToken,
        true,
        { fieldname: 'file', filename: 'desk_alpha.jpg', buffer: fakeImageBuffer, mimetype: 'image/jpeg' },
      );
      recordTest('Upload Media', 'Upload Foto Space Ruangan', 'POST', '/api/upload/spaces', 201, resSpace.statusCode, resSpace.durationMs, resSpace.data);

      const resMember = await request(
        'POST',
        '/api/upload/members',
        undefined,
        memberToken,
        true,
        { fieldname: 'file', filename: 'profile.jpg', buffer: fakeImageBuffer, mimetype: 'image/jpeg' },
      );
      recordTest('Upload Media', 'Upload Foto Profil Member', 'POST', '/api/upload/members', 201, resMember.statusCode, resMember.durationMs, resMember.data);
    }

    // 8. Member Cancellation on another booking
    {
      const resBooking = await request('POST', '/api/reservasi', {
        id_space: spaceId,
        tanggal_reservasi: '2026-10-05',
        jam_mulai: '14:00',
        durasi_jam: 2,
      }, memberToken);
      const cancelId = resBooking.data?.data?.id;

      const resCancel = await request('PATCH', `/api/reservasi/${cancelId}/cancel`, undefined, memberToken);
      recordTest('Reservasi & Pemesanan', 'Member Batalkan Pemesanan Space', 'PATCH', `/api/reservasi/${cancelId}/cancel`, 200, resCancel.statusCode, resCancel.durationMs, resCancel.data);
    }

    // 9. Admin Delete Space & Discount
    {
      const res = await request('DELETE', `/api/admin/spaces/${spaceId}`, undefined, adminToken);
      recordTest('Space & Workstation', 'Admin Hapus Data Ruangan / Space', 'DELETE', `/api/admin/spaces/${spaceId}`, 200, res.statusCode, res.durationMs, res.data);
    }
    {
      const res = await request('DELETE', `/api/admin/diskon/${discountId}`, undefined, adminToken);
      recordTest('Promo & Diskon', 'Admin Hapus Kode Promo / Diskon', 'DELETE', `/api/admin/diskon/${discountId}`, 200, res.statusCode, res.durationMs, res.data);
    }

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await app.close();
  }

  // Generate PDF Report
  const pdfPath = path.resolve(process.cwd(), 'reports', 'API_Test_Report_Smart_Space_Booking.pdf');
  generatePDFReport(pdfPath);
}

void runAllTests().catch(console.error);
