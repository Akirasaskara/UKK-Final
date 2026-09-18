import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/features/auth/login-form';

function safeReturnTo(value: string | string[] | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/') || value.startsWith('//')) return undefined;
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { returnTo } = await searchParams;

  return (
    <AuthShell
      title="Masuk ke Akun"
      description="Gunakan akun member atau pengelola untuk melanjutkan."
      footer={
        <div className="space-y-2">
          <p>
            Belum punya akun member?{' '}
            <Link href="/register/member" className="font-semibold text-action-primary underline-offset-4 hover:underline">
              Daftar sebagai member
            </Link>
          </p>
          <p>
            Mengelola coworking space?{' '}
            <Link href="/register/admin" className="font-semibold text-action-primary underline-offset-4 hover:underline">
              Daftar sebagai pengelola
            </Link>
          </p>
        </div>
      }
    >
      <LoginForm returnTo={safeReturnTo(returnTo)} />
    </AuthShell>
  );
}
