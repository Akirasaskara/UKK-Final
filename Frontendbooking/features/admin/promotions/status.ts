import type { PromotionStatus } from './schemas';

export const promotionStatusConfig: Record<
  PromotionStatus,
  { label: string; badgeStyle: string }
> = {
  upcoming: {
    label: 'Akan Datang',
    badgeStyle: 'bg-[var(--cyan-50)] text-[var(--cyan-700)] border border-[var(--cyan-700)]/30',
  },
  active: {
    label: 'Aktif',
    badgeStyle: 'bg-[var(--green-50)] text-[var(--green-700)] border border-[var(--green-700)]/30',
  },
  expired: {
    label: 'Berakhir',
    badgeStyle: 'bg-bg-subtle text-text-muted border border-border-default',
  },
};

export function formatPromotionStatus(status: PromotionStatus): {
  label: string;
  badgeStyle: string;
} {
  return (
    promotionStatusConfig[status] ?? {
      label: status,
      badgeStyle: 'bg-bg-subtle text-text-muted border border-border-default',
    }
  );
}
