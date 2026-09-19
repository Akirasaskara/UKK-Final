import { notFound } from 'next/navigation';
import { AdminSpaceDetailPageContent } from '@/features/admin/spaces/components/admin-space-detail';

export const metadata = {
  title: 'Detail Space — Smart Space Booking Admin',
  description: 'Informasi lengkap spesifikasi dan opsi inventaris space.',
};

export default async function AdminSpaceDetailPage({
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
    <div>
      <AdminSpaceDetailPageContent spaceId={spaceId} />
    </div>
  );
}
