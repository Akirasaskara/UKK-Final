import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AdminPromotionFormLoaderClient } from '@/features/admin/promotions/components/promotion-form-loader';

export const metadata = {
  title: 'Edit Promo Diskon — Smart Space Booking Admin',
  description: 'Formulir pembaruan data promo diskon dan periode masa berlaku.',
};

export default async function AdminPromotionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const promotionId = Number.parseInt(id, 10);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Kelola Promosi', href: '/admin/promotions' },
          { label: 'Edit Promo' },
        ]}
      />

      <div className="space-y-1">
        <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Perbarui Data Promo
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Ubah kode kupon, persentase diskon, atau rentang masa aktif promosi.
        </p>
      </div>

      <AdminPromotionFormLoaderClient promotionId={promotionId} />
    </div>
  );
}
