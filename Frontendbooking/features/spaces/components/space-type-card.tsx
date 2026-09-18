import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { SpaceTypeItem } from '../schemas';

type SpaceTypeCardProps = {
  item: SpaceTypeItem;
};

export function SpaceTypeCard({ item }: SpaceTypeCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-card border border-border-default bg-bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-border-strong space-y-4">
      <div className="space-y-2">
        <span className="inline-block text-xs font-bold uppercase tracking-wider text-action-secondary">
          Kategori
        </span>
        <h3 className="font-ui text-xl font-bold text-text-primary">
          {item.label}
        </h3>
        <p className="text-xs leading-relaxed text-text-secondary">
          {item.deskripsi}
        </p>
      </div>

      <div className="pt-2">
        <Link
          href={`/spaces?tipe=${item.tipe}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-action-primary hover:underline underline-offset-4"
        >
          <span>Lihat {item.label}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
