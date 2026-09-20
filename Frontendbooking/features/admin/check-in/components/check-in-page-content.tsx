'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useVerifyTicketMutation, useCheckInMutation } from '@/features/admin/reservations/hooks';
import type { QrVerificationResult } from '@/features/admin/reservations/schemas';
import { formatReservationStatus } from '@/features/bookings/status';
import { formatIdr } from '@/lib/format/currency';
import { formatDateIndonesia } from '@/lib/format/date';
import { formatSpaceType } from '@/lib/format/space';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { QrCameraScanner } from './qr-camera-scanner';

type EntryMode = 'camera' | 'manual';

export function CheckInPageContent() {
  const [entryMode, setEntryMode] = useState<EntryMode>('camera');
  const [tokenInput, setTokenInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<QrVerificationResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const verifyMutation = useVerifyTicketMutation();
  const checkInMutation = useCheckInMutation();

  const verifyToken = useCallback(async (rawToken: string) => {
    const token = rawToken.trim();
    if (!token || verifyMutation.isPending) return;

    setSuccessMessage(null);
    setVerificationResult(null);
    try {
      const result = await verifyMutation.mutateAsync(token);
      setTokenInput(token);
      setVerificationResult(result);
    } catch {
      setVerificationResult(null);
    }
  }, [verifyMutation]);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    await verifyToken(tokenInput);
  }

  async function handleExecuteCheckIn() {
    if (!verificationResult || !verificationResult.can_check_in) return;

    try {
      await checkInMutation.mutateAsync(verificationResult.id);
      setSuccessMessage(`Check-in berhasil untuk booking ${verificationResult.kode_booking}. Status reservasi sekarang aktif.`);
      setVerificationResult((previous) =>
        previous ? { ...previous, status: 'aktif', can_check_in: false } : null,
      );
    } catch {
      return;
    }
  }

  function useManualInput() {
    setEntryMode('manual');
    window.setTimeout(() => document.getElementById('qr_token')?.focus(), 0);
  }

  function resetForNextTicket() {
    verifyMutation.reset();
    checkInMutation.reset();
    setTokenInput('');
    setVerificationResult(null);
    setSuccessMessage(null);
    setEntryMode('camera');
  }

  const statusInfo = verificationResult
    ? formatReservationStatus(verificationResult.status)
    : null;

  return (
    <div className="max-w-3xl space-y-7">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold text-action-secondary">Operasional kedatangan</p>
        <h1 className="mt-2 font-display text-3xl leading-tight text-text-primary sm:text-4xl">
          Verifikasi dan check-in
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
          Pindai QR atau masukkan token tiket. Data reservasi selalu ditampilkan sebelum check-in dikonfirmasi.
        </p>
      </header>

      <div className="flex border-b border-border-default" role="tablist" aria-label="Metode verifikasi tiket">
        <button
          type="button"
          role="tab"
          aria-selected={entryMode === 'camera'}
          aria-controls="camera-panel"
          id="camera-tab"
          onClick={() => setEntryMode('camera')}
          className={`min-h-11 border-b-2 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] ${
            entryMode === 'camera'
              ? 'border-action-primary text-action-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Pindai kamera
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={entryMode === 'manual'}
          aria-controls="manual-panel"
          id="manual-tab"
          onClick={useManualInput}
          className={`min-h-11 border-b-2 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] ${
            entryMode === 'manual'
              ? 'border-action-primary text-action-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Input manual
        </button>
      </div>

      {entryMode === 'camera' ? (
        <div id="camera-panel" role="tabpanel" aria-labelledby="camera-tab">
          <QrCameraScanner
            disabled={verifyMutation.isPending || checkInMutation.isPending || verificationResult !== null}
            onDetected={verifyToken}
            onUseManual={useManualInput}
            key={verificationResult || verifyMutation.isError ? 'camera-result' : 'camera-ready'}
          />
        </div>
      ) : (
        <div id="manual-panel" role="tabpanel" aria-labelledby="manual-tab">
          <form onSubmit={handleVerify} className="rounded-card border border-border-default bg-bg-surface p-5 sm:p-6">
            <FormField
              id="qr_token"
              label="Token QR atau kode e-ticket"
              required
              helper="Terima payload QR VERIFY-RESERVASI-*, nomor TICKET-MOKLET-*, atau kode BOOK-*"
              error={verifyMutation.isError
                ? verifyMutation.error instanceof Error
                  ? verifyMutation.error.message
                  : 'Token tidak valid.'
                : undefined}
            >
              <Input
                id="qr_token"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="Tempel atau ketik token tiket"
                className="font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
                aria-describedby={verifyMutation.isError ? 'qr_token-error' : 'qr_token-helper'}
                required
              />
            </FormField>

            <Button type="submit" pending={verifyMutation.isPending} className="mt-5 w-full sm:w-auto">
              {verifyMutation.isPending ? 'Memeriksa tiket…' : 'Verifikasi tiket'}
            </Button>
          </form>
        </div>
      )}

      {verifyMutation.isPending ? (
        <p role="status" className="text-sm text-text-secondary">
          Memeriksa tiket pada coworking space Anda…
        </p>
      ) : null}

      {verifyMutation.isError && entryMode === 'camera' ? (
        <InlineAlert title="Tiket tidak dapat diverifikasi" variant="danger">
          <p>{verifyMutation.error instanceof Error ? verifyMutation.error.message : 'Token QR tidak valid.'}</p>
          <button
            type="button"
            onClick={useManualInput}
            className="mt-3 min-h-11 rounded-control border border-status-danger-text px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          >
            Periksa melalui input manual
          </button>
        </InlineAlert>
      ) : null}

      {successMessage ? (
        <InlineAlert title="Check-in selesai" variant="success">
          <p>{successMessage}</p>
          <button
            type="button"
            onClick={resetForNextTicket}
            className="mt-3 min-h-11 rounded-control border border-status-success-text px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          >
            Pindai tiket lain
          </button>
        </InlineAlert>
      ) : null}

      {verificationResult ? (
        <section aria-labelledby="verification-result-title" className="rounded-card border border-border-default bg-bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-border-default pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p id="verification-result-title" className="text-xs font-semibold text-text-muted">Hasil verifikasi</p>
              <p className="mt-1 break-all font-mono text-base font-bold text-text-primary">
                {verificationResult.kode_booking}
              </p>
            </div>
            {statusInfo ? (
              <span className={`self-start rounded-badge px-3 py-1 text-xs font-semibold sm:self-auto ${statusInfo.badgeStyle}`}>
                {statusInfo.label}
              </span>
            ) : null}
          </div>

          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-text-muted">Member</dt>
              <dd className="mt-1 text-sm font-bold text-text-primary">{verificationResult.member.nama}</dd>
              <dd className="mt-1 text-sm text-text-secondary">{verificationResult.member.instansi}</dd>
              <dd className="mt-1 text-sm tabular-nums text-text-secondary">{verificationResult.member.telp}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-text-muted">Space</dt>
              <dd className="mt-1 text-sm font-bold text-text-primary">{verificationResult.space.nama}</dd>
              <dd className="mt-1 text-sm text-action-secondary">{formatSpaceType(verificationResult.space.tipe)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-text-muted">Jadwal</dt>
              <dd className="mt-1 text-sm text-text-primary">{formatDateIndonesia(verificationResult.jadwal.tanggal)}</dd>
              <dd className="mt-1 text-sm tabular-nums text-text-secondary">
                {verificationResult.jadwal.jam_mulai}–{verificationResult.jadwal.jam_selesai} WIB ({verificationResult.jadwal.durasi})
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-text-muted">Total transaksi</dt>
              <dd className="mt-1 text-sm font-bold tabular-nums text-text-primary">
                {formatIdr(verificationResult.total_dibayar)}
              </dd>
            </div>
          </dl>

          {checkInMutation.isError ? (
            <div className="mt-5">
              <InlineAlert title="Check-in gagal" variant="danger">
                {checkInMutation.error instanceof Error
                  ? checkInMutation.error.message
                  : 'Status reservasi mungkin telah berubah. Buka detail reservasi untuk memeriksa status terbaru.'}
              </InlineAlert>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border-default pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={`/admin/reservations/${verificationResult.id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
            >
              Buka detail reservasi
            </Link>

            {verificationResult.can_check_in ? (
              <Button type="button" pending={checkInMutation.isPending} onClick={handleExecuteCheckIn} className="w-full sm:w-auto">
                {checkInMutation.isPending ? 'Memproses check-in…' : 'Konfirmasi check-in'}
              </Button>
            ) : (
              <p className="text-sm text-text-secondary">
                Reservasi berstatus {statusInfo?.label ?? verificationResult.status} dan tidak dapat di-check-in.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
