import { requireAdminRole } from '@/lib/auth/require-role';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdminRole('/admin');

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
