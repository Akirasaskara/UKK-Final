import { AdminPromotionListPageContent } from '@/features/admin/promotions/components/admin-promotion-list';

export const metadata = {
  title: 'Kelola Promosi — Smart Space Booking Admin',
  description: 'Daftar kode kupon diskon dan potongan harga sewa coworking space.',
};

export default function AdminPromotionsPage() {
  return (
    <div>
      <AdminPromotionListPageContent />
    </div>
  );
}
