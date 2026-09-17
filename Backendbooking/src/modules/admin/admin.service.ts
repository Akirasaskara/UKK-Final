import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service.js';
import {
  UpdateCoworkingProfileDto,
  CreateMemberAdminDto,
  UpdateMemberAdminDto,
  UpdateReservasiStatusDto,
  ReportQueryDto,
} from './dto/admin.dto.js';

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getProfile(user: any) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const owner = await this.prisma.spaceOwner.findUnique({
      where: { id: user.spaceOwner.id },
    });

    if (!owner) {
      throw new NotFoundException('Profil coworking space tidak ditemukan');
    }

    return {
      id: owner.id,
      nama_coworking: owner.namaCoworking,
      nama_pemilik: owner.namaPemilik,
      telp: owner.telp,
      alamat: owner.alamat,
      deskripsi_fasilitas: owner.deskripsiFasilitas,
    };
  }

  async updateProfile(user: any, dto: UpdateCoworkingProfileDto) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const updated = await this.prisma.spaceOwner.update({
      where: { id: user.spaceOwner.id },
      data: {
        namaCoworking: dto.nama_coworking,
        namaPemilik: dto.nama_pemilik,
        telp: dto.telp,
        alamat: dto.alamat !== undefined ? dto.alamat : undefined,
        deskripsiFasilitas:
          dto.deskripsi_fasilitas !== undefined
            ? dto.deskripsi_fasilitas
            : undefined,
      },
    });

    return {
      message: 'Profil Coworking Space berhasil diperbarui!',
      data: {
        id: updated.id,
        nama_coworking: updated.namaCoworking,
        nama_pemilik: updated.namaPemilik,
        telp: updated.telp,
      },
    };
  }

  async findMembers(user: any, search?: string) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const ownerId = user.spaceOwner.id;

    const where: any = {
      archivedAt: null,
      reservations: {
        some: {
          idOwner: ownerId,
        },
      },
    };

    if (search) {
      where.OR = [
        { namaMember: { contains: search } },
        { instansi: { contains: search } },
        { telp: { contains: search } },
      ];
    }

    const members = await this.prisma.member.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      nama_member: m.namaMember,
      instansi: m.instansi,
      alamat: m.alamat,
      telp: m.telp,
      foto: m.foto,
      created_at: m.createdAt.toISOString(),
    }));
  }

  async createMemberAssisted(dto: CreateMemberAdminDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new BadRequestException('Username sudah digunakan oleh akun lain!');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: dto.username,
          passwordHash,
          role: 'member',
        },
      });

      const member = await tx.member.create({
        data: {
          idUser: user.id,
          roleGuard: 'member',
          namaMember: dto.nama_member,
          instansi: dto.instansi,
          alamat: dto.alamat,
          telp: dto.telp,
          foto: dto.foto || null,
        },
      });

      return {
        message: 'Data member baru berhasil ditambahkan!',
        data: {
          id: member.id,
          nama_member: member.namaMember,
          instansi: member.instansi,
          alamat: member.alamat,
          telp: member.telp,
          foto: member.foto,
        },
      };
    });
  }

  async findOneMember(user: any, id: number) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const memberId = BigInt(id);
    const ownerId = user.spaceOwner.id;

    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        archivedAt: null,
        reservations: {
          some: {
            idOwner: ownerId,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member tidak ditemukan');
    }

    return {
      id: member.id,
      nama_member: member.namaMember,
      instansi: member.instansi,
      alamat: member.alamat,
      telp: member.telp,
      foto: member.foto,
    };
  }

  async updateMember(user: any, id: number, dto: UpdateMemberAdminDto) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const memberId = BigInt(id);
    const ownerId = user.spaceOwner.id;

    const existing = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        archivedAt: null,
        reservations: {
          some: {
            idOwner: ownerId,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Member tidak ditemukan');
    }

    const updated = await this.prisma.member.update({
      where: { id: existing.id },
      data: {
        namaMember: dto.nama_member ?? existing.namaMember,
        instansi: dto.instansi ?? existing.instansi,
        alamat: dto.alamat ?? existing.alamat,
        telp: dto.telp ?? existing.telp,
        foto: dto.foto !== undefined ? dto.foto : existing.foto,
      },
    });

    return {
      message: 'Data member berhasil diperbarui!',
      data: {
        id: updated.id,
        nama_member: updated.namaMember,
        instansi: updated.instansi,
        alamat: updated.alamat,
        telp: updated.telp,
      },
    };
  }

  deleteMember() {
    throw new ConflictException(
      'Akun member tidak dapat dihapus oleh pengelola karena merupakan akun pelanggan global.',
    );
  }

  async findReservations(user: any, query: any) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const where: any = {
      idOwner: user.spaceOwner.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.id_space) {
      where.idSpace = BigInt(query.id_space);
    }

    if (query.tanggal) {
      where.tanggalReservasi = new Date(`${query.tanggal}T00:00:00.000Z`);
    } else if (query.month || query.year) {
      const year = query.year ? parseInt(query.year, 10) : new Date().getFullYear();
      const month = query.month ? parseInt(query.month, 10) : new Date().getMonth() + 1;
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 1));
      where.tanggalReservasi = { gte: startDate, lt: endDate };
    }

    const reservations = await this.prisma.reservation.findMany({
      where,
      include: {
        member: true,
        space: true,
        detail: true,
      },
      orderBy: { id: 'desc' },
    });

    return reservations.map((r) => {
      const dateStr = r.tanggalReservasi.toISOString().split('T')[0];
      const startStr = r.jamMulai.toISOString().split('T')[1].substring(0, 5);
      const endStr = r.jamSelesai.toISOString().split('T')[1].substring(0, 5);

      return {
        id: r.id,
        kode_booking: r.kodeBooking,
        tanggal_reservasi: dateStr,
        jam_mulai: startStr,
        jam_selesai: endStr,
        durasi_jam: r.durasiJam,
        total_harga_awal: r.detail ? r.detail.totalHargaAwal : 0n,
        potongan_diskon: r.detail ? r.detail.potonganDiskon : 0n,
        total_bayar: r.detail ? r.detail.totalHarga : 0n,
        status: r.status,
        member: r.member
          ? {
              id: r.member.id,
              nama_member: r.member.namaMember,
              telp: r.member.telp,
            }
          : null,
        space: r.space
          ? {
              id: r.space.id,
              nama_space: r.space.namaSpace,
              tipe: r.space.tipe,
            }
          : null,
      };
    });
  }

  async updateReservationStatus(user: any, id: number, dto: UpdateReservasiStatusDto) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const resId = BigInt(id);
    const existing = await this.prisma.reservation.findFirst({
      where: {
        id: resId,
        idOwner: user.spaceOwner.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Reservasi tidak ditemukan');
    }

    if (dto.status !== 'disetujui' && dto.status !== 'dibatalkan') {
      throw new BadRequestException(
        `Perubahan status manual hanya diizinkan untuk disetujui atau dibatalkan. Gunakan check-in/out untuk status aktif/selesai.`,
      );
    }

    if (existing.status !== 'belum_dikonfirm' && existing.status !== 'disetujui') {
      throw new BadRequestException(
        `Status ${existing.status} tidak dapat diubah ke ${dto.status}!`,
      );
    }

    const updated = await this.prisma.reservation.update({
      where: { id: existing.id },
      data: {
        status: dto.status,
        version: { increment: 1 },
      },
    });

    return {
      message: `Status reservasi berhasil diperbarui menjadi ${dto.status}`,
      data: {
        id: updated.id,
        status: updated.status,
        updated_at: updated.updatedAt.toISOString(),
      },
    };
  }

  async checkIn(user: any, id: number) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const resId = BigInt(id);
    const existing = await this.prisma.reservation.findFirst({
      where: {
        id: resId,
        idOwner: user.spaceOwner.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Reservasi tidak ditemukan');
    }

    if (existing.status !== 'disetujui') {
      throw new BadRequestException(
        `Check-in hanya dapat dilakukan untuk reservasi yang sudah disetujui! Status saat ini: ${existing.status}`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.reservation.update({
      where: { id: existing.id },
      data: {
        status: 'aktif',
        checkInAt: now,
        version: { increment: 1 },
      },
    });

    return {
      message: 'Check-in member berhasil! Status reservasi aktif.',
      data: {
        id: updated.id,
        status: updated.status,
        check_in_time: updated.checkInAt?.toISOString(),
      },
    };
  }

  async checkOut(user: any, id: number) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const resId = BigInt(id);
    const existing = await this.prisma.reservation.findFirst({
      where: {
        id: resId,
        idOwner: user.spaceOwner.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Reservasi tidak ditemukan');
    }

    if (existing.status !== 'aktif') {
      throw new BadRequestException(
        `Check-out hanya dapat dilakukan untuk reservasi yang sedang aktif! Status saat ini: ${existing.status}`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.reservation.update({
      where: { id: existing.id },
      data: {
        status: 'selesai',
        checkOutAt: now,
        version: { increment: 1 },
      },
    });

    return {
      message: 'Check-out member berhasil! Reservasi telah selesai.',
      data: {
        id: updated.id,
        status: updated.status,
        check_out_time: updated.checkOutAt?.toISOString(),
      },
    };
  }

  async getMonthlyReport(user: any, query: ReportQueryDto) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const year = query.year || new Date().getFullYear();
    const month = query.month || new Date().getMonth() + 1;

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const reservations = await this.prisma.reservation.findMany({
      where: {
        idOwner: user.spaceOwner.id,
        tanggalReservasi: {
          gte: startDate,
          lt: endDate,
        },
        status: {
          in: ['disetujui', 'aktif', 'selesai'],
        },
      },
      include: {
        detail: true,
      },
    });

    let totalTransaksi = reservations.length;
    let totalJamTerpakai = 0;
    let estimasiPendapatanKotor = 0n;
    let totalPotonganDiskon = 0n;
    let realisasiPendapatanBersih = 0n;

    const typeSummary: Record<
      string,
      { label: string; totalBooking: number; totalJam: number; totalPendapatan: bigint }
    > = {
      desk: { label: 'Personal Desk', totalBooking: 0, totalJam: 0, totalPendapatan: 0n },
      meeting_room: { label: 'Meeting Room', totalBooking: 0, totalJam: 0, totalPendapatan: 0n },
      private_office: { label: 'Private Office', totalBooking: 0, totalJam: 0, totalPendapatan: 0n },
    };

    for (const r of reservations) {
      const durasi = r.durasiJam;
      totalJamTerpakai += durasi;

      if (r.detail) {
        const kotor = r.detail.totalHargaAwal;
        const potongan = r.detail.potonganDiskon;
        const bersih = r.detail.totalHarga;

        estimasiPendapatanKotor += kotor;
        totalPotonganDiskon += potongan;

        if (r.status === 'selesai') {
          realisasiPendapatanBersih += bersih;
        }

        const tipe = r.detail.tipeSpaceSnapshot;
        if (typeSummary[tipe]) {
          typeSummary[tipe].totalBooking += 1;
          typeSummary[tipe].totalJam += durasi;
          typeSummary[tipe].totalPendapatan += bersih;
        }
      }
    }

    return {
      month,
      year,
      total_transaksi: totalTransaksi,
      total_jam_terpakai: totalJamTerpakai,
      estimasi_pendapatan_kotor: estimasiPendapatanKotor,
      total_potongan_diskon: totalPotonganDiskon,
      realisasi_pendapatan_bersih: realisasiPendapatanBersih,
      rincian_per_tipe_space: [
        {
          tipe: 'desk',
          label: typeSummary.desk.label,
          total_booking: typeSummary.desk.totalBooking,
          total_jam: typeSummary.desk.totalJam,
          total_pendapatan: typeSummary.desk.totalPendapatan,
        },
        {
          tipe: 'meeting_room',
          label: typeSummary.meeting_room.label,
          total_booking: typeSummary.meeting_room.totalBooking,
          total_jam: typeSummary.meeting_room.totalJam,
          total_pendapatan: typeSummary.meeting_room.totalPendapatan,
        },
        {
          tipe: 'private_office',
          label: typeSummary.private_office.label,
          total_booking: typeSummary.private_office.totalBooking,
          total_jam: typeSummary.private_office.totalJam,
          total_pendapatan: typeSummary.private_office.totalPendapatan,
        },
      ],
    };
  }

  async getIncomeAlias(user: any, query: ReportQueryDto) {
    const report = await this.getMonthlyReport(user, query);
    return {
      month: report.month,
      year: report.year,
      realisasi_pendapatan_bersih: report.realisasi_pendapatan_bersih,
    };
  }
}
