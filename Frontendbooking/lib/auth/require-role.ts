import 'server-only';

import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/auth/session';
import { fetchUpstream } from '@/lib/server/upstream';
import { authProfileSchema, type AuthProfile } from '@/features/auth/schemas';
import { z } from 'zod';

const envelopeSchema = z.object({
  status: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: authProfileSchema,
  timestamp: z.string(),
});

async function resolveUserProfile(currentPath: string): Promise<AuthProfile> {
  const token = await getSessionToken();
  if (!token) {
    redirect(`/login?returnTo=${encodeURIComponent(currentPath)}`);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetchUpstream('/api/auth/profile', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    redirect(`/login?returnTo=${encodeURIComponent(currentPath)}`);
  }

  if (upstreamResponse.status === 401) {
    redirect(`/login?returnTo=${encodeURIComponent(currentPath)}`);
  }

  const body = await upstreamResponse.json().catch(() => null);
  const parsed = envelopeSchema.safeParse(body);
  if (!parsed.success) {
    redirect(`/login?returnTo=${encodeURIComponent(currentPath)}`);
  }

  return parsed.data.data;
}

export async function requireAdminRole(currentPath = '/admin'): Promise<AuthProfile> {
  const profile = await resolveUserProfile(currentPath);
  if (profile.role !== 'admin_space') {
    redirect('/member');
  }
  return profile;
}

export async function requireMemberRole(currentPath = '/member'): Promise<AuthProfile> {
  const profile = await resolveUserProfile(currentPath);
  if (profile.role !== 'member') {
    redirect('/admin');
  }
  return profile;
}
