import { apiClient } from '@/lib/api/client';
import {
  publicSpaceListSchema,
  publicSpaceSchema,
  spaceTypeListSchema,
  availabilityResultSchema,
  type PublicSpace,
  type SpaceTypeItem,
  type AvailabilityQuery,
  type AvailabilityResult,
} from './schemas';

export type SpaceFilterParams = {
  tipe?: string;
  search?: string;
};

export function getPublicSpaceTypes(signal?: AbortSignal): Promise<SpaceTypeItem[]> {
  return apiClient.get('/api/public/spaces/types', spaceTypeListSchema, { signal });
}

export function getPublicSpaces(
  params: SpaceFilterParams = {},
  signal?: AbortSignal,
): Promise<PublicSpace[]> {
  const query = new URLSearchParams();
  if (params.tipe) query.set('tipe', params.tipe);
  if (params.search && params.search.trim().length > 0) {
    query.set('search', params.search.trim());
  }

  const qs = query.toString();
  const url = qs ? `/api/public/spaces?${qs}` : '/api/public/spaces';

  return apiClient.get(url, publicSpaceListSchema, { signal });
}

export function getPublicSpaceDetail(
  id: number,
  signal?: AbortSignal,
): Promise<PublicSpace> {
  return apiClient.get(`/api/public/spaces/${id}`, publicSpaceSchema, { signal });
}

export function checkSpaceAvailability(
  query: AvailabilityQuery,
  signal?: AbortSignal,
): Promise<AvailabilityResult> {
  const params = new URLSearchParams({
    id_space: query.id_space.toString(),
    tanggal: query.tanggal,
    jam_mulai: query.jam_mulai,
    durasi_jam: query.durasi_jam.toString(),
  });

  return apiClient.get(
    `/api/public/spaces/availability?${params.toString()}`,
    availabilityResultSchema,
    { signal },
  );
}
