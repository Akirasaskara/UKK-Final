import { AdminProfileForm } from '@/features/admin/profile/components/admin-profile-form';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const metadata = {
  title: 'Profil Coworking Space — Smart Space Booking Admin',
  description: 'Kelola informasi lokasi, kontak operasional, dan fasilitas coworking space.',
};

export default function AdminProfilePage() {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Profil Coworking' },
        ]}
      />

      <div className="space-y-1">
        <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Profil Coworking Space
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Perbarui data penanggung jawab, kontak telepon, dan kelengkapan fasilitas operasional.
        </p>
      </div>

      <AdminProfileForm />
    </div>
  );
}
