'use client';

import { useState } from 'react';
import { QrCode, LogIn, ArrowRight } from 'lucide-react';
import { useVerifyTicketMutation, useCheckInMutation } from '@/features/admin/reservations/hooks';
import type { QrVerificationResult } from '@/features/admin/reservations/schemas';
import { formatReservationStatus } from '@/features/bookings/status';
import { formatIdr } from '@/lib/format/currency';
import { formatDateIndonesia } from '@/lib/format/date';
import { formatSpaceType } from '@/lib/format/space';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import Link from 'next/link';

export function CheckInPageContent() {
  const [tokenInput, setTokenInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<QrVerificationResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const verifyMutation = useVerifyTicketMutation();
  const checkInMutation = useCheckInMutation();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage(null);
    if (!tokenInput.trim()) return;

    try {
      const res = await verifyMutation.mutateAsync(tokenInput.trim());
      setVerificationResult(res);
    } catch {
      setVerificationResult(null);
    }
  }

  async function handleExecuteCheckIn() {
    if (!verificationResult) return;

    try {
      await checkInMutation.mutateAsync(verificationResult.id);
      setSuccessMessage(`Check-In berhasil untuk booking ${verificationResult.kode_booking}! Status sekarang aktif.`);
      // Update preview status lokal
      setVerificationResult((prev) => (prev ? { ...prev, status: 'aktif', can_check_in: false } : null));
    } catch {
      // Error handled by mutation
    }
  }

  const statusInfo = verificationResult ? formatReservationStatus(verificationResult.status) : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Verifikasi & Check-In Kedatangan
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Masukkan kode e-ticket atau payload QR pelanggan untuk memeriksa data sebelum mengonfirmasi kedatangan.
        </p>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleVerify} className="rounded-card border border-border-default bg-bg-surface p-6 shadow-card space-y-4">
        <FormField
          id="qr_token"
          label="Kode E-Ticket / Token QR"
          required
          helper="Contoh format: VERIFY-RESERVASI-1-BOOK-20260930-XXXXXX"
          error={verifyMutation.isError ? (verifyMutation.error instanceof Error ? verifyMutation.error.message : 'Token tidak valid') : undefined}
        >
          <div className="relative">
            <QrCode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden="true" />
            <Input
              id="qr_token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Tempel / ketik token QR di sini..."
              className="pl-10 font-mono text-xs sm:text-sm"
              required
            />
          </div>
        </FormField>

        <Button
          type="submit"
          pending={verifyMutation.isPending}
          className="w-full"
        >
          {verifyMutation.isPending ? 'Memeriksa Tiket...' : 'Verifikasi Data Tiket'}
        </Button>
      </form>

      {/* Success Notification */}
      {successMessage ? (
        <InlineAlert title="Check-In Selesai" variant="success">
          <p className="text-xs mt-1">{successMessage}</p>
        </InlineAlert>
      ) : null}

      {/* Verification Preview Result */}
      {verificationResult ? (
        <div className="rounded-card border border-border-default bg-bg-surface p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-border-default pb-4">
            <div>
              <p className="text-xs text-text-muted">Hasil Verifikasi</p>
              <p className="font-mono text-base font-bold text-text-primary">
                {verificationResult.kode_booking}
              </p>
            </div>
            {statusInfo ? (
              <span className={`rounded-badge px-3 py-1 text-xs font-semibold ${statusInfo.badgeStyle}`}>
                {statusInfo.label}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p className="text-text-muted">Nama Member</p>
              <p className="font-bold text-text-primary text-sm">{verificationResult.member.nama}</p>
              <p className="text-text-muted">{verificationResult.member.instansi}</p>
              <p className="text-text-muted">{verificationResult.member.telp}</p>
            </div>

            <div className="space-y-1">
              <p className="text-text-muted">Ruangan / Space</p>
              <p className="font-bold text-text-primary text-sm">{verificationResult.space.nama}</p>
              <p className="text-action-secondary font-medium">{formatSpaceType(verificationResult.space.tipe)}</p>
            </div>
          </div>

          <div className="rounded-control border border-border-default bg-bg-subtle p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Tanggal:</span>
              <span className="font-semibold">{formatDateIndonesia(verificationResult.jadwal.tanggal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Waktu:</span>
              <span className="font-semibold">{verificationResult.jadwal.jam_mulai} – {verificationResult.jadwal.jam_selesai} WIB ({verificationResult.jadwal.durasi})</span>
            </div>
            <div className="flex justify-between border-t border-border-default pt-1.5 font-bold">
              <span>Total Dibayar:</span>
              <span className="tabular-nums text-action-primary">{formatIdr(verificationResult.total_dibayar)}</span>
            </div>
          </div>

          {checkInMutation.isError ? (
            <InlineAlert title="Check-In Gagal" variant="danger">
              <p className="text-xs mt-1">
                {checkInMutation.error instanceof Error ? checkInMutation.error.message : 'Terjadi kendala saat check-in.'}
              </p>
            </InlineAlert>
          ) : null}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border-default">
            <Link
              href={`/admin/reservations/${verificationResult.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary"
            >
              <span>Buka Detail Lengkap</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>

            {verificationResult.can_check_in ? (
              <Button
                type="button"
                pending={checkInMutation.isPending}
                onClick={handleExecuteCheckIn}
                className="w-full sm:w-auto min-w-44"
              >
                <LogIn size={16} aria-hidden="true" />
                <span>Konfirmasi Check-In</span>
              </Button>
            ) : (
              <span className="text-xs text-text-muted italic">
                Status tidak memenuhi syarat check-in ({verificationResult.status})
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
