export type SpaceFilterParams = {
  tipe?: string;
  search?: string;
};

export type AvailabilityParams = {
  id_space: number;
  tanggal: string;
  jam_mulai: string;
  durasi_jam: number;
};

export type HistoryFilterParams = {
  month?: number;
  year?: number;
};

export type AdminReservationFilterParams = {
  status?: string;
  id_space?: number;
  tanggal?: string;
  month?: number;
  year?: number;
};

export const queryKeys = {
  session: {
    profile: () => ['session', 'profile'] as const,
  },
  spaces: {
    public: {
      list: (params: SpaceFilterParams = {}) => ['spaces', 'public', 'list', params] as const,
      detail: (id: number) => ['spaces', 'public', 'detail', id] as const,
      types: () => ['spaces', 'public', 'types'] as const,
    },
    availability: (params: AvailabilityParams) => ['spaces', 'availability', params] as const,
  },
  discounts: {
    publicActive: () => ['discounts', 'public', 'active'] as const,
  },
  member: {
    bookings: {
      list: () => ['member', 'bookings', 'list'] as const,
      detail: (id: number) => ['member', 'bookings', 'detail', id] as const,
      ticket: (id: number) => ['member', 'bookings', 'ticket', id] as const,
      history: (params: HistoryFilterParams = {}) => ['member', 'bookings', 'history', params] as const,
    },
  },
  admin: {
    dashboard: () => ['admin', 'dashboard'] as const,
    profile: () => ['admin', 'profile'] as const,
    spaces: {
      list: () => ['admin', 'spaces', 'list'] as const,
      detail: (id: number) => ['admin', 'spaces', 'detail', id] as const,
    },
    discounts: {
      list: () => ['admin', 'discounts', 'list'] as const,
      detail: (id: number) => ['admin', 'discounts', 'detail', id] as const,
    },
    members: {
      list: (search?: string) => ['admin', 'members', 'list', { search }] as const,
      detail: (id: number) => ['admin', 'members', 'detail', id] as const,
    },
    reservations: {
      list: (params: AdminReservationFilterParams = {}) => ['admin', 'reservations', 'list', params] as const,
      detail: (id: number) => ['admin', 'reservations', 'detail', id] as const,
    },
    reports: {
      monthly: (params: HistoryFilterParams = {}) => ['admin', 'reports', 'monthly', params] as const,
      income: (params: HistoryFilterParams = {}) => ['admin', 'reports', 'income', params] as const,
    },
  },
};
