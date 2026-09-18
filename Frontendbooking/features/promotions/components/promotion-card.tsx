import Link from 'next/link';
import { Tag, Calendar } from 'lucide-react';
import type { ActivePromotion } from '../schemas';
import { formatDateRangeIndonesia } from '@/lib/format/date';

type PromotionCardProps = {
  promotion: ActivePromotion;
};

export function PromotionCard({ promotion }: PromotionCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-card border border-border-default bg-bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-border-strong space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-badge bg-[var(--gold-50)] border border-[var(--gold-500)]/30 px-3 py-1 text-xs font-bold text-[var(--gold-700)]">
            <Tag size={13} aria-hidden="true" />
            Diskon {promotion.persentase_diskon}%
          </span>
          <span className="rounded-badge bg-status-success-bg px-2.5 py-0.5 text-[11px] font-semibold text-status-success-text">
            Aktif
          </span>
        </div>

        <h3 className="font-ui text-xl font-bold text-text-primary">
          {promotion.nama_diskon}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Calendar size={15} aria-hidden="true" />
          <span>{formatDateRangeIndonesia(promotion.tanggal_awal, promotion.tanggal_akhir)}</span>
        </div>
      </div>

      <div className="border-t border-border-default pt-4 flex items-center justify-between">
        <p className="text-[11px] text-text-muted max-w-[65%] leading-relaxed">
          Gunakan nama promo ini saat melakukan reservasi booking space.
        </p>
        <Link
          href="/spaces"
          className="inline-flex min-h-10 items-center justify-center rounded-control bg-action-primary px-3.5 py-1.5 text-xs font-semibold text-text-on-brand hover:bg-action-primary-hover"
        >
          Cari Space
        </Link>
      </div>
    </article>
  );
}
