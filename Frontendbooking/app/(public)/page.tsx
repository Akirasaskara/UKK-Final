import { HomePageContent } from '@/features/spaces/components/home-page-content';

export const metadata = {
  title: 'Smart Space Booking — Sistem Reservasi Coworking Space & Workstation',
  description: 'Katalog ruang kerja fleksibel, pengecekan ketersediaan bebas double booking, dan reservasi e-ticket instan.',
};

export default function HomePage() {
  return (
    <main>
      <HomePageContent />
    </main>
  );
}
