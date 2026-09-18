import type { ReactNode } from 'react';
import { MemberHeader } from '@/components/member/member-header';

export default function MemberLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas text-text-primary">
      <MemberHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
