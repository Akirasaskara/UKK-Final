'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';

type ScannerState = 'idle' | 'starting' | 'scanning' | 'stopping' | 'error';

type QrCameraScannerProps = {
  disabled?: boolean;
  onDetected: (payload: string) => void | Promise<void>;
  onUseManual: () => void;
};

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Izin kamera ditolak. Izinkan kamera untuk situs ini melalui pengaturan browser, atau gunakan input manual.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Kamera tidak ditemukan pada perangkat ini. Gunakan input manual untuk memverifikasi tiket.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Kamera sedang digunakan aplikasi lain atau tidak dapat dibuka. Tutup aplikasi kamera lain lalu coba kembali.';
  }
  if (name === 'OverconstrainedError') {
    return 'Kamera belakang tidak tersedia. Coba kembali atau gunakan input manual.';
  }
  return 'Kamera tidak dapat diaktifkan. Pastikan halaman dibuka melalui HTTPS dan izin kamera tersedia.';
}

export function QrCameraScanner({
  disabled = false,
  onDetected,
  onUseManual,
}: QrCameraScannerProps) {
  const reactId = useId();
  const readerId = `qr-reader-${reactId.replace(/:/g, '')}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detectionLockedRef = useRef(false);
  const mountedRef = useRef(true);
  const stateRef = useRef<ScannerState>('idle');
  const [state, setState] = useState<ScannerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateState = useCallback((nextState: ScannerState) => {
    stateRef.current = nextState;
    if (mountedRef.current) setState(nextState);
  }, []);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      updateState('idle');
      return;
    }

    updateState('stopping');
    try {
      if (scanner.isScanning) await scanner.stop();
    } catch {
      // The media track may already be closed by the browser.
    }
    try {
      scanner.clear();
    } catch {
      // The reader container may already have been removed during navigation.
    }
    scannerRef.current = null;
    detectionLockedRef.current = false;
    updateState('idle');
  }, [updateState]);

  const startScanner = useCallback(async () => {
    if (disabled || stateRef.current === 'starting' || stateRef.current === 'scanning') return;
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setErrorMessage('Kamera browser hanya dapat digunakan melalui koneksi HTTPS. Gunakan input manual pada koneksi ini.');
      updateState('error');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Browser ini tidak mendukung akses kamera. Gunakan input manual untuk memverifikasi tiket.');
      updateState('error');
      return;
    }

    setErrorMessage(null);
    updateState('starting');
    detectionLockedRef.current = false;

    const scanner = new Html5Qrcode(readerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
            return { width: Math.max(180, size), height: Math.max(180, size) };
          },
          aspectRatio: 4 / 3,
          disableFlip: false,
        },
        (decodedText) => {
          const payload = decodedText.trim();
          if (!payload || detectionLockedRef.current) return;
          detectionLockedRef.current = true;
          void stopScanner().then(() => onDetected(payload));
        },
        () => undefined,
      );
      updateState('scanning');
    } catch (error: unknown) {
      try {
        scanner.clear();
      } catch {
        // The scanner may fail before it creates its rendering surface.
      }
      scannerRef.current = null;
      if (mountedRef.current) {
        setErrorMessage(cameraErrorMessage(error));
        updateState('error');
      }
    }
  }, [disabled, onDetected, readerId, stopScanner, updateState]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;
      if (scanner.isScanning) {
        void scanner.stop().catch(() => undefined).finally(() => {
          try {
            scanner.clear();
          } catch {
            // The reader container is removed immediately after unmount.
          }
        });
      } else {
        try {
          scanner.clear();
        } catch {
          // The reader container is removed immediately after unmount.
        }
      }
    };
  }, []);

  return (
    <section aria-labelledby="camera-scanner-title" className="rounded-card border border-border-default bg-bg-surface p-5 sm:p-6">
      <div>
        <h2 id="camera-scanner-title" className="font-ui text-lg font-bold text-text-primary">
          Pindai QR tiket
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Arahkan QR ke dalam bingkai. Kamera hanya aktif setelah Anda menekan tombol dan tidak menyimpan gambar.
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-control border border-border-strong bg-black">
        <div id={readerId} className="min-h-72 w-full sm:min-h-96" aria-label="Pratinjau kamera pemindai QR" />
      </div>

      <div aria-live="polite" className="mt-3 min-h-6 text-sm text-text-secondary">
        {state === 'idle' ? 'Kamera belum aktif.' : null}
        {state === 'starting' ? 'Meminta izin dan membuka kamera…' : null}
        {state === 'scanning' ? 'Kamera aktif. Posisikan QR di dalam bingkai.' : null}
        {state === 'stopping' ? 'Menghentikan kamera…' : null}
      </div>

      {errorMessage ? (
        <div className="mt-4">
          <InlineAlert title="Kamera tidak dapat digunakan" variant="danger">
            {errorMessage}
          </InlineAlert>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {state !== 'scanning' ? (
          <Button type="button" pending={state === 'starting'} disabled={disabled || state === 'stopping'} onClick={startScanner} className="w-full sm:w-auto">
            {state === 'starting' ? 'Membuka kamera…' : 'Aktifkan kamera'}
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => void stopScanner()}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-control border border-border-strong bg-bg-surface px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] sm:w-auto"
          >
            Hentikan kamera
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            void stopScanner();
            onUseManual();
          }}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-control border border-border-strong bg-bg-surface px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] sm:w-auto"
        >
          Gunakan input manual
        </button>
      </div>
    </section>
  );
}
