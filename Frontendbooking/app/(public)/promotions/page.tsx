import { PromotionListContent } from '@/features/promotions/components/promotion-list';

export const metadata = {
  title: 'Promosi Aktif — Smart Space Booking',
  description: 'Daftar kode promo diskon coworking space dan workstation aktif.',
};

export default function PromotionsPage() {
  return (
    <main>
      <PromotionListContent />
    </main>
  );
}
