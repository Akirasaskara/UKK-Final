import type { ReactNode } from 'react';

type InlineAlertProps = {
  title: string;
  children?: ReactNode;
  variant?: 'info' | 'danger' | 'success';
};

const styles = {
  info: 'border-status-info-text bg-status-info-bg text-status-info-text',
  danger: 'border-status-danger-text bg-status-danger-bg text-status-danger-text',
  success: 'border-status-success-text bg-status-success-bg text-status-success-text',
};

export function InlineAlert({
  title,
  children,
  variant = 'info',
}: InlineAlertProps) {
  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={`rounded-control border p-4 ${styles[variant]}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      {children ? <div className="mt-1 text-sm leading-relaxed">{children}</div> : null}
    </div>
  );
}
