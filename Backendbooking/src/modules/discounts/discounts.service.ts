import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CheckPromoDto } from './dto/discount.dto.js';
import { CreateDiskonDto, UpdateDiskonDto } from './dto/create-discount.dto.js';

@Injectable()
export class DiscountsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findActive() {
    const now = new Date();
    const discounts = await this.prisma.discount.findMany({
      where: {
        archivedAt: null,
        tanggalAwal: { lte: now },
        tanggalAkhir: { gte: now },
      },
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
    const where: any = {
      namaDiskon: dto.nama_diskon,
      archivedAt: null,
      tanggalAwal: { lte: now },
      tanggalAkhir: { gte: now },
    };

    if (dto.id_space) {
      const space = await this.prisma.space.findUnique({
        where: { id: BigInt(dto.id_space) },
      });
      if (space) {
        where.idOwner = space.idOwner;
      }
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

  async findAllAdmin(user: any) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const discounts = await this.prisma.discount.findMany({
      where: {
        idOwner: user.spaceOwner.id,
        archivedAt: null,
      },
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

  async createAdmin(user: any, dto: CreateDiskonDto) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const existing = await this.prisma.discount.findFirst({
      where: {
        idOwner: user.spaceOwner.id,
        namaDiskon: dto.nama_diskon,
        archivedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Kode promo sudah ada untuk space ini!');
    }

    const discount = await this.prisma.discount.create({
      data: {
        idOwner: user.spaceOwner.id,
        namaDiskon: dto.nama_diskon,
        persentaseDiskon: dto.persentase_diskon,
        tanggalAwal: new Date(dto.tanggal_awal),
        tanggalAkhir: new Date(dto.tanggal_akhir),
      },
    });

    return {
      message: 'Kode promo baru berhasil dibuat!',
      data: {
        id: discount.id,
        nama_diskon: discount.namaDiskon,
        persentase_diskon: discount.persentaseDiskon,
        tanggal_awal: discount.tanggalAwal.toISOString(),
        tanggal_akhir: discount.tanggalAkhir.toISOString(),
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

    return {
      id: discount.id,
      nama_diskon: discount.namaDiskon,
      persentase_diskon: discount.persentaseDiskon,
      tanggal_awal: discount.tanggalAwal.toISOString(),
      tanggal_akhir: discount.tanggalAkhir.toISOString(),
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

    const updated = await this.prisma.discount.update({
      where: { id: existing.id },
      data: {
        namaDiskon: dto.nama_diskon ?? existing.namaDiskon,
        persentaseDiskon: dto.persentase_diskon ?? existing.persentaseDiskon,
        tanggalAwal: dto.tanggal_awal ? new Date(dto.tanggal_awal) : existing.tanggalAwal,
        tanggalAkhir: dto.tanggal_akhir ? new Date(dto.tanggal_akhir) : existing.tanggalAkhir,
        version: { increment: 1 },
      },
    });

    return {
      message: 'Data promo diskon berhasil diperbarui!',
      data: {
        id: updated.id,
        nama_diskon: updated.namaDiskon,
        persentase_diskon: updated.persentaseDiskon,
        tanggal_awal: updated.tanggalAwal.toISOString(),
        tanggal_akhir: updated.tanggalAkhir.toISOString(),
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
      data: { archivedAt: new Date() },
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
