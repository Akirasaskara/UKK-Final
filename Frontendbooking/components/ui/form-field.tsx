import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
};

export function FormField({
  id,
  label,
  required = false,
  helper,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-text-primary">
          {label}
        </label>
        <span className="text-xs text-text-muted">
          {required ? 'Wajib' : 'Opsional'}
        </span>
      </div>
      {children}
      {helper && !error ? (
        <p id={`${id}-helper`} className="text-xs leading-relaxed text-text-muted">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-status-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function fieldDescriptionId(
  id: string,
  error?: string,
  helper?: string,
): string | undefined {
  if (error) return `${id}-error`;
  if (helper) return `${id}-helper`;
  return undefined;
}

export function Input({ className = '', ...props }: ComponentPropsWithoutRef<'input'>) {
  return (
    <input
      {...props}
      className={`min-h-11 w-full rounded-control border border-border-default bg-bg-surface px-3 py-2 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus-visible:border-border-selected focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-offset)] disabled:cursor-not-allowed disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-text)] ${className}`}
    />
  );
}

export function Textarea({
  className = '',
  ...props
}: ComponentPropsWithoutRef<'textarea'>) {
  return (
    <textarea
      {...props}
      className={`min-h-30 w-full resize-y rounded-control border border-border-default bg-bg-surface px-3 py-2 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus-visible:border-border-selected focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-offset)] disabled:cursor-not-allowed disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-text)] ${className}`}
    />
  );
}
