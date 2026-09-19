import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CheckPromoDto } from './dto/discount.dto.js';
import {
  CreateDiskonDto,
  UpdateDiskonDto,
  AdminPromotionQueryDto,
} from './dto/create-discount.dto.js';

function computePromoStatus(
  awal: Date,
  akhir: Date,
  now: Date,
): 'upcoming' | 'active' | 'expired' {
  if (now < awal) return 'upcoming';
  if (now > akhir) return 'expired';
  return 'active';
}

@Injectable()
export class DiscountsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findActive(idSpace?: number) {
    const now = new Date();
    const where: any = {
      archivedAt: null,
      tanggalAwal: { lte: now },
      tanggalAkhir: { gte: now },
    };

    if (idSpace) {
      const space = await this.prisma.space.findUnique({
        where: { id: BigInt(idSpace) },
      });
      if (space && !space.archivedAt) {
        where.idOwner = space.idOwner;
      }
    }

    const discounts = await this.prisma.discount.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    return discounts.map((d) => ({
      id: d.id,
      nama_diskon: d.namaDiskon,
      persentase_diskon: d.persentaseDiskon,
      tanggal_awal: d.tanggalAwal.toISOString(),
      tanggal_akhir: d.tanggalAkhir.toISOString(),
    }));
  }

  async checkPromo(dto: CheckPromoDto) {
    const now = new Date();
    const normalizedCode = dto.nama_diskon.trim().toUpperCase();

    const where: any = {
      namaDiskon: normalizedCode,
      archivedAt: null,
      tanggalAwal: { lte: now },
      tanggalAkhir: { gte: now },
    };

    if (dto.id_space) {
      const space = await this.prisma.space.findUnique({
        where: { id: BigInt(dto.id_space) },
      });
      if (!space || space.archivedAt) {
        throw new BadRequestException('Space yang dituju tidak valid atau telah diarsipkan');
      }
      where.idOwner = space.idOwner;
    }

    const discount = await this.prisma.discount.findFirst({
      where,
    });

    if (!discount) {
      throw new BadRequestException(
        'Kode promo tidak ditemukan atau sudah kedaluwarsa!',
      );
    }

    return {
      message: 'Kode promo valid dan masih berlaku!',
      data: {
        id: discount.id,
        nama_diskon: discount.namaDiskon,
        persentase_diskon: discount.persentaseDiskon,
        tanggal_awal: discount.tanggalAwal.toISOString(),
        tanggal_akhir: discount.tanggalAkhir.toISOString(),
        is_active: true,
      },
    };
  }

  async findOnePublic(id: number) {
    const discount = await this.prisma.discount.findFirst({
      where: {
        id: BigInt(id),
        archivedAt: null,
      },
    });

    if (!discount) {
      throw new NotFoundException('Diskon tidak ditemukan!');
    }

    return {
      id: discount.id,
      nama_diskon: discount.namaDiskon,
      persentase_diskon: discount.persentaseDiskon,
      tanggal_awal: discount.tanggalAwal.toISOString(),
      tanggal_akhir: discount.tanggalAkhir.toISOString(),
    };
  }

  async findAllAdmin(user: any, query?: AdminPromotionQueryDto) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const ownerId = user.spaceOwner.id;
    const now = new Date();

    const where: any = {
      idOwner: ownerId,
      archivedAt: null,
    };

    if (query?.search && query.search.trim()) {
      where.namaDiskon = {
        contains: query.search.trim().toUpperCase(),
      };
    }

    if (query?.status === 'upcoming') {
      where.tanggalAwal = { gt: now };
    } else if (query?.status === 'active') {
      where.tanggalAwal = { lte: now };
      where.tanggalAkhir = { gte: now };
    } else if (query?.status === 'expired') {
      where.tanggalAkhir = { lt: now };
    }

    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [total, discounts] = await Promise.all([
      this.prisma.discount.count({ where }),
      this.prisma.discount.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    const items = discounts.map((d) => ({
      id: d.id,
      nama_diskon: d.namaDiskon,
      persentase_diskon: d.persentaseDiskon,
      tanggal_awal: d.tanggalAwal.toISOString(),
      tanggal_akhir: d.tanggalAkhir.toISOString(),
      status: computePromoStatus(d.tanggalAwal, d.tanggalAkhir, now),
      version: d.version,
      created_at: d.createdAt.toISOString(),
      updated_at: d.updatedAt.toISOString(),
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
      context: {
        server_now: now.toISOString(),
        business_timezone: 'Asia/Jakarta',
      },
    };
  }

  async createAdmin(user: any, dto: CreateDiskonDto) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const normalizedCode = dto.nama_diskon.trim().toUpperCase();
    const startDate = new Date(dto.tanggal_awal);
    const endDate = new Date(dto.tanggal_akhir);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      throw new BadRequestException('Format tanggal tidak valid atau tanggal akhir mendahului tanggal awal.');
    }

    const existing = await this.prisma.discount.findFirst({
      where: {
        idOwner: user.spaceOwner.id,
        namaDiskon: normalizedCode,
        archivedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Kode promo sudah terdaftar untuk coworking space Anda!');
    }

    const discount = await this.prisma.discount.create({
      data: {
        idOwner: user.spaceOwner.id,
        namaDiskon: normalizedCode,
        persentaseDiskon: dto.persentase_diskon,
        tanggalAwal: startDate,
        tanggalAkhir: endDate,
      },
    });

    const now = new Date();

    return {
      message: 'Kode promo baru berhasil dibuat!',
      data: {
        id: discount.id,
        nama_diskon: discount.namaDiskon,
        persentase_diskon: discount.persentaseDiskon,
        tanggal_awal: discount.tanggalAwal.toISOString(),
        tanggal_akhir: discount.tanggalAkhir.toISOString(),
        status: computePromoStatus(discount.tanggalAwal, discount.tanggalAkhir, now),
        version: discount.version,
        created_at: discount.createdAt.toISOString(),
        updated_at: discount.updatedAt.toISOString(),
      },
    };
  }

  async findOneAdmin(user: any, id: number) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const discount = await this.prisma.discount.findFirst({
      where: {
        id: BigInt(id),
        idOwner: user.spaceOwner.id,
        archivedAt: null,
      },
    });

    if (!discount) {
      throw new NotFoundException('Diskon tidak ditemukan!');
    }

    const now = new Date();

    return {
      id: discount.id,
      nama_diskon: discount.namaDiskon,
      persentase_diskon: discount.persentaseDiskon,
      tanggal_awal: discount.tanggalAwal.toISOString(),
      tanggal_akhir: discount.tanggalAkhir.toISOString(),
      status: computePromoStatus(discount.tanggalAwal, discount.tanggalAkhir, now),
      version: discount.version,
      created_at: discount.createdAt.toISOString(),
      updated_at: discount.updatedAt.toISOString(),
    };
  }

  async updateAdmin(user: any, id: number, dto: UpdateDiskonDto) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const existing = await this.prisma.discount.findFirst({
      where: {
        id: BigInt(id),
        idOwner: user.spaceOwner.id,
        archivedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Diskon tidak ditemukan!');
    }

    if (dto.expected_version !== undefined && dto.expected_version !== existing.version) {
      throw new ConflictException('Data promosi telah diubah oleh sesi lain. Silakan muat ulang data terbaru.');
    }

    const newStart = dto.tanggal_awal ? new Date(dto.tanggal_awal) : existing.tanggalAwal;
    const newEnd = dto.tanggal_akhir ? new Date(dto.tanggal_akhir) : existing.tanggalAkhir;

    if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime()) || newEnd < newStart) {
      throw new BadRequestException('Rentang tanggal tidak valid atau tanggal akhir mendahului tanggal awal.');
    }

    const normalizedCode = dto.nama_diskon ? dto.nama_diskon.trim().toUpperCase() : existing.namaDiskon;

    if (dto.nama_diskon && normalizedCode !== existing.namaDiskon) {
      const duplicate = await this.prisma.discount.findFirst({
        where: {
          idOwner: user.spaceOwner.id,
          namaDiskon: normalizedCode,
          archivedAt: null,
          id: { not: existing.id },
        },
      });
      if (duplicate) {
        throw new ConflictException('Kode promo sudah digunakan oleh promosi lain.');
      }
    }

    const updated = await this.prisma.discount.update({
      where: { id: existing.id },
      data: {
        namaDiskon: normalizedCode,
        persentaseDiskon: dto.persentase_diskon ?? existing.persentaseDiskon,
        tanggalAwal: newStart,
        tanggalAkhir: newEnd,
        version: { increment: 1 },
      },
    });

    const now = new Date();

    return {
      message: 'Data promo diskon berhasil diperbarui!',
      data: {
        id: updated.id,
        nama_diskon: updated.namaDiskon,
        persentase_diskon: updated.persentaseDiskon,
        tanggal_awal: updated.tanggalAwal.toISOString(),
        tanggal_akhir: updated.tanggalAkhir.toISOString(),
        status: computePromoStatus(updated.tanggalAwal, updated.tanggalAkhir, now),
        version: updated.version,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      },
    };
  }

  async deleteAdmin(user: any, id: number) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const existing = await this.prisma.discount.findFirst({
      where: {
        id: BigInt(id),
        idOwner: user.spaceOwner.id,
        archivedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Diskon tidak ditemukan!');
    }

    await this.prisma.discount.update({
      where: { id: existing.id },
      data: {
        archivedAt: new Date(),
        version: { increment: 1 },
      },
    });

    return {
      message: 'Kode promo berhasil dihapus!',
      data: {
        id: existing.id,
        deleted: true,
      },
    };
  }
}
