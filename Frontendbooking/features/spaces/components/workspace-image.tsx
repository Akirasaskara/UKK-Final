'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';

type WorkspaceImageProps = {
  src: string | null;
  alt: string;
  className?: string;
};

export function WorkspaceImage({
  src,
  alt,
  className = '',
}: WorkspaceImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-bg-subtle text-text-muted ${className}`}
        role="img"
        aria-label={alt ? `Gambar untuk ${alt}` : 'Placeholder gambar space'}
      >
        <Building2 size={32} className="opacity-40" aria-hidden="true" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
}
