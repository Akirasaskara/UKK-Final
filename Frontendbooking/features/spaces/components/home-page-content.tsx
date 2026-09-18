'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroSearch } from '@/components/public/hero-search';
import { PublicContainer } from '@/components/public/public-container';
import { SpaceTypeCard } from '@/features/spaces/components/space-type-card';
import { WorkspaceCard } from '@/features/spaces/components/workspace-card';
import { PromotionCard } from '@/features/promotions/components/promotion-card';
import { usePublicSpaceTypes, usePublicSpaces } from '@/features/spaces/hooks';
import { useActivePromotions } from '@/features/promotions/hooks';
import { Skeleton } from '@/components/ui/skeleton';

export function HomePageContent() {
  const { data: spaceTypes, isLoading: typesLoading } = usePublicSpaceTypes();
  const { data: spaces, isLoading: spacesLoading } = usePublicSpaces();
  const { data: promotions } = useActivePromotions();

  const previewSpaces = spaces?.slice(0, 3) ?? [];
  const previewPromos = promotions?.slice(0, 3) ?? [];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. Hero Editorial & Quick Search */}
      <section className="relative overflow-hidden bg-bg-canvas border-b border-border-default/60 py-16 sm:py-24">
        <PublicContainer className="space-y-10">
          <div className="max-w-3xl space-y-4">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-action-secondary">
              Platform Reservasi Coworking Space
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-text-primary tracking-tight leading-[1.1]">
              Ruang kerja fleksibel untuk fokus, kolaborasi, dan berkembang.
            </h1>
            <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-text-secondary">
              Pesan workstation harian, meeting room, atau kantor privat dengan kepastian jadwal, harga transparan, dan tiket QR instan.
            </p>
          </div>

          <div className="max-w-3xl">
            <HeroSearch />
          </div>
        </PublicContainer>
      </section>

      {/* 2. Kategori Tipe Space */}
      <section aria-labelledby="kategori-heading">
        <PublicContainer className="space-y-8">
          <div className="max-w-2xl space-y-2">
            <h2 id="kategori-heading" className="font-display text-2xl sm:text-3xl text-text-primary">
              Kategori Ruang Kerja
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              Tersedia beragam opsi ruang sesuai skala dan kebutuhan produktivitas Anda.
            </p>
          </div>

          {typesLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-card" />
              ))}
            </div>
          ) : spaceTypes ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {spaceTypes.map((typeItem) => (
                <SpaceTypeCard key={typeItem.tipe} item={typeItem} />
              ))}
            </div>
          ) : null}
        </PublicContainer>
      </section>

      {/* 3. Preview Space Pilihan */}
      <section aria-labelledby="space-preview-heading">
        <PublicContainer className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <h2 id="space-preview-heading" className="font-display text-2xl sm:text-3xl text-text-primary">
                Jelajahi Pilihan Workspace
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                Daftar ruang kerja siap pakai dengan ketersediaan slot yang dapat Anda periksa langsung.
              </p>
            </div>
            <Link
              href="/spaces"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-action-primary hover:underline underline-offset-4"
            >
              <span>Lihat Semua Space</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {spacesLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-card" />
              ))}
            </div>
          ) : previewSpaces.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {previewSpaces.map((sp) => (
                <WorkspaceCard key={sp.id} space={sp} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Belum ada data space yang tersedia.</p>
          )}
        </PublicContainer>
      </section>

      {/* 4. Cara Reservasi (Faktual) */}
      <section aria-labelledby="cara-booking-heading" className="bg-bg-subtle border-y border-border-default/60 py-16">
        <PublicContainer className="space-y-10">
          <div className="max-w-2xl space-y-2 text-center sm:text-left">
            <h2 id="cara-booking-heading" className="font-display text-2xl sm:text-3xl text-text-primary">
              Cara Reservasi Ruang Kerja
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              Empat langkah mudah dari pemilihan jadwal hingga penggunaan ruangan di lokasi.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-card border border-border-default bg-bg-surface p-6 space-y-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--teal-50)] text-action-primary font-bold text-sm">
                1
              </span>
              <h3 className="font-ui text-base font-bold text-text-primary">
                Cari & Pilih Space
              </h3>
              <p className="text-xs leading-relaxed text-text-secondary">
                Telusuri katalog dan tentukan jenis workstation atau meeting room yang Anda butuhkan.
              </p>
            </div>

            <div className="rounded-card border border-border-default bg-bg-surface p-6 space-y-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--teal-50)] text-action-primary font-bold text-sm">
                2
              </span>
              <h3 className="font-ui text-base font-bold text-text-primary">
                Pilih Jadwal & Durasi
              </h3>
              <p className="text-xs leading-relaxed text-text-secondary">
                Tentukan tanggal dan jam penggunaan. Sistem akan memeriksa ketersediaan slot secara langsung.
              </p>
            </div>

            <div className="rounded-card border border-border-default bg-bg-surface p-6 space-y-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--teal-50)] text-action-primary font-bold text-sm">
                3
              </span>
              <h3 className="font-ui text-base font-bold text-text-primary">
                Terapkan Promo & Konfirmasi
              </h3>
              <p className="text-xs leading-relaxed text-text-secondary">
                Gunakan kode diskon yang berlaku, tinjau rincian biaya, lalu selesaikan pemesanan.
              </p>
            </div>

            <div className="rounded-card border border-border-default bg-bg-surface p-6 space-y-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--teal-50)] text-action-primary font-bold text-sm">
                4
              </span>
              <h3 className="font-ui text-base font-bold text-text-primary">
                Gunakan E-Ticket & QR
              </h3>
              <p className="text-xs leading-relaxed text-text-secondary">
                Tunjukkan QR code e-ticket Anda kepada pengelola space saat kedatangan untuk proses check-in.
              </p>
            </div>
          </div>
        </PublicContainer>
      </section>

      {/* 5. Preview Promosi Aktif */}
      {previewPromos.length > 0 ? (
        <section aria-labelledby="promosi-preview-heading">
          <PublicContainer className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <h2 id="promosi-preview-heading" className="font-display text-2xl sm:text-3xl text-text-primary">
                  Promosi Diskon Aktif
                </h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Manfaatkan penawaran potongan harga untuk pemesanan workstation berikutnya.
                </p>
              </div>
              <Link
                href="/promotions"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-action-primary hover:underline underline-offset-4"
              >
                <span>Lihat Semua Promo</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {previewPromos.map((promo) => (
                <PromotionCard key={promo.id} promotion={promo} />
              ))}
            </div>
          </PublicContainer>
        </section>
      ) : null}

      {/* 6. CTA Penutup */}
      <section className="py-8">
        <PublicContainer>
          <div className="rounded-card bg-bg-brand p-8 sm:p-12 text-center text-text-on-brand space-y-6">
            <div className="max-w-xl mx-auto space-y-3">
              <h2 className="font-display text-3xl sm:text-4xl">
                Siap Menemukan Ruang Kerja Terbaik?
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-[var(--teal-100)]">
                Daftar sebagai member untuk mulai memesan atau daftarkan coworking space Anda sekarang.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/spaces"
                className="inline-flex min-h-12 items-center justify-center rounded-control bg-[var(--gold-500)] px-6 py-3 text-sm font-semibold text-[var(--teal-950)] hover:bg-[var(--gold-700)] hover:text-white transition-colors shadow-sm"
              >
                Telusuri Katalog Space
              </Link>
              <Link
                href="/register/member"
                className="inline-flex min-h-12 items-center justify-center rounded-control border border-border-default/40 bg-transparent px-6 py-3 text-sm font-semibold text-text-on-brand hover:bg-white/10 transition-colors"
              >
                Buat Akun Member
              </Link>
            </div>
          </div>
        </PublicContainer>
      </section>
    </div>
  );
}
