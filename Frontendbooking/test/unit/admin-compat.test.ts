import { describe, expect, it } from 'vitest';
import {
  normalizeMemberItem,
  normalizePaginatedEnvelope,
  normalizePromotionItem,
  normalizeSpaceItem,
} from '@/lib/server/admin-compat';
import {
  resolveReservationFromTicket,
  toQrVerificationResult,
} from '@/lib/server/qr-compat';
import { buildMonthlySummaryEnvelope } from '@/lib/server/report-compat';

function envelope(data: unknown) {
  return {
    status: true,
    statusCode: 200,
    message: 'OK',
    data,
    timestamp: '2026-09-20T00:00:00.000Z',
  };
}

describe('admin live-backend compatibility adapters', () => {
  it('wraps legacy space array into paginated contract and supplies foto_url', () => {
    const normalized = normalizePaginatedEnvelope(
      envelope([{ id: 1, nama_space: 'Desk', foto: null }]),
      1,
      20,
      normalizeSpaceItem,
    );
    expect(normalized?.data).toEqual({
      items: [{ id: 1, nama_space: 'Desk', foto: null, foto_url: null }],
      meta: { page: 1, limit: 20, total: 1, total_pages: 1 },
    });
  });

  it('normalizes member image URL and derives promotion status', () => {
    expect(normalizeMemberItem({ id: 1, foto: null })).toEqual({
      id: 1,
      foto: null,
      foto_url: null,
    });
    expect(
      normalizePromotionItem(
        {
          id: 1,
          tanggal_awal: '2026-09-01T00:00:00.000Z',
          tanggal_akhir: '2026-09-30T23:59:59.000Z',
        },
        new Date('2026-09-20T00:00:00.000Z'),
      ),
    ).toMatchObject({ status: 'active' });
  });

  it('resolves QR payload, ticket number, and booking code within owner-scoped list', () => {
    const reservations = [
      {
        id: 2,
        kode_booking: 'BOOK-20260921-AC0B5B',
        tanggal_reservasi: '2026-09-21',
        jam_mulai: '13:00',
        jam_selesai: '15:00',
        durasi_jam: 2,
        total_bayar: 204000,
        status: 'disetujui' as const,
        member: { nama_member: 'Sari', telp: '0800' },
        space: { nama_space: 'Semeru', tipe: 'meeting_room' },
      },
    ];

    expect(resolveReservationFromTicket('TICKET-MOKLET-20260921-0002', reservations)?.id).toBe(2);
    expect(resolveReservationFromTicket('BOOK-20260921-AC0B5B', reservations)?.id).toBe(2);
    expect(
      resolveReservationFromTicket(
        'VERIFY-RESERVASI-2-BOOK-20260921-AC0B5B',
        reservations,
      )?.id,
    ).toBe(2);
    expect(toQrVerificationResult(reservations[0]).can_check_in).toBe(true);
  });

  it('adapts legacy monthly report to summary contract', () => {
    const result = buildMonthlySummaryEnvelope(
      envelope({
        month: 9,
        year: 2026,
        total_transaksi: 2,
        total_jam_terpakai: 7,
        estimasi_pendapatan_kotor: 340000,
        total_potongan_diskon: 46000,
        realisasi_pendapatan_bersih: 0,
        rincian_per_tipe_space: [
          {
            tipe: 'desk',
            label: 'Personal Desk',
            total_booking: 1,
            total_jam: 4,
            total_pendapatan: 90000,
          },
        ],
      }),
      '2026-09-01',
      '2026-09-30',
    );

    expect(result?.data).toMatchObject({
      granularity: 'month',
      totals: { total_transaksi: 2 },
    });
  });
});
