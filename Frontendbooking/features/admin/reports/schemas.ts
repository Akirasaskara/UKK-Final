import { z } from 'zod';
import { spaceTypeEnum } from '@/features/spaces/schemas';

export const reportGranularityEnum = z.enum(['day', 'week', 'month']);
export type ReportGranularity = z.infer<typeof reportGranularityEnum>;

export const reportTotalsSchema = z.object({
  total_transaksi: z.number().int().nonnegative(),
  total_jam_terpakai: z.number().int().nonnegative(),
  estimasi_pendapatan_kotor: z.number().int().nonnegative(),
  total_potongan_diskon: z.number().int().nonnegative(),
  realisasi_pendapatan_bersih: z.number().int().nonnegative(),
});

export const reportSeriesItemSchema = z.object({
  bucket_start: z.string(),
  bucket_end: z.string(),
  label: z.string(),
  total_transaksi: z.number().int().nonnegative(),
  total_jam: z.number().int().nonnegative(),
  estimasi_pendapatan_kotor: z.number().int().nonnegative(),
  total_potongan_diskon: z.number().int().nonnegative(),
  realisasi_pendapatan_bersih: z.number().int().nonnegative(),
});

export const reportTypeBreakdownItemSchema = z.object({
  tipe: spaceTypeEnum,
  label: z.string(),
  total_booking: z.number().int().nonnegative(),
  total_jam: z.number().int().nonnegative(),
  estimasi_pendapatan_bersih: z.number().int().nonnegative().optional(),
  realisasi_pendapatan_bersih: z.number().int().nonnegative(),
  total_pendapatan: z.number().int().nonnegative().optional(),
});

export const reportSummaryResultSchema = z
  .object({
    granularity: reportGranularityEnum,
    from: z.string(),
    to: z.string(),
    timezone: z.string(),
    totals: reportTotalsSchema,
    series: z.array(reportSeriesItemSchema),
    rincian_per_tipe_space: z.array(reportTypeBreakdownItemSchema),
  })
  .passthrough();

export const monthlyReportResultSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  total_transaksi: z.number().int().nonnegative(),
  total_jam_terpakai: z.number().int().nonnegative(),
  estimasi_pendapatan_kotor: z.number().int().nonnegative(),
  total_potongan_diskon: z.number().int().nonnegative(),
  realisasi_pendapatan_bersih: z.number().int().nonnegative(),
  rincian_per_tipe_space: z.array(reportTypeBreakdownItemSchema),
});

export const incomeReportResultSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  realisasi_pendapatan_bersih: z.number().int().nonnegative(),
});

export type ReportTotals = z.infer<typeof reportTotalsSchema>;
export type ReportSeriesItem = z.infer<typeof reportSeriesItemSchema>;
export type ReportSummaryResult = z.infer<typeof reportSummaryResultSchema>;
export type ReportTypeBreakdownItem = z.infer<typeof reportTypeBreakdownItemSchema>;
export type MonthlyReportResult = z.infer<typeof monthlyReportResultSchema>;
export type IncomeReportResult = z.infer<typeof incomeReportResultSchema>;
