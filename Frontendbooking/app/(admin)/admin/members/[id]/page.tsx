import { notFound } from 'next/navigation';
import { AdminMemberDetailPageContent } from '@/features/admin/members/components/admin-member-detail';

export const metadata = {
  title: 'Detail Profil Member — Smart Space Booking Admin',
  description: 'Informasi kontak dan data identitas pelanggan coworking space.',
};

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const memberId = Number.parseInt(id, 10);

  return (
    <div>
      <AdminMemberDetailPageContent memberId={memberId} />
    </div>
  );
}
