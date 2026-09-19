'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus, ArrowRight, Info } from 'lucide-react';
import { useAdminMembers } from '../hooks';
import { AdminMemberFilters } from './admin-member-filters';
import { MemberAvatar } from './member-avatar';
import { formatDateIndonesia } from '@/lib/format/date';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineAlert } from '@/components/ui/inline-alert';

export function AdminMemberListPageContent() {
  const [rawSearch, setRawSearch] = useState('');
  const debouncedSearch = useDebouncedValue(rawSearch, 300);

  const {
    data: result,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminMembers({
    search: debouncedSearch || undefined,
  });

  const members = result?.items ?? [];
  const hasFilter = Boolean(rawSearch.trim());

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Daftar Pelanggan & Member
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Daftar member yang memiliki riwayat reservasi pada coworking space Anda.
          </p>
        </div>

        <Link
          href="/admin/members/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-action-primary px-4 py-2 text-xs sm:text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm"
        >
          <UserPlus size={16} aria-hidden="true" />
          <span>Tambah Member (Assisted)</span>
        </Link>
      </div>

      {/* Visibility Notice Banner */}
      <div className="flex items-start gap-2.5 rounded-control border border-border-default bg-bg-surface p-3.5 text-xs text-text-secondary">
        <Info size={16} className="shrink-0 text-action-secondary mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          Akun member bersifat <strong>global</strong>. Sesuai kebijakan privasi, admin hanya dapat melihat member yang pernah melakukan pemesanan (reservasi) di coworking space ini. Member yang didaftarkan melalui form assisted akan muncul setelah membuat reservasi pertamanya.
        </p>
      </div>

      {/* Filters */}
      <AdminMemberFilters
        search={rawSearch}
        onSearchChange={setRawSearch}
        onReset={() => setRawSearch('')}
      />

      {/* Error state */}
      {isError ? (
        <InlineAlert title="Gagal memuat daftar member" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Terjadi kendala saat mengambil data member.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-control bg-status-danger-text px-4 py-1.5 text-xs font-semibold text-white"
          >
            Coba Lagi
          </button>
        </InlineAlert>
      ) : null}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-card border border-border-default bg-bg-surface p-4 space-y-3">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))}
        </div>
      ) : null}

      {/* Result list */}
      {!isLoading && !isError && result ? (
        members.length === 0 ? (
          hasFilter ? (
            <EmptyState
              title="Tidak ada member yang cocok"
              description="Coba ubah kata kunci pencarian nama, instansi, atau nomor telepon."
              action={
                <button
                  type="button"
                  onClick={() => setRawSearch('')}
                  className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-sm font-semibold text-text-on-brand"
                >
                  Reset Pencarian
                </button>
              }
            />
          ) : (
            <EmptyState
              title="Belum ada member dengan riwayat kunjungan"
              description="Member akan otomatis terdaftar di sini setelah melakukan pemesanan workstation atau meeting room di coworking space Anda."
              action={
                <Link
                  href="/admin/members/new"
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control bg-action-primary px-5 py-2.5 text-sm font-semibold text-text-on-brand"
                >
                  <UserPlus size={16} aria-hidden="true" />
                  <span>Daftarkan Member Baru (Assisted)</span>
                </Link>
              }
            />
          )
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-medium text-text-muted">
              Menampilkan {members.length} pelanggan terdata
            </p>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto rounded-card border border-border-default bg-bg-surface shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <caption className="sr-only">Tabel Pelanggan & Member Coworking</caption>
                <thead>
                  <tr className="border-b border-border-default bg-bg-subtle text-text-muted">
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider w-16">Foto</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Nama Member</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Instansi / Perusahaan</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Kontak Telepon</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Tanggal Terdaftar</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-bg-subtle/50 transition-colors">
                      <td className="p-3.5">
                        <MemberAvatar
                          src={member.foto_url}
                          name={member.nama_member}
                          size="md"
                        />
                      </td>
                      <td className="p-3.5 font-semibold text-text-primary text-sm">
                        <Link
                          href={`/admin/members/${member.id}`}
                          className="hover:text-action-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
                        >
                          {member.nama_member}
                        </Link>
                      </td>
                      <td className="p-3.5 text-text-secondary">
                        {member.instansi}
                      </td>
                      <td className="p-3.5 text-text-primary font-mono text-xs">
                        {member.telp}
                      </td>
                      <td className="p-3.5 text-text-muted">
                        {member.created_at ? formatDateIndonesia(member.created_at) : '-'}
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/admin/members/${member.id}`}
                          className="inline-flex items-center gap-1 rounded-control bg-bg-subtle px-2.5 py-1 text-xs font-semibold text-text-primary hover:bg-border-default"
                        >
                          <span>Detail</span>
                          <ArrowRight size={12} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< 768px) */}
            <div className="md:hidden space-y-4">
              {members.map((member) => (
                <article key={member.id} className="rounded-card border border-border-default bg-bg-surface p-4 shadow-card space-y-3">
                  <div className="flex items-center gap-3">
                    <MemberAvatar
                      src={member.foto_url}
                      name={member.nama_member}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-ui text-sm font-bold text-text-primary truncate">
                        {member.nama_member}
                      </h3>
                      <p className="text-xs text-text-muted truncate">{member.instansi}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border-default pt-2 text-xs">
                    <span className="text-text-muted font-mono">{member.telp}</span>
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="font-semibold text-action-primary hover:underline"
                    >
                      Lihat Profil
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
