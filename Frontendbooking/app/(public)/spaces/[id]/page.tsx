import { notFound } from 'next/navigation';
import { SpaceDetailPageContent } from '@/features/spaces/components/space-detail';

export const metadata = {
  title: 'Detail Space — Smart Space Booking',
  description: 'Informasi detail fasilitas dan cek ketersediaan ruang kerja.',
};

export default async function SpaceDetailPage({
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
    <main>
      <SpaceDetailPageContent spaceId={spaceId} />
    </main>
  );
}
