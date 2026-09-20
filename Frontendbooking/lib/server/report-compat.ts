import { z } from 'zod';
import { parseSuccessEnvelope } from './admin-compat';

const legacyMonthlyReportSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  total_transaksi: z.number().int().nonnegative(),
  total_jam_terpakai: z.number().int().nonnegative(),
  estimasi_pendapatan_kotor: z.number().int().nonnegative(),
  total_potongan_diskon: z.number().int().nonnegative(),
  realisasi_pendapatan_bersih: z.number().int().nonnegative(),
  rincian_per_tipe_space: z.array(z.object({
    tipe: z.enum(['desk', 'meeting_room', 'private_office']),
    label: z.string(),
    total_booking: z.number().int().nonnegative(),
    total_jam: z.number().int().nonnegative(),
    total_pendapatan: z.number().int().nonnegative(),
  })),
});

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des',
];

export function buildMonthlySummaryEnvelope(
  monthlyBody: unknown,
  from: string,
  to: string,
) {
  const envelope = parseSuccessEnvelope(monthlyBody);
  if (!envelope) return null;
  const parsed = legacyMonthlyReportSchema.safeParse(envelope.data);
  if (!parsed.success) return null;

  const report = parsed.data;
  const label = `${MONTH_SHORT[report.month - 1]} ${report.year}`;
  const typeItems = report.rincian_per_tipe_space.map((item) => ({
    tipe: item.tipe,
    label: item.label,
    total_booking: item.total_booking,
    total_jam: item.total_jam,
    estimasi_pendapatan_bersih: item.total_pendapatan ?? 0,
    realisasi_pendapatan_bersih: item.total_pendapatan ?? 0,
  }));

  return {
    ...envelope,
    message: 'Laporan bulanan dimuat melalui adapter backend kompatibilitas.',
    data: {
      granularity: 'month' as const,
      from,
      to,
      timezone: 'Asia/Jakarta',
      totals: {
        total_transaksi: report.total_transaksi,
        total_jam_terpakai: report.total_jam_terpakai,
        estimasi_pendapatan_kotor: report.estimasi_pendapatan_kotor,
        total_potongan_diskon: report.total_potongan_diskon,
        realisasi_pendapatan_bersih: report.realisasi_pendapatan_bersih,
      },
      series: [
        {
          bucket_start: from,
          bucket_end: to,
          label,
          total_transaksi: report.total_transaksi,
          total_jam: report.total_jam_terpakai,
          estimasi_pendapatan_kotor: report.estimasi_pendapatan_kotor,
          total_potongan_diskon: report.total_potongan_diskon,
          realisasi_pendapatan_bersih: report.realisasi_pendapatan_bersih,
        },
      ],
      rincian_per_tipe_space: typeItems,
    },
  };
}

export function monthFromRange(from: string, to: string): { month: number; year: number } | null {
  const fromMatch = /^(\d{4})-(\d{2})-\d{2}$/.exec(from);
  const toMatch = /^(\d{4})-(\d{2})-\d{2}$/.exec(to);
  if (!fromMatch || !toMatch) return null;
  if (fromMatch[1] !== toMatch[1] || fromMatch[2] !== toMatch[2]) return null;
  const month = Number(fromMatch[2]);
  const year = Number(fromMatch[1]);
  if (month < 1 || month > 12) return null;
  return { month, year };
}
