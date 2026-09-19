'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

type MemberAvatarProps = {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function MemberAvatar({
  src,
  name,
  size = 'md',
  className = '',
}: MemberAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
  };

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');

  if (!src || hasError) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--teal-100)] text-action-primary font-bold select-none ${sizeClasses[size]} ${className}`}
        aria-label={name}
      >
        {initials || <User size={size === 'lg' ? 24 : 16} />}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Foto profil ${name}`}
      onError={() => setHasError(true)}
      className={`shrink-0 rounded-full object-cover ${sizeClasses[size]} ${className}`}
    />
  );
}
