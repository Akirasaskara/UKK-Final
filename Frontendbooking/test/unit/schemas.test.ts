import { describe, expect, it } from 'vitest';
import { createBookingInputSchema, memberHistorySchema } from '@/features/bookings/schemas';
import { reportSummaryResultSchema } from '@/features/admin/reports/schemas';

const validReport = {
  granularity: 'day',
  from: '2026-09-01',
  to: '2026-09-02',
  timezone: 'Asia/Jakarta',
  totals: {
    total_transaksi: 1,
    total_jam_terpakai: 2,
    estimasi_pendapatan_kotor: 100000,
    total_potongan_diskon: 10000,
    realisasi_pendapatan_bersih: 90000,
  },
  series: [
    {
      bucket_start: '2026-09-01',
      bucket_end: '2026-09-01',
      label: '01 Sep',
      total_transaksi: 1,
      total_jam: 2,
      estimasi_pendapatan_kotor: 100000,
      total_potongan_diskon: 10000,
      realisasi_pendapatan_bersih: 90000,
    },
  ],
  rincian_per_tipe_space: [
    {
      tipe: 'desk',
      label: 'Personal Desk',
      total_booking: 1,
      total_jam: 2,
      estimasi_pendapatan_bersih: 90000,
      realisasi_pendapatan_bersih: 90000,
    },
  ],
};

describe('frontend contracts', () => {
  it('accepts a valid bounded report summary', () => {
    expect(reportSummaryResultSchema.parse(validReport)).toEqual(validReport);
  });

  it('rejects negative financial values', () => {
    const result = reportSummaryResultSchema.safeParse({
      ...validReport,
      totals: { ...validReport.totals, realisasi_pendapatan_bersih: -1 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown report granularity', () => {
    const result = reportSummaryResultSchema.safeParse({ ...validReport, granularity: 'quarter' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid booking duration and malformed time', () => {
    expect(createBookingInputSchema.safeParse({
      id_space: 1,
      tanggal_reservasi: '2026-09-20',
      jam_mulai: '24:30',
      durasi_jam: 13,
    }).success).toBe(false);
  });

  it('rejects malformed history totals', () => {
    expect(memberHistorySchema.safeParse({
      month: 9,
      year: 2026,
      total_reservasi: -1,
      total_pengeluaran: 0,
      items: [],
    }).success).toBe(false);
  });
});
