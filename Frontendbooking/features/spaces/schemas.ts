import { z } from 'zod';

export const spaceTypeEnum = z.enum(['desk', 'meeting_room', 'private_office']);

export const spaceTypeItemSchema = z.object({
  tipe: spaceTypeEnum,
  label: z.string(),
  deskripsi: z.string(),
});

export const spaceOwnerSummarySchema = z.object({
  id: z.number(),
  nama_coworking: z.string(),
  nama_pemilik: z.string().optional(),
  telp: z.string().optional(),
});

export const publicSpaceSchema = z.object({
  id: z.number().int().positive(),
  nama_space: z.string(),
  harga_per_jam: z.number().int().nonnegative(),
  tipe: spaceTypeEnum,
  kapasitas: z.number().int().positive(),
  foto: z.string().nullable(),
  deskripsi: z.string(),
  id_owner: z.number().int().positive(),
  owner: spaceOwnerSummarySchema.nullable(),
  foto_url: z.string().nullable(),
});

export const publicSpaceListSchema = z.array(publicSpaceSchema);
export const spaceTypeListSchema = z.array(spaceTypeItemSchema);

export const availabilityQuerySchema = z.object({
  id_space: z.number().int().positive(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.'),
  jam_mulai: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam mulai harus HH:mm (24 jam).'),
  durasi_jam: z.number().int().min(1, 'Durasi minimal 1 jam.').max(12, 'Durasi maksimal 12 jam per booking.'),
});

export const availabilityResultSchema = z.object({
  available: z.literal(true),
  id_space: z.number().int().positive(),
  nama_space: z.string(),
  tanggal: z.string(),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
  durasi_jam: z.number(),
  harga_per_jam: z.number(),
  estimasi_total: z.number(),
});

export type SpaceTypeItem = z.infer<typeof spaceTypeItemSchema>;
export type PublicSpace = z.infer<typeof publicSpaceSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type AvailabilityResult = z.infer<typeof availabilityResultSchema>;
