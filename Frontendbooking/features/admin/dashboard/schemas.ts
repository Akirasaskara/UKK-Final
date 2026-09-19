import { z } from 'zod';
import { reservationStatusEnum } from '@/features/bookings/schemas';

export const dashboardMetricsSchema = z.object({
  pending_reservations: z.number().int().nonnegative(),
  active_reservations: z.number().int().nonnegative(),
  active_spaces: z.number().int().nonnegative(),
  total_members: z.number().int().nonnegative(),
});

export const dashboardQueueItemSchema = z.object({
  id: z.number().int().positive(),
  kode_booking: z.string(),
  tanggal_reservasi: z.string(),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
  durasi_jam: z.number(),
  total_bayar: z.number(),
  status: reservationStatusEnum,
  member_name: z.string(),
  space_name: z.string(),
});

export const dashboardSummarySchema = z.object({
  metrics: dashboardMetricsSchema,
  pending_queue: z.array(dashboardQueueItemSchema),
  today_reservations: z.array(dashboardQueueItemSchema),
});

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;
export type DashboardQueueItem = z.infer<typeof dashboardQueueItemSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
