import { z } from 'zod';
import { spaceTypeEnum } from '@/features/spaces/schemas';

export const adminSpaceSummarySchema = z.object({
  id: z.number().int().positive(),
  nama_space: z.string(),
  harga_per_jam: z.number().int().nonnegative(),
  tipe: spaceTypeEnum,
  kapasitas: z.number().int().positive(),
  deskripsi: z.string().optional(),
  foto: z.string().nullable().optional(),
  foto_url: z.string().nullable(),
  version: z.number().int().nonnegative().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const adminSpaceListResultSchema = z.object({
  items: z.array(adminSpaceSummarySchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

export const adminSpaceDetailSchema = z.object({
  id: z.number().int().positive(),
  nama_space: z.string(),
  harga_per_jam: z.number().int().nonnegative(),
  tipe: spaceTypeEnum,
  kapasitas: z.number().int().positive(),
  deskripsi: z.string(),
  foto: z.string().nullable(),
  foto_url: z.string().nullable(),
  version: z.number().int().nonnegative(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const adminSpaceMutationResultSchema = z.object({
  id: z.number().int().positive(),
  nama_space: z.string(),
  harga_per_jam: z.number().int().nonnegative(),
  tipe: spaceTypeEnum,
  kapasitas: z.number().int().positive(),
  deskripsi: z.string(),
  foto: z.string().nullable().optional(),
  foto_url: z.string().nullable().optional(),
  id_owner: z.number().int().positive().optional(),
  version: z.number().int().nonnegative().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const archiveSpaceResultSchema = z.object({
  id: z.number().int().positive(),
  deleted: z.literal(true),
});

export const spaceUploadResultSchema = z.object({
  filename: z.string(),
  object_key: z.string().optional(),
  url: z.string().url(),
});

export const spaceFormInputSchema = z.object({
  nama_space: z.string().trim().min(1, 'Nama space wajib diisi.').max(200, 'Maksimal 200 karakter.'),
  harga_per_jam: z.number().int('Harga harus berupa bilangan bulat.').min(0, 'Harga tidak boleh negatif.'),
  tipe: spaceTypeEnum,
  kapasitas: z.number().int('Kapasitas harus bilangan bulat.').min(1, 'Kapasitas minimal 1 orang.'),
  deskripsi: z.string().trim().min(1, 'Deskripsi fasilitas wajib diisi.').max(4000, 'Maksimal 4000 karakter.'),
  foto: z.string().optional().nullable(),
  expected_version: z.number().int().optional(),
});

export type AdminSpaceSummary = z.infer<typeof adminSpaceSummarySchema>;
export type AdminSpaceListResult = z.infer<typeof adminSpaceListResultSchema>;
export type AdminSpaceDetail = z.infer<typeof adminSpaceDetailSchema>;
export type AdminSpaceMutationResult = z.infer<typeof adminSpaceMutationResultSchema>;
export type ArchiveSpaceResult = z.infer<typeof archiveSpaceResultSchema>;
export type SpaceUploadResult = z.infer<typeof spaceUploadResultSchema>;
export type SpaceFormInput = z.infer<typeof spaceFormInputSchema>;
