'use client';

import Link from 'next/link';
import { LogoutButton } from '@/components/auth/logout-button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicContainer } from '@/components/public/public-container';
import { useProfile } from './hooks';

function safeImageUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith('/')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? value : null;
  } catch {
    return null;
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function MemberProfilePageContent() {
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const member = profile?.role === 'member' ? profile.member : null;
  const profileImageUrl = safeImageUrl(member?.foto ?? null);

  return (
    <PublicContainer className="py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-action-secondary">Akun member</p>
        <h1 className="mt-2 font-display text-3xl leading-tight text-text-primary sm:text-4xl">
          Profil dan sesi
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
          Periksa identitas yang tersimpan dan akhiri sesi dari perangkat ini bila sudah selesai.
        </p>
      </header>

      {profileQuery.isLoading ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]" role="status" aria-label="Memuat profil">
          <div className="rounded-card border border-border-default bg-bg-surface p-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="mt-5 h-7 w-52" />
            <Skeleton className="mt-8 h-40 w-full" />
          </div>
          <div className="rounded-card border border-border-default bg-bg-surface p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-5 h-20 w-full" />
          </div>
        </div>
      ) : null}

      {profileQuery.isError ? (
        <div className="mt-8">
          <InlineAlert title="Profil belum dapat dimuat" variant="danger">
            <p>{profileQuery.error instanceof Error ? profileQuery.error.message : 'Server tidak dapat dihubungi.'}</p>
            <button
              type="button"
              onClick={() => profileQuery.refetch()}
              className="mt-3 min-h-11 rounded-control bg-status-danger-text px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
            >
              Coba lagi
            </button>
          </InlineAlert>
        </div>
      ) : null}

      {!profileQuery.isLoading && !profileQuery.isError && profile && member ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
          <section aria-labelledby="identity-title" className="rounded-card border border-border-default bg-bg-surface p-5 sm:p-7">
            <div className="flex items-center gap-4 border-b border-border-default pb-6">
              {profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImageUrl}
                  alt={`Foto profil ${member.nama_member}`}
                  className="h-20 w-20 shrink-0 rounded-full border border-border-default object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-action-primary text-xl font-bold text-text-on-brand" aria-hidden="true">
                  {initials(member.nama_member)}
                </div>
              )}
              <div className="min-w-0">
                <h2 id="identity-title" className="font-ui text-xl font-bold text-text-primary sm:text-2xl">
                  {member.nama_member}
                </h2>
                <p className="mt-1 break-all text-sm text-text-secondary">@{profile.username}</p>
              </div>
            </div>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-text-muted">Instansi</dt>
                <dd className="mt-1 text-sm leading-relaxed text-text-primary">{member.instansi}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-text-muted">Nomor telepon</dt>
                <dd className="mt-1 text-sm tabular-nums text-text-primary">{member.telp}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-text-muted">Alamat</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{member.alamat}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-text-muted">Jenis akun</dt>
                <dd className="mt-1 text-sm text-text-primary">Member global</dd>
              </div>
            </dl>
          </section>

          <aside aria-labelledby="session-title" className="self-start rounded-card border border-border-default bg-bg-surface p-5 sm:p-6">
            <h2 id="session-title" className="font-ui text-lg font-bold text-text-primary">Sesi perangkat ini</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Keluar akan menghapus cookie sesi pada browser ini. Reservasi dan data akun tetap tersimpan.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <LogoutButton />
              <Link
                href="/member"
                className="inline-flex min-h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
              >
                Kembali ke dashboard
              </Link>
            </div>
          </aside>
        </div>
      ) : null}

      {!profileQuery.isLoading && !profileQuery.isError && profile && !member ? (
        <div className="mt-8">
          <InlineAlert title="Data member tidak tersedia" variant="danger">
            Sesi ini tidak memiliki profil member yang dapat ditampilkan.
          </InlineAlert>
        </div>
      ) : null}
    </PublicContainer>
  );
}
