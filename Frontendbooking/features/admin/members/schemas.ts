import { z } from 'zod';

export const adminMemberListItemSchema = z.object({
  id: z.number().int().positive(),
  nama_member: z.string(),
  instansi: z.string(),
  alamat: z.string(),
  telp: z.string(),
  foto: z.string().nullable().optional(),
  foto_url: z.string().nullable(),
  created_at: z.string().optional(),
});

export const adminMemberListResultSchema = z.object({
  items: z.array(adminMemberListItemSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

export const adminMemberDetailSchema = z.object({
  id: z.number().int().positive(),
  nama_member: z.string(),
  instansi: z.string(),
  alamat: z.string(),
  telp: z.string(),
  foto: z.string().nullable().optional(),
  foto_url: z.string().nullable(),
  created_at: z.string().optional(),
});

export const createMemberAssistedInputSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi.').max(100, 'Maksimal 100 karakter.'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
  nama_member: z.string().trim().min(1, 'Nama lengkap wajib diisi.').max(200, 'Maksimal 200 karakter.'),
  instansi: z.string().trim().min(1, 'Instansi wajib diisi.').max(200, 'Maksimal 200 karakter.'),
  alamat: z.string().trim().min(1, 'Alamat wajib diisi.').max(500, 'Maksimal 500 karakter.'),
  telp: z.string().trim().min(1, 'Nomor telepon wajib diisi.').max(50, 'Maksimal 50 karakter.'),
  foto: z.string().optional().nullable(),
});

export const createdMemberAssistedResultSchema = z.object({
  id: z.number().int().positive(),
  nama_member: z.string(),
  instansi: z.string(),
  alamat: z.string(),
  telp: z.string(),
  foto: z.string().nullable().optional(),
  foto_url: z.string().nullable().optional(),
});

export const memberUploadResultSchema = z.object({
  filename: z.string(),
  object_key: z.string().optional(),
  url: z.string().url(),
});

export type AdminMemberListItem = z.infer<typeof adminMemberListItemSchema>;
export type AdminMemberListResult = z.infer<typeof adminMemberListResultSchema>;
export type AdminMemberDetail = z.infer<typeof adminMemberDetailSchema>;
export type CreateMemberAssistedInput = z.infer<typeof createMemberAssistedInputSchema>;
export type CreatedMemberAssistedResult = z.infer<typeof createdMemberAssistedResultSchema>;
export type MemberUploadResult = z.infer<typeof memberUploadResultSchema>;
