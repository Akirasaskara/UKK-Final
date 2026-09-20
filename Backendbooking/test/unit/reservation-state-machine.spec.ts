import { describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminService } from '../../src/modules/admin/admin.service.js';
import { ReservationsService } from '../../src/modules/reservations/reservations.service.js';

type ReservationRecord = {
  id: bigint;
  idOwner: bigint;
  idMember: bigint;
  status: string;
  updatedAt: Date;
  checkInAt: Date | null;
  checkOutAt: Date | null;
};

function reservation(overrides: Partial<ReservationRecord> = {}): ReservationRecord {
  return {
    id: 10n,
    idOwner: 7n,
    idMember: 3n,
    status: 'disetujui',
    updatedAt: new Date('2026-09-20T01:00:00.000Z'),
    checkInAt: null,
    checkOutAt: null,
    ...overrides,
  };
}

function adminServiceWith(prisma: Record<string, unknown>): AdminService {
  return new AdminService(prisma as never, {} as never);
}

describe('Reservation state transitions', () => {
  it('applies owner scope and expected status in an atomic check-in update', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const findUniqueOrThrow = vi.fn().mockResolvedValue(
      reservation({ status: 'aktif', checkInAt: new Date('2026-09-20T01:05:00.000Z') }),
    );
    const service = adminServiceWith({
      reservation: { updateMany, findUniqueOrThrow },
    });

    const result = await service.checkIn({ spaceOwner: { id: 7n } }, 10);

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 10n, idOwner: 7n, status: 'disetujui' },
      data: {
        status: 'aktif',
        checkInAt: expect.any(Date),
        version: { increment: 1 },
      },
    });
    expect(result.data.status).toBe('aktif');
  });

  it('returns conflict when check-in loses a concurrent state transition', async () => {
    const service = adminServiceWith({
      reservation: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        findFirst: vi.fn().mockResolvedValue(reservation({ status: 'dibatalkan' })),
      },
    });

    await expect(service.checkIn({ spaceOwner: { id: 7n } }, 10)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('does not reveal a reservation belonging to another owner', async () => {
    const service = adminServiceWith({
      reservation: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    });

    await expect(service.checkOut({ spaceOwner: { id: 7n } }, 10)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('requires aktif status for an atomic check-out update', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const findUniqueOrThrow = vi.fn().mockResolvedValue(
      reservation({ status: 'selesai', checkOutAt: new Date('2026-09-20T03:00:00.000Z') }),
    );
    const service = adminServiceWith({
      reservation: { updateMany, findUniqueOrThrow },
    });

    await service.checkOut({ spaceOwner: { id: 7n } }, 10);

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 10n, idOwner: 7n, status: 'aktif' },
      data: {
        status: 'selesai',
        checkOutAt: expect.any(Date),
        version: { increment: 1 },
      },
    });
  });

  it('allows member cancellation only from legal states and scopes by member', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const findUniqueOrThrow = vi.fn().mockResolvedValue(
      reservation({ status: 'dibatalkan' }),
    );
    const service = new ReservationsService({
      reservation: { updateMany, findUniqueOrThrow },
    } as never);

    await service.cancelMember({ member: { id: 3n } }, 10);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: 10n,
        idMember: 3n,
        status: { in: ['belum_dikonfirm', 'disetujui'] },
      },
      data: {
        status: 'dibatalkan',
        version: { increment: 1 },
      },
    });
  });
});
