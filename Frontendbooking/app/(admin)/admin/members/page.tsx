import { AdminMemberListPageContent } from '@/features/admin/members/components/admin-member-list';

export const metadata = {
  title: 'Daftar Member — Smart Space Booking Admin',
  description: 'Daftar pelanggan dan member yang memiliki riwayat reservasi.',
};

export default function AdminMembersPage() {
  return (
    <div>
      <AdminMemberListPageContent />
    </div>
  );
}
