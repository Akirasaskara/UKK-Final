import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateSpaceDto,
  UpdateSpaceDto,
  CheckAvailabilityQueryDto,
} from './dto/space.dto.js';
import { calculateEndTime } from '../../common/utils/time.util.js';

@Injectable()
export class SpacesService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

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
      foto_url: s.foto ? `http://localhost:3000/uploads/spaces/${s.foto}` : null,
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
      foto_url: space.foto
        ? `http://localhost:3000/uploads/spaces/${space.foto}`
        : null,
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

    const jamSelesai = calculateEndTime(query.jam_mulai, query.durasi_jam);
    const targetDate = new Date(`${query.tanggal}T00:00:00.000Z`);

    const requestedStartTime = new Date(`1970-01-01T${query.jam_mulai}:00.000Z`);
    const requestedEndTime = new Date(`1970-01-01T${jamSelesai}:00.000Z`);

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

  async findAllAdmin(user: any) {
    if (!user.spaceOwner) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const spaces = await this.prisma.space.findMany({
      where: {
        idOwner: user.spaceOwner.id,
        archivedAt: null,
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
      foto_url: s.foto ? `http://localhost:3000/uploads/spaces/${s.foto}` : null,
    }));
  }

  async createAdmin(user: any, dto: CreateSpaceDto) {
    if (!user.spaceOwner) {
      throw new ForbiddenException('Akses hanya untuk admin space yang terdaftar');
    }

    const space = await this.prisma.space.create({
      data: {
        idOwner: user.spaceOwner.id,
        namaSpace: dto.nama_space,
        hargaPerJam: BigInt(dto.harga_per_jam),
        tipe: dto.tipe,
        kapasitas: dto.kapasitas,
        deskripsi: dto.deskripsi,
        foto: dto.foto || null,
      },
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
        id_owner: space.idOwner,
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

    const updated = await this.prisma.space.update({
      where: { id: existing.id },
      data: {
        namaSpace: dto.nama_space ?? existing.namaSpace,
        hargaPerJam:
          dto.harga_per_jam !== undefined
            ? BigInt(dto.harga_per_jam)
            : existing.hargaPerJam,
        tipe: dto.tipe ?? existing.tipe,
        kapasitas: dto.kapasitas ?? existing.kapasitas,
        deskripsi: dto.deskripsi ?? existing.deskripsi,
        foto: dto.foto !== undefined ? dto.foto : existing.foto,
        version: { increment: 1 },
      },
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
      data: { archivedAt: new Date() },
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
