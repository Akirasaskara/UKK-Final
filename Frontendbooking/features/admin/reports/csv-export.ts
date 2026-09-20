import type { MonthlyReportResult, ReportSummaryResult } from './schemas';

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const raw = String(value);
  const hasDangerousPrefix = /^[=+\-@\t\r]/.test(raw);
  let str = raw.trim();

  // Deteksi dilakukan sebelum trim agar prefix tab/carriage return tidak terhapus tanpa disanitasi.
  if (hasDangerousPrefix) {
    str = `'${str}`;
  }

  // Escape double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportReportSummaryToCsv(report: ReportSummaryResult) {
  const granularityLabel =
    report.granularity === 'day'
      ? 'Harian'
      : report.granularity === 'week'
        ? 'Mingguan'
        : 'Bulanan';

  const rows: string[][] = [
    [`LAPORAN REKAPITULASI FINANSIAL & OPERASIONAL (${granularityLabel.toUpperCase()})`],
    ['Sistem', 'Smart Space Booking'],
    ['Granularitas', granularityLabel],
    ['Rentang Tanggal', `${report.from} s/d ${report.to}`],
    ['Zona Waktu', 'Asia/Jakarta (WIB)'],
    ['Waktu Unduh', new Date().toLocaleString('id-ID')],
    [''],
    ['RINGKASAN METRIK UTAMA'],
    ['Metrik', 'Nilai', 'Satuan / Keterangan'],
    ['Total Reservasi Masuk', String(report.totals.total_transaksi), 'Transaksi'],
    ['Total Durasi Penggunaan Ruangan', String(report.totals.total_jam_terpakai), 'Jam'],
    ['Estimasi Nilai Layanan Bruto', String(report.totals.estimasi_pendapatan_kotor), 'IDR'],
    ['Total Potongan Kupon Diskon', String(report.totals.total_potongan_diskon), 'IDR'],
    ['Realisasi Nilai Layanan Selesai', String(report.totals.realisasi_pendapatan_bersih), 'IDR (Layanan Berstatus Selesai)'],
    [''],
    ['RINCIAN BERKALA TIME-SERIES'],
    ['Periode / Interval', 'Tanggal Awal', 'Tanggal Akhir', 'Total Transaksi', 'Total Jam', 'Estimasi Bruto (IDR)', 'Diskon (IDR)', 'Realisasi Selesai (IDR)'],
  ];

  for (const item of report.series) {
    rows.push([
      item.label,
      item.bucket_start,
      item.bucket_end,
      String(item.total_transaksi),
      String(item.total_jam),
      String(item.estimasi_pendapatan_kotor),
      String(item.total_potongan_diskon),
      String(item.realisasi_pendapatan_bersih),
    ]);
  }

  rows.push(['']);
  rows.push(['RINCIAN BERDASARKAN TIPE RUANG KERJA']);
  rows.push(['Kategori Ruang', 'Tipe Identifier', 'Total Booking', 'Total Jam', 'Estimasi Nilai Layanan (IDR)', 'Realisasi Nilai Selesai (IDR)']);

  for (const item of report.rincian_per_tipe_space) {
    rows.push([
      item.label,
      item.tipe,
      String(item.total_booking),
      String(item.total_jam),
      String(item.estimasi_pendapatan_bersih || item.total_pendapatan || 0),
      String(item.realisasi_pendapatan_bersih || 0),
    ]);
  }

  const csvContent = rows
    .map((row) => row.map(sanitizeCsvCell).join(','))
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan-Finansial-${granularityLabel}-${report.from}-sd-${report.to}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

  const csvContent = rows
    .map((row) => row.map(sanitizeCsvCell).join(','))
    .join('\r\n');

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
