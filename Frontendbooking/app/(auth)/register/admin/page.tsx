import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { AdminRegistrationForm } from '@/features/auth/admin-registration-form';

export default function AdminRegistrationPage() {
  return (
    <AuthShell
      title="Daftar sebagai Pengelola"
      description="Buat akun pengelola untuk mengatur space, promosi, dan reservasi coworking Anda."
      footer={
        <p>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-action-primary underline-offset-4 hover:underline">
            Masuk ke akun
          </Link>
        </p>
      }
    >
      <AdminRegistrationForm />
    </AuthShell>
  );
}
