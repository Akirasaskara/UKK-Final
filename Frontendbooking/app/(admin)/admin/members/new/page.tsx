import { AssistedMemberForm } from '@/features/admin/members/components/assisted-member-form';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const metadata = {
  title: 'Tambah Member (Assisted) — Smart Space Booking Admin',
  description: 'Pendaftaran akun member baru secara langsung di lokasi coworking space.',
};

export default function NewAdminMemberPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Daftar Member', href: '/admin/members' },
          { label: 'Pendaftaran Member Baru' },
        ]}
      />

      <div className="space-y-1">
        <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Pendaftaran Member Berbantu (Assisted)
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Daftarkan akun member untuk pelanggan baru langsung dari panel resepsionis.
        </p>
      </div>

      <AssistedMemberForm />
    </div>
  );
}
