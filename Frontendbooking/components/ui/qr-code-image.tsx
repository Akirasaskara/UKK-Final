'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

type QRCodeImageProps = {
  payload: string;
  size?: number;
  alt?: string;
  className?: string;
};

export function QRCodeImage({
  payload,
  size = 140,
  alt = 'QR Code Tiket',
  className = '',
}: QRCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!payload) return;

    QRCode.toDataURL(payload, {
      width: size,
      margin: 1,
      color: {
        dark: '#101714',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [payload, size]);

  if (error || !dataUrl || !payload) {
    return (
      <div
        className={`flex items-center justify-center bg-white p-3 rounded-xl border border-border-default ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[10px] text-text-muted text-center font-mono">
          {payload || 'QR Payload'}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
    />
  );
}
