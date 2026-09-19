'use client';

import Link from 'next/link';
import { ArrowLeft, Phone, MapPin, Calendar, ShieldCheck } from 'lucide-react';
import { useAdminMemberDetail } from '../hooks';
import { MemberAvatar } from './member-avatar';
import { formatDateIndonesia } from '@/lib/format/date';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineAlert } from '@/components/ui/inline-alert';

export function AdminMemberDetailPageContent({ memberId }: { memberId: number }) {
  const { data: member, isLoading, isError, error, refetch } = useAdminMemberDetail(memberId);

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="max-w-md">
        <InlineAlert title="Member Tidak Ditemukan" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Member tidak ditemukan atau belum pernah melakukan reservasi di coworking space Anda.'}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex min-h-10 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-xs font-semibold text-text-on-brand"
            >
              Coba Lagi
            </button>
          </div>
        </InlineAlert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumb
        items={[
          { label: 'Daftar Member', href: '/admin/members' },
          { label: member.nama_member },
        ]}
      />

      <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-6">
        {/* Top Profile Header */}
        <div className="flex items-center gap-4 border-b border-border-default pb-6">
          <MemberAvatar
            src={member.foto_url}
            name={member.nama_member}
            size="lg"
            className="h-16 w-16 text-xl"
          />

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-ui text-xl font-bold text-text-primary">
                {member.nama_member}
              </h1>
              <span className="rounded-badge bg-status-success-bg px-2.5 py-0.5 text-[10px] font-bold text-status-success-text">
                Member Aktif
              </span>
            </div>
            <p className="text-xs text-text-muted">{member.instansi}</p>
          </div>
        </div>

        {/* Contact & Address Facts */}
        <div className="space-y-3 text-xs">
          <p className="font-bold text-xs uppercase tracking-wider text-text-muted">
            Informasi Kontak & Domisili
          </p>

          <div className="rounded-control border border-border-default bg-bg-subtle p-4 space-y-3">
            <div className="flex items-center gap-2.5 text-text-secondary">
              <Phone size={16} className="text-text-muted shrink-0" aria-hidden="true" />
              <span>Nomor Telepon: <strong className="font-mono text-text-primary text-xs">{member.telp}</strong></span>
            </div>

            <div className="flex items-start gap-2.5 text-text-secondary">
              <MapPin size={16} className="text-text-muted shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-relaxed">Alamat: <strong className="text-text-primary">{member.alamat || '-'}</strong></span>
            </div>

            {member.created_at ? (
              <div className="flex items-center gap-2.5 text-text-secondary border-t border-border-default pt-2">
                <Calendar size={16} className="text-text-muted shrink-0" aria-hidden="true" />
                <span>Terdaftar Sejak: <strong className="text-text-primary">{formatDateIndonesia(member.created_at)}</strong></span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Global Member Protection Info */}
        <div className="rounded-control border border-[var(--teal-700)]/30 bg-[var(--teal-50)] p-4 text-xs text-action-primary flex items-start gap-2.5">
          <ShieldCheck size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            Akun pelanggan ini adalah akun <strong>member global</strong> yang dapat bertransaksi di berbagai jaringan coworking space. Pengelola space tidak dapat menghapus akun ini secara sepihak untuk melindungi data dan histori reservasi.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/admin/members"
            className="inline-flex min-h-10 items-center justify-center rounded-control border border-border-default bg-bg-surface px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-bg-subtle transition-colors"
          >
            <ArrowLeft size={14} className="mr-1.5" aria-hidden="true" />
            <span>Kembali ke Daftar Member</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
