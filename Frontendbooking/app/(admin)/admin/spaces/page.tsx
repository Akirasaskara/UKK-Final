import { AdminSpaceListPageContent } from '@/features/admin/spaces/components/admin-space-list';

export const metadata = {
  title: 'Inventaris Space — Smart Space Booking Admin',
  description: 'Kelola data dan fasilitas workstation, private office, dan meeting room.',
};

export default function AdminSpacesPage() {
  return (
    <div>
      <AdminSpaceListPageContent />
    </div>
  );
}
