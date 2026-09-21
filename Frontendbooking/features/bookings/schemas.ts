import { z } from 'zod';

export const reservationStatusEnum = z.enum([
  'belum_dikonfirm',
  'disetujui',
  'aktif',
  'selesai',
  'dibatalkan',
]);

export type ReservationStatus = z.infer<typeof reservationStatusEnum>;

export const createBookingInputSchema = z.object({
  id_space: z.number().int().positive(),
  tanggal_reservasi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.'),
  jam_mulai: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam mulai harus HH:mm.'),
  durasi_jam: z.number().int().min(1, 'Durasi minimal 1 jam.').max(12, 'Durasi maksimal 12 jam.'),
  id_diskon: z.number().int().positive().optional(),
  kode_promo: z.string().trim().optional(),
});

export const createdBookingResultSchema = z.object({
  id: z.number().int().positive(),
  kode_booking: z.string(),
  id_member: z.number().int().positive(),
  id_space: z.number().int().positive(),
  id_diskon: z.number().nullish(),
  tanggal_reservasi: z.string(),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
  durasi_jam: z.number(),
  harga_per_jam: z.number(),
  total_harga_awal: z.number(),
  potongan_diskon: z.number(),
  total_bayar: z.number(),
  status: reservationStatusEnum,
  created_at: z.string(),
});

export const memberBookingSummarySchema = z.object({
  id: z.number().int().positive(),
  kode_booking: z.string(),
  tanggal_reservasi: z.string(),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
  durasi_jam: z.number(),
  total_bayar: z.number(),
  status: reservationStatusEnum,
  space: z
    .object({
      id: z.number().int().positive(),
      nama_space: z.string(),
      tipe: z.string(),
    })
    .nullish(),
});

export const memberBookingListSchema = z.array(memberBookingSummarySchema);

export const memberHistoryItemSchema = z.object({
  id: z.number().int().positive(),
  kode_booking: z.string(),
  tanggal_reservasi: z.string(),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
  durasi_jam: z.number().int().positive(),
  total_bayar: z.number().nonnegative(),
  status: reservationStatusEnum,
  space_name: z.string(),
});

export const memberHistorySchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  total_reservasi: z.number().int().nonnegative(),
  total_pengeluaran: z.number().nonnegative(),
  items: z.array(memberHistoryItemSchema),
});

export const bookingDetailSchema = z.object({
  id: z.number().int().positive(),
  kode_booking: z.string(),
  id_member: z.number().int().positive(),
  id_space: z.number().int().positive(),
  tanggal_reservasi: z.string(),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
  durasi_jam: z.number(),
  total_bayar: z.number(),
  status: reservationStatusEnum,
  member: z
    .object({
      nama_member: z.string(),
      telp: z.string(),
    })
    .nullish(),
  space: z
    .object({
      nama_space: z.string(),
      harga_per_jam: z.number(),
    })
    .nullish(),
});

export const eTicketSchema = z.object({
  e_ticket_number: z.string(),
  kode_booking: z.string(),
  coworking_space: z.object({
    nama: z.string(),
    telepon: z.string(),
  }),
  member: z.object({
    nama: z.string(),
    instansi: z.string(),
    telp: z.string(),
  }),
  space: z.object({
    nama: z.string(),
    tipe: z.string(),
    harga_per_jam: z.number(),
  }),
  jadwal: z.object({
    tanggal: z.string(),
    jam_mulai: z.string(),
    jam_selesai: z.string(),
    durasi: z.string(),
  }),
  rincian_pembayaran: z.object({
    tarif_kotor: z.number(),
    diskon_promo: z.string(),
    potongan: z.number(),
    total_dibayar: z.number(),
  }),
  status_reservasi: z.string(),
  qr_code_payload: z.string(),
});

export const cancelBookingResultSchema = z.object({
  id: z.number().int().positive(),
  status: z.literal('dibatalkan'),
  updated_at: z.string(),
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;
export type CreatedBookingResult = z.infer<typeof createdBookingResultSchema>;
export type MemberBookingSummary = z.infer<typeof memberBookingSummarySchema>;
export type MemberHistoryItem = z.infer<typeof memberHistoryItemSchema>;
export type MemberHistory = z.infer<typeof memberHistorySchema>;
export type BookingDetail = z.infer<typeof bookingDetailSchema>;
export type ETicketData = z.infer<typeof eTicketSchema>;
export type CancelBookingResult = z.infer<typeof cancelBookingResultSchema>;
