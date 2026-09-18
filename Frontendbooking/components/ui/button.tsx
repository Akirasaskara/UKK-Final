import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
};

export function Button({
  pending = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || pending}
      aria-busy={pending}
      className={`inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-sm font-semibold text-text-on-brand transition-colors hover:bg-action-primary-hover active:bg-action-primary-active focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-offset)] disabled:cursor-not-allowed disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-text)] ${className}`}
    >
      {children}
    </button>
  );
}
