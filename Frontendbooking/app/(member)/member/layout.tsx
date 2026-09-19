import type { ReactNode } from 'react';
import { requireMemberRole } from '@/lib/auth/require-role';
import { MemberHeader } from '@/components/member/member-header';

export default async function MemberLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireMemberRole('/member');

  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas text-text-primary">
      <MemberHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
