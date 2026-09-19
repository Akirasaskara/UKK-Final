import { AdminSpaceForm } from '@/features/admin/spaces/components/admin-space-form';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const metadata = {
  title: 'Tambah Space Baru — Smart Space Booking Admin',
  description: 'Formulir penambahan ruang kerja dan fasilitas coworking space.',
};

export default function NewAdminSpacePage() {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Inventaris Space', href: '/admin/spaces' },
          { label: 'Tambah Space Baru' },
        ]}
      />

      <div className="space-y-1">
        <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Tambah Space Ruangan Baru
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Isi kelengkapan data workstation atau meeting room untuk ditampilkan pada katalog publik.
        </p>
      </div>

      <AdminSpaceForm />
    </div>
  );
}
