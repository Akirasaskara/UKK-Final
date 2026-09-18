import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { MemberRegistrationForm } from '@/features/auth/member-registration-form';

export default function MemberRegistrationPage() {
  return (
    <AuthShell
      title="Daftar sebagai Member"
      description="Buat akun untuk memesan space dan melihat e-ticket Anda."
      footer={
        <p>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-action-primary underline-offset-4 hover:underline">
            Masuk ke akun
          </Link>
        </p>
      }
    >
      <MemberRegistrationForm />
    </AuthShell>
  );
}
