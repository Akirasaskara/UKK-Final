import { z } from 'zod';

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} wajib diisi.`);

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

export const roleSchema = z.enum(['member', 'admin_space']);

export const memberProfileSchema = z.object({
  id: z.number(),
  nama_member: z.string(),
  instansi: z.string(),
  alamat: z.string(),
  telp: z.string(),
  foto: z.string().nullable(),
});

export const spaceOwnerProfileSchema = z.object({
  id: z.number(),
  nama_coworking: z.string(),
  nama_pemilik: z.string(),
  telp: z.string(),
  alamat: z.string().nullable().optional(),
  deskripsi_fasilitas: z.string().nullable().optional(),
});

export const authProfileSchema = z
  .object({
    id: z.number(),
    username: z.string(),
    role: roleSchema,
    member: memberProfileSchema.nullable().optional(),
    space_owner: spaceOwnerProfileSchema.nullable().optional(),
  })
  .passthrough();

export const upstreamAuthDataSchema = authProfileSchema
  .extend({
    access_token: z.string().min(1),
  })
  .passthrough();

export const loginSchema = z.object({
  username: requiredText('Username'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

export const registerMemberSchema = z.object({
  username: requiredText('Username'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
  nama_member: requiredText('Nama lengkap'),
  instansi: requiredText('Instansi'),
  alamat: requiredText('Alamat'),
  telp: requiredText('Nomor telepon'),
  foto: optionalText,
});

export const registerAdminSchema = z.object({
  username: requiredText('Username'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
  nama_coworking: requiredText('Nama coworking'),
  nama_pemilik: requiredText('Nama pemilik'),
  telp: requiredText('Nomor telepon'),
  alamat: optionalText,
  deskripsi_fasilitas: optionalText,
});

export type AuthProfile = z.infer<typeof authProfileSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterMemberInput = z.infer<typeof registerMemberSchema>;
export type RegisterAdminInput = z.infer<typeof registerAdminSchema>;
