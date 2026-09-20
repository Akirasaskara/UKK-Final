import { z } from 'zod';

const reservationStatusSchema = z.enum([
  'belum_dikonfirm',
  'disetujui',
  'aktif',
  'selesai',
  'dibatalkan',
]);

const reservationItemSchema = z.object({
  id: z.number().int().positive(),
  kode_booking: z.string(),
  tanggal_reservasi: z.string(),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
  durasi_jam: z.number().int().positive(),
  total_bayar: z.number().nonnegative(),
  status: reservationStatusSchema,
  member: z.object({
    nama_member: z.string(),
    telp: z.string(),
    instansi: z.string().optional(),
  }).nullable(),
  space: z.object({
    nama_space: z.string(),
    tipe: z.string(),
  }).nullable(),
});

export type AdminReservationCompatItem = z.infer<typeof reservationItemSchema>;

export function parseAdminReservationList(body: unknown): AdminReservationCompatItem[] | null {
  if (!body || typeof body !== 'object') return null;
  const data = (body as { data?: unknown }).data;
  const items = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)
      ? (data as { items: unknown[] }).items
      : null;
  if (!items) return null;

  const parsed = z.array(reservationItemSchema).safeParse(items);
  return parsed.success ? parsed.data : null;
}

export function resolveReservationFromTicket(
  rawValue: string,
  reservations: AdminReservationCompatItem[],
): AdminReservationCompatItem | null {
  const value = rawValue.trim();

  const verifyMatch = /^VERIFY-RESERVASI-(\d+)-(.+)$/i.exec(value);
  if (verifyMatch) {
    const id = Number(verifyMatch[1]);
    const code = verifyMatch[2];
    return reservations.find((item) => item.id === id && item.kode_booking === code) ?? null;
  }

  const ticketMatch = /^TICKET-MOKLET-\d{8}-(\d+)$/i.exec(value);
  if (ticketMatch) {
    const id = Number(ticketMatch[1]);
    return reservations.find((item) => item.id === id) ?? null;
  }

  if (/^BOOK-/i.test(value)) {
    return reservations.find((item) => item.kode_booking === value) ?? null;
  }

  return null;
}

export function toQrVerificationResult(item: AdminReservationCompatItem) {
  return {
    id: item.id,
    kode_booking: item.kode_booking,
    status: item.status,
    can_check_in: item.status === 'disetujui',
    member: {
      nama: item.member?.nama_member ?? 'Member',
      instansi: item.member?.instansi ?? 'Tidak tersedia',
      telp: item.member?.telp ?? 'Tidak tersedia',
    },
    space: {
      nama: item.space?.nama_space ?? 'Space',
      tipe: item.space?.tipe ?? 'desk',
    },
    jadwal: {
      tanggal: item.tanggal_reservasi,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      durasi: `${item.durasi_jam} Jam`,
    },
    total_dibayar: item.total_bayar,
  };
}
