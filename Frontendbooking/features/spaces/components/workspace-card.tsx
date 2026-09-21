import Link from 'next/link';
import { Users } from 'lucide-react';
import type { PublicSpace } from '../schemas';
import { formatIdr } from '@/lib/format/currency';
import { formatSpaceType } from '@/lib/format/space';
import { WorkspaceImage } from './workspace-image';

type WorkspaceCardProps = {
  space: PublicSpace;
};

export function WorkspaceCard({ space }: WorkspaceCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-border-default bg-bg-surface shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-border-strong">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-subtle">
        <WorkspaceImage
          src={space.foto_url ?? null}
          alt={`Foto ruang kerja ${space.nama_space}`}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className="rounded-badge bg-bg-surface/90 px-3 py-1 text-xs font-bold text-text-primary shadow-sm backdrop-blur-sm">
            {formatSpaceType(space.tipe)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-1.5">
          {space.owner ? (
            <p className="text-xs font-semibold text-action-secondary">
              {space.owner.nama_coworking}
            </p>
          ) : null}
          <h3 className="font-ui text-lg font-bold text-text-primary group-hover:text-action-primary transition-colors">
            <Link
              href={`/spaces/${space.id}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
            >
              {space.nama_space}
            </Link>
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">
            {space.deskripsi}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border-default pt-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Users size={16} aria-hidden="true" />
            <span>Kapasitas {space.kapasitas} orang</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Mulai dari</p>
            <p className="font-ui text-sm font-bold text-text-primary">
              <span className="tabular-nums">{formatIdr(space.harga_per_jam)}</span>
              <span className="text-xs font-normal text-text-muted"> / jam</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
