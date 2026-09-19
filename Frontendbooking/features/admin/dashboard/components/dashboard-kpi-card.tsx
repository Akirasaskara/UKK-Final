import type { LucideIcon } from 'lucide-react';

type DashboardKpiCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  variant?: 'default' | 'accent' | 'warning';
};

export function DashboardKpiCard({
  title,
  value,
  description,
  icon: Icon,
  badge,
  variant = 'default',
}: DashboardKpiCardProps) {
  const variantStyles = {
    default: 'border-border-default bg-bg-surface',
    accent: 'border-[var(--teal-700)]/30 bg-bg-surface ring-1 ring-[var(--teal-700)]/20',
    warning: 'border-[var(--amber-800)]/30 bg-bg-surface ring-1 ring-[var(--amber-800)]/20',
  };

  return (
    <article className={`rounded-card border p-5 shadow-card space-y-3 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          {title}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-subtle text-action-primary">
          <Icon size={18} aria-hidden="true" />
        </div>
      </div>

      <div>
        <p className="font-ui text-3xl font-bold tracking-tight text-text-primary tabular-nums">
          {value}
        </p>
        <p className="text-xs text-text-secondary mt-1">
          {description}
        </p>
      </div>

      {badge ? (
        <span className="inline-block text-[10px] font-bold uppercase rounded bg-bg-subtle px-2 py-0.5 text-text-muted">
          {badge}
        </span>
      ) : null}
    </article>
  );
}
