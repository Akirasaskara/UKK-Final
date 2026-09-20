import { MemberProfilePageContent } from '@/features/auth/member-profile-page-content';

export const metadata = {
  title: 'Profil Member | Smart Space Booking',
  description: 'Data identitas member dan pengelolaan sesi akun.',
};

export default function MemberProfilePage() {
  return (
    <main>
      <MemberProfilePageContent />
    </main>
  );
}
