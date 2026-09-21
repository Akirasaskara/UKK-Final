import { z } from 'zod';
import { parseSuccessEnvelope } from './admin-compat';

const statusSchema = z.enum([
  'belum_dikonfirm',
  'disetujui',
  'aktif',
  'selesai',
  'dibatalkan',
]);

const reservationSchema = z.object({
  id: z.number().int().positive(),
  kode_booking: z.string(),
  tanggal_reservasi: z.string(),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
  durasi_jam: z.number(),
  total_bayar: z.number(),
  status: statusSchema,
  member: z.object({ nama_member: z.string() }).nullish(),
  space: z.object({ nama_space: z.string() }).nullish(),
});

function unwrapItems(body: unknown): unknown[] | null {
  const envelope = parseSuccessEnvelope(body);
  if (!envelope) return null;
  if (Array.isArray(envelope.data)) return envelope.data;
  if (
    envelope.data &&
    typeof envelope.data === 'object' &&
    Array.isArray((envelope.data as { items?: unknown }).items)
  ) {
    return (envelope.data as { items: unknown[] }).items;
  }
  return null;
}

export function buildDashboardEnvelope(
  reservationBody: unknown,
  spaceBody: unknown,
  memberBody: unknown,
  today: string,
) {
  const reservationsRaw = unwrapItems(reservationBody);
  const spacesRaw = unwrapItems(spaceBody);
  const membersRaw = unwrapItems(memberBody);
  if (!reservationsRaw || !spacesRaw || !membersRaw) return null;

  const reservations = z.array(reservationSchema).safeParse(reservationsRaw);
  if (!reservations.success) return null;

  const toItem = (item: z.infer<typeof reservationSchema>) => ({
    id: item.id,
    kode_booking: item.kode_booking,
    tanggal_reservasi: item.tanggal_reservasi,
    jam_mulai: item.jam_mulai,
    jam_selesai: item.jam_selesai,
    durasi_jam: item.durasi_jam,
    total_bayar: item.total_bayar,
    status: item.status,
    member_name: item.member?.nama_member ?? 'Member',
    space_name: item.space?.nama_space ?? 'Space',
  });

  const pending = reservations.data
    .filter((item) => item.status === 'belum_dikonfirm')
    .slice(0, 5)
    .map(toItem);
  const todayReservations = reservations.data
    .filter((item) => item.tanggal_reservasi === today)
    .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai))
    .slice(0, 5)
    .map(toItem);

  return {
    status: true,
    statusCode: 200,
    message: 'Ringkasan dashboard berhasil dimuat melalui adapter kompatibilitas.',
    data: {
      metrics: {
        pending_reservations: reservations.data.filter(
          (item) => item.status === 'belum_dikonfirm',
        ).length,
        active_reservations: reservations.data.filter((item) => item.status === 'aktif').length,
        active_spaces: spacesRaw.length,
        total_members: membersRaw.length,
      },
      pending_queue: pending,
      today_reservations: todayReservations,
    },
    timestamp: new Date().toISOString(),
  };
}
