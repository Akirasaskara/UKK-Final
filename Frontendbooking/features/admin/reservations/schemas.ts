import { z } from 'zod';
import { reservationStatusEnum } from '@/features/bookings/schemas';

export const adminReservationListItemSchema = z.object({
  id: z.number().int().positive(),
  kode_booking: z.string(),
  tanggal_reservasi: z.string(),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
  durasi_jam: z.number(),
  total_harga_awal: z.number(),
  potongan_diskon: z.number(),
  total_bayar: z.number(),
  status: reservationStatusEnum,
  member: z
    .object({
      id: z.number().int().positive().optional(),
      nama_member: z.string(),
      telp: z.string(),
    })
    .nullable(),
  space: z
    .object({
      id: z.number().int().positive().optional(),
      nama_space: z.string(),
      tipe: z.string(),
    })
    .nullable(),
});

export const adminReservationListSchema = z.array(adminReservationListItemSchema);

export const updateStatusResultSchema = z.object({
  id: z.number().int().positive(),
  status: reservationStatusEnum,
  updated_at: z.string(),
});

export const checkInResultSchema = z.object({
  id: z.number().int().positive(),
  status: z.literal('aktif'),
  check_in_time: z.string(),
});

export const checkOutResultSchema = z.object({
  id: z.number().int().positive(),
  status: z.literal('selesai'),
  check_out_time: z.string(),
});

export const qrVerificationResultSchema = z.object({
  id: z.number().int().positive(),
  kode_booking: z.string(),
  status: reservationStatusEnum,
  can_check_in: z.boolean(),
  member: z.object({
    nama: z.string(),
    instansi: z.string(),
    telp: z.string(),
  }),
  space: z.object({
    nama: z.string(),
    tipe: z.string(),
  }),
  jadwal: z.object({
    tanggal: z.string(),
    jam_mulai: z.string(),
    jam_selesai: z.string(),
    durasi: z.string(),
  }),
  total_dibayar: z.number(),
});

export type AdminReservationListItem = z.infer<typeof adminReservationListItemSchema>;
export type UpdateStatusResult = z.infer<typeof updateStatusResultSchema>;
export type CheckInResult = z.infer<typeof checkInResultSchema>;
export type CheckOutResult = z.infer<typeof checkOutResultSchema>;
export type QrVerificationResult = z.infer<typeof qrVerificationResultSchema>;
