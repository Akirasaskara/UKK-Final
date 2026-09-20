import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { getSeedReferenceDate, formatDateString } from './seed-helpers.js';
import { getSeedData } from './seed-data.js';

function formatRupiah(num: bigint | number): string {
  return `Rp${new Intl.NumberFormat('id-ID').format(Number(num))}`;
}

async function generatePdf() {
  const referenceDate = getSeedReferenceDate(process.env.SEED_REFERENCE_DATE);
  const refDateStr = formatDateString(referenceDate);
  const data = getSeedData(referenceDate);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 45, right: 45 },
    bufferPages: true,
  });

  const outputDir = path.resolve(process.cwd(), '../');
  const outputPath = path.join(outputDir, 'Laporan-Seeder-Smart-Space-Booking.pdf');
  const docsOutputPath = path.resolve(process.cwd(), 'docs/Laporan-Seeder-Smart-Space-Booking.pdf');

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // ==========================================
  // HALAMAN 1: Header Eksekutif & Akun Pengguna
  // ==========================================
  
  // Header Brand
  doc.rect(45, 40, 505, 55).fill('#123B3F');
  doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('SMART SPACE BOOKING', 60, 52);
  doc.fontSize(10).font('Helvetica').text('Laporan Data Master, Fixture Seeder & Kredensial Uji Coba UKK', 60, 72);

  doc.moveDown(3);

  // Metadata Ringkasan
  doc.fillColor('#123B3F').fontSize(12).font('Helvetica-Bold').text('1. Metadata & Ringkasan Database Fixture', 45, 115);
  doc.rect(45, 132, 505, 1).fill('#B89A55');

  doc.fillColor('#333333').fontSize(9).font('Helvetica');
  doc.text(`Waktu Referensi Data: ${refDateStr} (Zona Waktu Asia/Jakarta · WIB)`, 45, 142);
  doc.text(`Default Password Akun: MokletSuperSecret123! (Tersimpan sebagai hash Argon2id)`, 45, 156);
  doc.text(`Total Entitas: 2 Coworking Space | 5 Member Global | 11 Ruangan | 9 Kupon Diskon | 10 Reservasi`, 45, 170);

  // Tabel 1.1: Akun Admin Space (Pengelola Coworking)
  doc.fillColor('#123B3F').fontSize(11).font('Helvetica-Bold').text('1.1. Akun Admin Space (Pengelola Coworking)', 45, 195);
  
  let y = 212;
  doc.rect(45, y, 505, 20).fill('#F4F6F6');
  doc.fillColor('#123B3F').fontSize(8.5).font('Helvetica-Bold');
  doc.text('Username', 55, y + 6);
  doc.text('Nama Coworking', 160, y + 6);
  doc.text('Pemilik / Kontak', 320, y + 6);
  doc.text('Scope Inventaris', 440, y + 6);

  y += 20;
  for (const o of data.owners) {
    doc.rect(45, y, 505, 30).stroke('#E2E8F0');
    doc.fillColor('#123B3F').fontSize(8.5).font('Helvetica-Bold').text(o.user.username, 55, y + 6);
    doc.fillColor('#333333').fontSize(8).font('Helvetica').text(o.owner.namaCoworking, 160, y + 6);
    doc.text(`${o.owner.namaPemilik} (${o.owner.telp})`, 320, y + 6, { width: 115 });
    doc.text(o.key === 'nusa' ? '6 Space + 1 Archive' : '4 Space Aktif', 440, y + 6);
    y += 30;
  }

  // Tabel 1.2: Akun Member Global & Skenario Uji
  y += 15;
  doc.fillColor('#123B3F').fontSize(11).font('Helvetica-Bold').text('1.2. Akun Member Global & Skenario Uji Coba', 45, y);
  
  y += 17;
  doc.rect(45, y, 505, 20).fill('#F4F6F6');
  doc.fillColor('#123B3F').fontSize(8.5).font('Helvetica-Bold');
  doc.text('Username', 55, y + 6);
  doc.text('Nama Lengkap', 150, y + 6);
  doc.text('Instansi / Perusahaan', 260, y + 6);
  doc.text('Skenario Uji Coba', 390, y + 6);

  y += 20;
  const memberScenarios: Record<string, string> = {
    seed_member_andi: 'Booking Aktif (Hari ini) & E-Ticket QR',
    seed_member_sari: 'Booking Dibatalkan & Antrean Pending',
    seed_member_bima: 'Booking di Owner B (Isolasi Multi-Tenant)',
    seed_member_dewi: 'Booking Lintas Owner A dan B',
    seed_member_assisted: 'Assisted Reg (Belum pernah booking)',
  };

  for (const m of data.members) {
    doc.rect(45, y, 505, 26).stroke('#E2E8F0');
    doc.fillColor('#123B3F').fontSize(8.5).font('Helvetica-Bold').text(m.username, 55, y + 5);
    doc.fillColor('#333333').fontSize(8).font('Helvetica').text(m.namaMember, 150, y + 5);
    doc.text(m.instansi, 260, y + 5, { width: 120 });
    doc.fillColor('#B89A55').fontSize(7.5).font('Helvetica-Bold').text(memberScenarios[m.username] || '-', 390, y + 5, { width: 150 });
    y += 26;
  }

  // ==========================================
  // HALAMAN 2: Katalog Inventaris Ruang Kerja
  // ==========================================
  doc.addPage();
  
  doc.fillColor('#123B3F').fontSize(12).font('Helvetica-Bold').text('2. Katalog Inventaris Ruang Kerja (11 Workspaces)', 45, 45);
  doc.rect(45, 60, 505, 1).fill('#B89A55');

  y = 75;
  doc.rect(45, y, 505, 20).fill('#F4F6F6');
  doc.fillColor('#123B3F').fontSize(8.5).font('Helvetica-Bold');
  doc.text('Nama Ruangan', 55, y + 6);
  doc.text('Pengelola', 180, y + 6);
  doc.text('Tipe', 290, y + 6);
  doc.text('Kapasitas', 365, y + 6);
  doc.text('Tarif / Jam', 440, y + 6);

  y += 20;
  const allSpaces = [
    ...data.nusaSpaces.map((s) => ({ ...s, ownerName: 'Nusa Workhub' })),
    ...data.arunikaSpaces.map((s) => ({ ...s, ownerName: 'Arunika Batu' })),
  ];

  for (const s of allSpaces) {
    doc.rect(45, y, 505, 38).stroke('#E2E8F0');
    doc.fillColor('#123B3F').fontSize(8.5).font('Helvetica-Bold').text(s.namaSpace, 55, y + 5);
    doc.fillColor('#666666').fontSize(7.5).font('Helvetica').text(s.deskripsi, 55, y + 16, { width: 220, height: 18 });

    doc.fillColor('#333333').fontSize(8).font('Helvetica').text(s.ownerName, 180, y + 5);
    doc.text(s.tipe.replace('_', ' ').toUpperCase(), 290, y + 5);
    doc.text(`${s.kapasitas} Orang`, 365, y + 5);
    doc.fillColor('#123B3F').fontSize(8.5).font('Helvetica-Bold').text(formatRupiah(s.hargaPerJam), 440, y + 5);

    if (s.archivedOffsetDays) {
      doc.fillColor('#E53E3E').fontSize(7).font('Helvetica-Bold').text('[NONAKTIF / ARCHIVED]', 440, y + 17);
    }
    y += 38;
  }

  // ==========================================
  // HALAMAN 3: Kupon Diskon & Matriks Reservasi
  // ==========================================
  doc.addPage();

  doc.fillColor('#123B3F').fontSize(12).font('Helvetica-Bold').text('3. Kupon Promosi & Matriks Transaksi Reservasi', 45, 45);
  doc.rect(45, 60, 505, 1).fill('#B89A55');

  // 3.1 Kupon Diskon
  doc.fillColor('#123B3F').fontSize(10).font('Helvetica-Bold').text('3.1. Daftar Kupon Diskon (9 Promosi)', 45, 75);
  
  y = 92;
  doc.rect(45, y, 505, 18).fill('#F4F6F6');
  doc.fillColor('#123B3F').fontSize(8).font('Helvetica-Bold');
  doc.text('Kode Promo', 55, y + 5);
  doc.text('Pengelola', 145, y + 5);
  doc.text('Potongan', 240, y + 5);
  doc.text('Rentang Hari Aktif', 320, y + 5);
  doc.text('Status Server', 430, y + 5);

  y += 18;
  const allDiscounts = [
    ...data.nusaDiscounts.map((d) => ({ ...d, owner: 'Nusa Workhub' })),
    ...data.arunikaDiscounts.map((d) => ({ ...d, owner: 'Arunika Batu' })),
  ];

  for (const d of allDiscounts) {
    doc.rect(45, y, 505, 20).stroke('#E2E8F0');
    doc.fillColor('#123B3F').fontSize(8).font('Helvetica-Bold').text(d.namaDiskon, 55, y + 5);
    doc.fillColor('#333333').fontSize(8).font('Helvetica').text(d.owner, 145, y + 5);
    doc.text(`${d.persentaseDiskon}%`, 240, y + 5);
    doc.text(`Offset H${d.startOffsetDays >= 0 ? '+' : ''}${d.startOffsetDays} s/d H+${d.endOffsetDays}`, 320, y + 5);
    
    let statusColor = '#2B6CB0';
    let statusText = 'AKTIF';
    if (d.startOffsetDays > 0) {
      statusColor = '#D69E2E';
      statusText = 'UPCOMING';
    } else if (d.endOffsetDays < 0) {
      statusColor = '#E53E3E';
      statusText = 'EXPIRED';
    }
    doc.fillColor(statusColor).fontSize(7.5).font('Helvetica-Bold').text(statusText, 430, y + 5);
    y += 20;
  }

  // 3.2 Matriks Reservasi
  y += 15;
  doc.fillColor('#123B3F').fontSize(10).font('Helvetica-Bold').text('3.2. Matriks 10 Reservasi & Snapshot Finansial', 45, y);

  y += 17;
  doc.rect(45, y, 505, 18).fill('#F4F6F6');
  doc.fillColor('#123B3F').fontSize(8).font('Helvetica-Bold');
  doc.text('Kode Booking', 55, y + 5);
  doc.text('Member', 170, y + 5);
  doc.text('Ruangan', 240, y + 5);
  doc.text('Jadwal', 345, y + 5);
  doc.text('Status', 430, y + 5);
  doc.text('Total', 485, y + 5);

  y += 18;
  for (const r of data.reservations) {
    doc.rect(45, y, 505, 23).stroke('#E2E8F0');
    doc.fillColor('#123B3F').fontSize(7.5).font('Helvetica-Bold').text(r.kodeBooking, 55, y + 4);
    doc.fillColor('#333333').fontSize(7.5).font('Helvetica').text(r.memberUsername.replace('seed_member_', ''), 170, y + 4);
    doc.text(r.spaceName, 240, y + 4, { width: 100 });
    doc.text(`${r.jamMulai}–${r.jamSelesai} (${r.durasiJam}h)`, 345, y + 4);
    
    let stColor = '#3182CE';
    if (r.status === 'aktif') stColor = '#38A169';
    if (r.status === 'selesai') stColor = '#123B3F';
    if (r.status === 'dibatalkan') stColor = '#E53E3E';
    if (r.status === 'belum_dikonfirm') stColor = '#DD6B20';

    doc.fillColor(stColor).fontSize(7.5).font('Helvetica-Bold').text(r.status.toUpperCase(), 430, y + 4);
    doc.fillColor('#333333').fontSize(7.5).font('Helvetica').text(r.discountCode ? 'Diskon' : 'Normal', 485, y + 4);
    y += 23;
  }

  // Footer & Page Numbers
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.fillColor('#999999').fontSize(8).font('Helvetica').text(
      `Smart Space Booking — Halaman ${i + 1} dari ${totalPages}`,
      45,
      doc.page.height - 35,
      { align: 'center', width: 505 }
    );
  }

  doc.end();

  await new Promise<void>((resolve) => {
    stream.on('finish', () => {
      // Salin juga ke folder docs jika folder docs ada
      if (fs.existsSync(path.dirname(docsOutputPath))) {
        fs.copyFileSync(outputPath, docsOutputPath);
      }
      console.log(`\n📄 Berkas PDF berhasil dibuat di:`);
      console.log(`1. ${outputPath}`);
      console.log(`2. ${docsOutputPath}\n`);
      resolve();
    });
  });
}

generatePdf().catch(console.error);