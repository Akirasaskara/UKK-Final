import { z } from 'zod';

export const adminProfileSchema = z.object({
  id: z.number().int().positive(),
  nama_coworking: z.string().trim().min(1, 'Nama coworking space wajib diisi.').max(200),
  nama_pemilik: z.string().trim().min(1, 'Nama pemilik / penanggung jawab wajib diisi.').max(200),
  telp: z.string().trim().min(1, 'Nomor telepon kontak operasional wajib diisi.').max(50),
  alamat: z.string().nullable().optional(),
  deskripsi_fasilitas: z.string().nullable().optional(),
});

export const updateAdminProfileInputSchema = z.object({
  nama_coworking: z.string().trim().min(1, 'Nama coworking space wajib diisi.').max(200),
  nama_pemilik: z.string().trim().min(1, 'Nama pemilik / penanggung jawab wajib diisi.').max(200),
  telp: z.string().trim().min(1, 'Nomor telepon kontak operasional wajib diisi.').max(50),
  alamat: z.string().trim().optional().nullable(),
  deskripsi_fasilitas: z.string().trim().optional().nullable(),
});

export type AdminProfile = z.infer<typeof adminProfileSchema>;
export type UpdateAdminProfileInput = z.infer<typeof updateAdminProfileInputSchema>;
