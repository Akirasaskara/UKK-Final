import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { STORAGE_SERVICE } from '../../infrastructure/storage/storage.module.js';
import type { StorageService } from '../../infrastructure/storage/storage.interface.js';
import {
  CreateSpaceDto,
  UpdateSpaceDto,
  AdminSpaceQueryDto,
  CheckAvailabilityQueryDto,
} from './dto/space.dto.js';
import { calculateEndTime } from '../../common/utils/time.util.js';

@Injectable()
export class SpacesService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private storage: StorageService,
  ) {}

  getTypes() {
    return [
      {
        tipe: 'desk',
        label: 'Personal Desk',
        deskripsi:
          'Meja kerja individual yang nyaman dengan fasilitas colokan listrik, WiFi kencang, dan air minum.',
      },
      {
        tipe: 'meeting_room',
        label: 'Meeting Room',
        deskripsi:
          'Ruang rapat tertutup dengan fasilitas proyektor/TV LED, whiteboard, sound system, dan AC dingin.',
      },
      {
        tipe: 'private_office',
        label: 'Private Office',
        deskripsi:
          'Ruang kantor privat eksklusif untuk tim kecil hingga menengah dengan akses fleksibel dan keamanan 24 jam.',
      },
    ];
  }

  async findAllPublic(tipe?: string, search?: string) {
    const where: any = {
      archivedAt: null,
    };

    if (tipe) {
      where.tipe = tipe;
    }

    if (search) {
      where.OR = [
        { namaSpace: { contains: search } },
        { deskripsi: { contains: search } },
      ];
    }

    const spaces = await this.prisma.space.findMany({
      where,
      include: {
        owner: true,
      },
      orderBy: { id: 'asc' },
    });

    return spaces.map((s) => ({
      id: s.id,
      nama_space: s.namaSpace,
      harga_per_jam: s.hargaPerJam,
      tipe: s.tipe,
      kapasitas: s.kapasitas,
      foto: s.foto,
      deskripsi: s.deskripsi,
      id_owner: s.idOwner,
      owner: s.owner
        ? {
            id: s.owner.id,
            nama_coworking: s.owner.namaCoworking,
            nama_pemilik: s.owner.namaPemilik,
            telp: s.owner.telp,
          }
        : null,
      foto_url: s.foto ? this.storage.getPublicUrl('spaces', s.foto) : null,
    }));
  }

  async findOnePublic(id: number) {
    const space = await this.prisma.space.findFirst({
      where: {
        id: BigInt(id),
        archivedAt: null,
      },
      include: {
        owner: true,
      },
    });

    if (!space) {
      throw new NotFoundException('Space dengan ID tersebut tidak ditemukan!');
    }

    return {
      id: space.id,
      nama_space: space.namaSpace,
      harga_per_jam: space.hargaPerJam,
      tipe: space.tipe,
      kapasitas: space.kapasitas,
      foto: space.foto,
      deskripsi: space.deskripsi,
      id_owner: space.idOwner,
      owner: space.owner
        ? {
            id: space.owner.id,
            nama_coworking: space.owner.namaCoworking,
            nama_pemilik: space.owner.namaPemilik,
            telp: space.owner.telp,
          }
        : null,
      foto_url: space.foto ? this.storage.getPublicUrl('spaces', space.foto) : null,
    };
  }

  async checkAvailability(query: CheckAvailabilityQueryDto) {
    const spaceId = BigInt(query.id_space);
    const space = await this.prisma.space.findFirst({
      where: { id: spaceId, archivedAt: null },
    });

    if (!space) {
      throw new NotFoundException('Space tidak ditemukan!');
    }

    let jamSelesai: string;
    try {
      jamSelesai = calculateEndTime(query.jam_mulai, query.durasi_jam);
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Format jam mulai atau durasi tidak valid');
    }
    const targetDate = new Date(`${query.tanggal}T00:00:00.000Z`);

    const requestedStartTime = new Date(`1970-01-01T${query.jam_mulai}:00.000Z`);
    const requestedEndTime =
      jamSelesai === '24:00'
        ? new Date('1970-01-01T23:59:59.000Z')
        : new Date(`1970-01-01T${jamSelesai}:00.000Z`);

    const overlappingReservations = await this.prisma.reservation.findMany({
      where: {
        idSpace: spaceId,
        tanggalReservasi: targetDate,
        status: {
          in: ['belum_dikonfirm', 'disetujui', 'aktif'],
        },
        AND: [
          { jamMulai: { lt: requestedEndTime } },
          { jamSelesai: { gt: requestedStartTime } },
        ],
      },
    });

    if (overlappingReservations.length > 0) {
      throw new BadRequestException(
        'Maaf, space sudah terisi atau dibooking pada jam tersebut!',
      );
    }

    const estimasiTotal = Number(space.hargaPerJam) * query.durasi_jam;

    return {
      message: 'Space tersedia untuk dipesan pada jadwal yang diminta',
      data: {
        available: true,
        id_space: space.id,
        nama_space: space.namaSpace,
        tanggal: query.tanggal,
        jam_mulai: query.jam_mulai,
        jam_selesai: jamSelesai,
        durasi_jam: query.durasi_jam,
        harga_per_jam: space.hargaPerJam,
        estimasi_total: estimasiTotal,
      },
    };
  }

  async findAllAdmin(user: any, query?: AdminSpaceQueryDto) {
    if (!user.spaceOwner) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const where: any = {
      idOwner: user.spaceOwner.id,
      archivedAt: null,
    };

    if (query?.tipe) {
      where.tipe = query.tipe;
    }

    if (query?.search && query.search.trim()) {
      where.OR = [
        { namaSpace: { contains: query.search.trim() } },
        { deskripsi: { contains: query.search.trim() } },
      ];
    }

    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [total, spaces] = await Promise.all([
      this.prisma.space.count({ where }),
      this.prisma.space.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    const items = spaces.map((s) => ({
      id: s.id,
      nama_space: s.namaSpace,
      harga_per_jam: s.hargaPerJam,
      tipe: s.tipe,
      kapasitas: s.kapasitas,
      deskripsi: s.deskripsi,
      foto: s.foto,
      foto_url: s.foto ? this.storage.getPublicUrl('spaces', s.foto) : null,
      version: s.version,
      created_at: s.createdAt.toISOString(),
      updated_at: s.updatedAt.toISOString(),
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createAdmin(user: any, dto: CreateSpaceDto) {
    if (!user.spaceOwner) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const space = await this.prisma.$transaction(async (tx) => {
      const created = await tx.space.create({
        data: {
          idOwner: user.spaceOwner.id,
          namaSpace: dto.nama_space.trim(),
          hargaPerJam: BigInt(dto.harga_per_jam),
          tipe: dto.tipe,
          kapasitas: dto.kapasitas,
          deskripsi: dto.deskripsi.trim(),
          foto: dto.foto || null,
        },
      });

      if (dto.foto) {
        await tx.mediaUpload.updateMany({
          where: {
            objectKey: dto.foto,
            ownerId: user.spaceOwner.id,
            purpose: 'space_photo',
          },
          data: {
            status: 'attached',
            attachedEntityType: 'space',
            attachedEntityId: created.id,
          },
        });
      }

      return created;
    });

    return {
      message: 'Space baru berhasil ditambahkan!',
      data: {
        id: space.id,
        nama_space: space.namaSpace,
        harga_per_jam: space.hargaPerJam,
        tipe: space.tipe,
        kapasitas: space.kapasitas,
        deskripsi: space.deskripsi,
        foto: space.foto,
        foto_url: space.foto ? this.storage.getPublicUrl('spaces', space.foto) : null,
        id_owner: space.idOwner,
        version: space.version,
        created_at: space.createdAt.toISOString(),
        updated_at: space.updatedAt.toISOString(),
      },
    };
  }

  async findOneAdmin(user: any, id: number) {
    if (!user.spaceOwner) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const space = await this.prisma.space.findFirst({
      where: {
        id: BigInt(id),
        idOwner: user.spaceOwner.id,
        archivedAt: null,
      },
    });

    if (!space) {
      throw new NotFoundException('Space tidak ditemukan!');
    }

    return {
      id: space.id,
      nama_space: space.namaSpace,
      harga_per_jam: space.hargaPerJam,
      tipe: space.tipe,
      kapasitas: space.kapasitas,
      deskripsi: space.deskripsi,
      foto: space.foto,
      foto_url: space.foto ? this.storage.getPublicUrl('spaces', space.foto) : null,
      version: space.version,
      created_at: space.createdAt.toISOString(),
      updated_at: space.updatedAt.toISOString(),
    };
  }

  async updateAdmin(user: any, id: number, dto: UpdateSpaceDto) {
    if (!user.spaceOwner) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const existing = await this.prisma.space.findFirst({
      where: {
        id: BigInt(id),
        idOwner: user.spaceOwner.id,
        archivedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Space tidak ditemukan!');
    }

    if (dto.expected_version !== undefined && dto.expected_version !== existing.version) {
      throw new ConflictException('Data space telah diubah oleh sesi lain. Silakan muat ulang data terbaru.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.space.update({
        where: { id: existing.id },
        data: {
          namaSpace: dto.nama_space !== undefined ? dto.nama_space.trim() : existing.namaSpace,
          hargaPerJam:
            dto.harga_per_jam !== undefined
              ? BigInt(dto.harga_per_jam)
              : existing.hargaPerJam,
          tipe: dto.tipe ?? existing.tipe,
          kapasitas: dto.kapasitas ?? existing.kapasitas,
          deskripsi: dto.deskripsi !== undefined ? dto.deskripsi.trim() : existing.deskripsi,
          foto: dto.foto !== undefined ? dto.foto : existing.foto,
          version: { increment: 1 },
        },
      });

      if (dto.foto && dto.foto !== existing.foto) {
        await tx.mediaUpload.updateMany({
          where: {
            objectKey: dto.foto,
            ownerId: user.spaceOwner.id,
            purpose: 'space_photo',
          },
          data: {
            status: 'attached',
            attachedEntityType: 'space',
            attachedEntityId: res.id,
          },
        });
      }

      return res;
    });

    return {
      message: 'Data space berhasil diperbarui!',
      data: {
        id: updated.id,
        nama_space: updated.namaSpace,
        harga_per_jam: updated.hargaPerJam,
        tipe: updated.tipe,
        kapasitas: updated.kapasitas,
        deskripsi: updated.deskripsi,
        foto: updated.foto,
        foto_url: updated.foto ? this.storage.getPublicUrl('spaces', updated.foto) : null,
        version: updated.version,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      },
    };
  }

  async deleteAdmin(user: any, id: number) {
    if (!user.spaceOwner) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const existing = await this.prisma.space.findFirst({
      where: {
        id: BigInt(id),
        idOwner: user.spaceOwner.id,
        archivedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Space tidak ditemukan!');
    }

    await this.prisma.space.update({
      where: { id: existing.id },
      data: {
        archivedAt: new Date(),
        version: { increment: 1 },
      },
    });

    return {
      message: 'Space berhasil dihapus!',
      data: {
        id: existing.id,
        deleted: true,
      },
    };
  }
}
