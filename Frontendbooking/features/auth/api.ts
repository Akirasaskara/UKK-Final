import { authProfileSchema } from '@/features/auth/schemas';
import type {
  LoginInput,
  RegisterAdminInput,
  RegisterMemberInput,
} from '@/features/auth/schemas';
import { apiClient } from '@/lib/api/client';

export function login(input: LoginInput) {
  return apiClient.post('/api/auth/login', input, authProfileSchema);
}

export function registerMember(input: RegisterMemberInput) {
  return apiClient.post('/api/auth/register/member', input, authProfileSchema);
}

export function registerAdmin(input: RegisterAdminInput) {
  return apiClient.post('/api/auth/register/admin', input, authProfileSchema);
}

export function getProfile(signal?: AbortSignal) {
  return apiClient.get('/api/auth/profile', authProfileSchema, { signal });
}
