import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AdminSpaceFormLoaderClient } from '@/features/admin/spaces/components/admin-space-form-loader';

export const metadata = {
  title: 'Edit Space — Smart Space Booking Admin',
  description: 'Formulir pembaruan data dan tarif inventaris space.',
};

export default async function AdminSpaceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const spaceId = Number.parseInt(id, 10);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Inventaris Space', href: '/admin/spaces' },
          { label: 'Edit Space' },
        ]}
      />

      <div className="space-y-1">
        <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Perbarui Data Space
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Ubah nama, kapasitas, tarif sewa, atau foto fasilitas ruangan.
        </p>
      </div>

      <AdminSpaceFormLoaderClient spaceId={spaceId} />
    </div>
  );
}
