import { z } from 'zod';

export const promotionStatusEnum = z.enum(['upcoming', 'active', 'expired']);

export const adminPromotionSummarySchema = z.object({
  id: z.number().int().positive(),
  nama_diskon: z.string(),
  persentase_diskon: z.number().min(1).max(100),
  tanggal_awal: z.string(),
  tanggal_akhir: z.string(),
  status: promotionStatusEnum,
  version: z.number().int().nonnegative().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const adminPromotionListResultSchema = z.object({
  items: z.array(adminPromotionSummarySchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
  context: z
    .object({
      server_now: z.string().optional(),
      business_timezone: z.string().optional(),
    })
    .optional(),
});

export const adminPromotionDetailSchema = z.object({
  id: z.number().int().positive(),
  nama_diskon: z.string(),
  persentase_diskon: z.number().min(1).max(100),
  tanggal_awal: z.string(),
  tanggal_akhir: z.string(),
  status: promotionStatusEnum,
  version: z.number().int().nonnegative(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const adminPromotionMutationResultSchema = z.object({
  id: z.number().int().positive(),
  nama_diskon: z.string(),
  persentase_diskon: z.number().min(1).max(100),
  tanggal_awal: z.string(),
  tanggal_akhir: z.string(),
  status: promotionStatusEnum.optional(),
  version: z.number().int().nonnegative().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const archivePromotionResultSchema = z.object({
  id: z.number().int().positive(),
  deleted: z.literal(true),
});

export const promotionFormInputSchema = z
  .object({
    nama_diskon: z
      .string()
      .trim()
      .min(1, 'Kode promo wajib diisi.')
      .max(100, 'Maksimal 100 karakter.')
      .regex(/^[A-Za-z0-9_-]+$/, 'Kode promo hanya boleh berisi huruf, angka, garis bawah (_), atau tanda hubung (-).'),
    persentase_diskon: z
      .number()
      .int('Persentase harus berupa bilangan bulat.')
      .min(1, 'Diskon minimal 1%.')
      .max(100, 'Diskon maksimal 100%.'),
    tanggal_awal: z.string().min(1, 'Tanggal mulai berlaku wajib diisi.'),
    tanggal_akhir: z.string().min(1, 'Tanggal kedaluwarsa wajib diisi.'),
    expected_version: z.number().int().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.tanggal_awal).getTime();
      const end = new Date(data.tanggal_akhir).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) return false;
      return end >= start;
    },
    {
      message: 'Tanggal akhir harus sama atau setelah tanggal mulai berlaku.',
      path: ['tanggal_akhir'],
    },
  );

export type PromotionStatus = z.infer<typeof promotionStatusEnum>;
export type AdminPromotionSummary = z.infer<typeof adminPromotionSummarySchema>;
export type AdminPromotionListResult = z.infer<typeof adminPromotionListResultSchema>;
export type AdminPromotionDetail = z.infer<typeof adminPromotionDetailSchema>;
export type AdminPromotionMutationResult = z.infer<typeof adminPromotionMutationResultSchema>;
export type ArchivePromotionResult = z.infer<typeof archivePromotionResultSchema>;
export type PromotionFormInput = z.infer<typeof promotionFormInputSchema>;
