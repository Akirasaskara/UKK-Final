import { PromotionForm } from '@/features/admin/promotions/components/promotion-form';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const metadata = {
  title: 'Tambah Promo Baru — Smart Space Booking Admin',
  description: 'Formulir pembuatan kode kupon promo diskon baru.',
};

export default function NewAdminPromotionPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Kelola Promosi', href: '/admin/promotions' },
          { label: 'Tambah Promo Baru' },
        ]}
      />

      <div className="space-y-1">
        <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Buat Promo Diskon Baru
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Tentukan kode promo, besaran diskon, dan rentang tanggal berlakunya kupon.
        </p>
      </div>

      <PromotionForm />
    </div>
  );
}
