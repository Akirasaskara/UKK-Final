import { z } from 'zod';

export const activePromotionSchema = z.object({
  id: z.number().int().positive(),
  nama_diskon: z.string(),
  persentase_diskon: z.number().min(1).max(100),
  tanggal_awal: z.string(),
  tanggal_akhir: z.string(),
});

export const activePromotionListSchema = z.array(activePromotionSchema);

export type ActivePromotion = z.infer<typeof activePromotionSchema>;
