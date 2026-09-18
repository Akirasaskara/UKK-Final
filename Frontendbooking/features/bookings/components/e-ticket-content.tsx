'use client';

import { Printer, ArrowLeft, QrCode as QrIcon } from 'lucide-react';
import { useBookingETicket } from '../hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PublicContainer } from '@/components/public/public-container';
import { formatIdr } from '@/lib/format/currency';
import { formatDateIndonesia } from '@/lib/format/date';
import { formatSpaceType } from '@/lib/format/space';
import Link from 'next/link';

export function ETicketContent({ bookingId }: { bookingId: number }) {
  const { data: ticket, isLoading, isError, error, refetch } = useBookingETicket(bookingId);

  if (isLoading) {
    return (
      <PublicContainer className="py-12 max-w-xl space-y-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-96 w-full rounded-card" />
      </PublicContainer>
    );
  }

  if (isError || !ticket) {
    return (
      <PublicContainer className="py-16 max-w-md mx-auto">
        <InlineAlert title="E-Ticket Tidak Tersedia" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'E-ticket belum diterbitkan atau tiket tidak sah.'}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-xs font-semibold text-text-on-brand"
            >
              Coba Lagi
            </button>
          </div>
        </InlineAlert>
      </PublicContainer>
    );
  }

  const isCancelled = ticket.status_reservasi === 'dibatalkan';

  return (
    <PublicContainer className="py-8 sm:py-12 max-w-xl space-y-6">
      {/* Top Action Header (Hidden saat Print) */}
      <div className="print:hidden flex items-center justify-between gap-4">
        <Link
          href={`/member/bookings/${bookingId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Kembali ke Detail Booking</span>
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-control bg-action-primary px-4 py-2 text-xs font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm"
        >
          <Printer size={15} aria-hidden="true" />
          <span>Cetak E-Ticket (A4)</span>
        </button>
      </div>

      {/* Ticket Paper Canvas */}
      <div className="rounded-card border-2 border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Ticket Header */}
        <div className="flex items-start justify-between border-b border-border-default pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-action-secondary">
              E-Ticket Akses Ruangan
            </p>
            <h1 className="font-display text-2xl font-bold text-text-primary mt-1">
              Smart Space Booking
            </h1>
            <p className="text-xs text-text-muted mt-0.5">{ticket.coworking_space.nama}</p>
          </div>

          <div className="text-right">
            <p className="font-mono text-xs font-bold text-text-primary">{ticket.e_ticket_number}</p>
            <span
              className={`inline-block mt-1 rounded-badge px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                isCancelled
                  ? 'bg-[var(--red-50)] text-[var(--red-700)]'
                  : 'bg-[var(--green-50)] text-[var(--green-700)]'
              }`}
            >
              {ticket.status_reservasi}
            </span>
          </div>
        </div>

        {/* QR Code Payload Area */}
        <div className="flex flex-col items-center justify-center p-6 rounded-control bg-bg-subtle border border-border-default space-y-3 text-center">
          {!isCancelled ? (
            <div className="p-3 bg-white rounded-xl border border-border-default shadow-sm">
              <QrIcon size={120} className="text-text-primary" aria-label="QR Code Kedatangan" />
            </div>
          ) : (
            <div className="p-4 rounded-control bg-[var(--red-50)] text-[var(--red-700)] text-xs font-bold">
              QR Code Dinonaktifkan (Reservasi Dibatalkan)
            </div>
          )}
          <p className="font-mono text-xs font-bold text-text-primary tracking-wider">
            {ticket.kode_booking}
          </p>
          <p className="text-[11px] text-text-muted max-w-xs leading-relaxed">
            Tunjukkan kode QR ini kepada staf resepsionis atau pengelola coworking space saat tiba di lokasi untuk verifikasi check-in.
          </p>
        </div>

        {/* Member & Space Facts */}
        <div className="grid grid-cols-2 gap-4 text-xs border-b border-border-default pb-4">
          <div className="space-y-1">
            <p className="text-text-muted">Nama Member</p>
            <p className="font-semibold text-text-primary">{ticket.member.nama}</p>
            <p className="text-text-muted">{ticket.member.instansi}</p>
          </div>
          <div className="space-y-1">
            <p className="text-text-muted">Ruangan / Space</p>
            <p className="font-semibold text-text-primary">{ticket.space.nama}</p>
            <p className="text-action-secondary font-medium">{formatSpaceType(ticket.space.tipe)}</p>
          </div>
        </div>

        {/* Schedule Facts */}
        <div className="space-y-2 text-xs border-b border-border-default pb-4">
          <div className="flex justify-between">
            <span className="text-text-muted">Tanggal:</span>
            <span className="font-semibold">{formatDateIndonesia(ticket.jadwal.tanggal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Waktu Penggunaan:</span>
            <span className="font-semibold">{ticket.jadwal.jam_mulai} – {ticket.jadwal.jam_selesai} WIB ({ticket.jadwal.durasi})</span>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-text-muted">
            <span>Tarif Kotor:</span>
            <span className="tabular-nums">{formatIdr(ticket.rincian_pembayaran.tarif_kotor)}</span>
          </div>
          {ticket.rincian_pembayaran.potongan > 0 ? (
            <div className="flex justify-between text-status-success-text font-medium">
              <span>Potongan Diskon ({ticket.rincian_pembayaran.diskon_promo}):</span>
              <span className="tabular-nums">- {formatIdr(ticket.rincian_pembayaran.potongan)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-sm font-bold text-text-primary border-t border-border-default pt-2">
            <span>Total Pembayaran:</span>
            <span className="tabular-nums text-action-primary text-base">
              {formatIdr(ticket.rincian_pembayaran.total_dibayar)}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-text-muted text-center leading-relaxed border-t border-border-default pt-3">
          E-ticket ini adalah bukti sah reservasi ruang kerja Smart Space Booking. Simpan dan tunjukkan nomor tiket apabila QR code tidak dapat dipindai.
        </p>
      </div>
    </PublicContainer>
  );
}
