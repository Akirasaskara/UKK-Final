'use client';

import { Button } from '@/components/ui/button';
import { useLogoutMutation } from '@/features/auth/hooks';

export function LogoutButton() {
  const mutation = useLogoutMutation();
  return (
    <Button
      type="button"
      pending={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? 'Mengakhiri Sesi' : 'Keluar'}
    </Button>
  );
}
