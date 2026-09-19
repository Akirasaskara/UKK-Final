import type { MonthlyReportResult } from './schemas';

function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).trim();

  // Proteksi formula injection pada spreadsheet
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportMonthlyReportToCsv(report: MonthlyReportResult) {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthLabel = monthNames[report.month - 1] || `Bulan-${report.month}`;

  const rows: string[][] = [
    ['LAPORAN REKAPITULASI FINANSIAL & OPERASIONAL BULANAN'],
    ['Sistem', 'Smart Space Booking'],
    ['Periode', `${monthLabel} ${report.year}`],
    ['Zona Waktu', 'Asia/Jakarta (WIB)'],
    ['Waktu Unduh', new Date().toLocaleString('id-ID')],
    [''],
    ['RINGKASAN METRIK UTAMA'],
    ['Metrik', 'Nilai', 'Satuan / Keterangan'],
    ['Total Reservasi Masuk', String(report.total_transaksi), 'Transaksi'],
    ['Total Durasi Penggunaan Ruangan', String(report.total_jam_terpakai), 'Jam'],
    ['Estimasi Nilai Layanan Bruto', String(report.estimasi_pendapatan_kotor), 'IDR'],
    ['Total Potongan Kupon Diskon', String(report.total_potongan_diskon), 'IDR'],
    ['Realisasi Nilai Layanan Selesai', String(report.realisasi_pendapatan_bersih), 'IDR (Layanan Berstatus Selesai)'],
    [''],
    ['RINCIAN BERDASARKAN TIPE RUANG KERJA'],
    ['Kategori Ruang', 'Tipe Identifier', 'Total Booking', 'Total Jam', 'Total Nilai Layanan (IDR)'],
  ];

  for (const item of report.rincian_per_tipe_space) {
    rows.push([
      item.label,
      item.tipe,
      String(item.total_booking),
      String(item.total_jam),
      String(item.total_pendapatan),
    ]);
  }

  // Gabungkan ke format CSV dengan delimiter koma
  const csvContent = rows
    .map((row) => row.map(sanitizeCsvCell).join(','))
    .join('\r\n');

  // Prepend UTF-8 BOM (\uFEFF)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan-Finansial-${monthLabel}-${report.year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
