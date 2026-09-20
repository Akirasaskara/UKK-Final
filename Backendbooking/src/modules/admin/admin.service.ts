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
import { STORAGE_SERVICE } from '../../infrastructure/storage/storage.module.js';
import type { StorageService } from '../../infrastructure/storage/storage.interface.js';
import {
  UpdateCoworkingProfileDto,
  CreateMemberAdminDto,
  UpdateMemberAdminDto,
  AdminMemberQueryDto,
  UpdateReservasiStatusDto,
  ReportQueryDto,
  ReportSummaryQueryDto,
} from './dto/admin.dto.js';
import { getJakartaDateString } from '../../common/utils/time.util.js';
import {
  validateReportRange,
  generateTimeBuckets,
  findBucketIndex,
  parseDateOnlyUtc,
  formatDateOnlyUtc,
} from '../../common/utils/report-period.util.js';

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private storage: StorageService,
  ) {}

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
        alamat: updated.alamat,
        deskripsi_fasilitas: updated.deskripsiFasilitas,
      },
    };
  }

  async getDashboardSummary(user: any) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const ownerId = user.spaceOwner.id;
    const todayStr = getJakartaDateString();
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    const [
      pendingCount,
      activeCount,
      spacesCount,
      membersCount,
      pendingQueue,
      todayReservations,
    ] = await Promise.all([
      this.prisma.reservation.count({
        where: { idOwner: ownerId, status: 'belum_dikonfirm' },
      }),
      this.prisma.reservation.count({
        where: { idOwner: ownerId, status: 'aktif' },
      }),
      this.prisma.space.count({
        where: { idOwner: ownerId, archivedAt: null },
      }),
      this.prisma.member.count({
        where: {
          archivedAt: null,
          reservations: {
            some: { idOwner: ownerId },
          },
        },
      }),
      this.prisma.reservation.findMany({
        where: { idOwner: ownerId, status: 'belum_dikonfirm' },
        include: { member: true, space: true, detail: true },
        orderBy: { id: 'desc' },
        take: 5,
      }),
      this.prisma.reservation.findMany({
        where: { idOwner: ownerId, tanggalReservasi: todayDate },
        include: { member: true, space: true, detail: true },
        orderBy: { jamMulai: 'asc' },
        take: 5,
      }),
    ]);

    return {
      message: 'Ringkasan dashboard berhasil dimuat',
      data: {
        metrics: {
          pending_reservations: pendingCount,
          active_reservations: activeCount,
          active_spaces: spacesCount,
          total_members: membersCount,
        },
        pending_queue: pendingQueue.map((r) => ({
          id: r.id,
          kode_booking: r.kodeBooking,
          tanggal_reservasi: r.tanggalReservasi.toISOString().split('T')[0],
          jam_mulai: r.jamMulai.toISOString().split('T')[1].substring(0, 5),
          jam_selesai: r.jamSelesai.toISOString().split('T')[1].substring(0, 5),
          durasi_jam: r.durasiJam,
          total_bayar: r.detail?.totalHarga || 0,
          status: r.status,
          member_name: r.detail?.namaMemberSnapshot ?? r.member?.namaMember ?? 'Member',
          space_name: r.detail?.namaSpaceSnapshot ?? r.space?.namaSpace ?? 'Space',
        })),
        today_reservations: todayReservations.map((r) => ({
          id: r.id,
          kode_booking: r.kodeBooking,
          tanggal_reservasi: r.tanggalReservasi.toISOString().split('T')[0],
          jam_mulai: r.jamMulai.toISOString().split('T')[1].substring(0, 5),
          jam_selesai: r.jamSelesai.toISOString().split('T')[1].substring(0, 5),
          durasi_jam: r.durasiJam,
          total_bayar: r.detail?.totalHarga || 0,
          status: r.status,
          member_name: r.detail?.namaMemberSnapshot ?? r.member?.namaMember ?? 'Member',
          space_name: r.detail?.namaSpaceSnapshot ?? r.space?.namaSpace ?? 'Space',
        })),
      },
    };
  }

  async findMembers(user: any, query?: AdminMemberQueryDto) {
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

    if (query?.search && query.search.trim()) {
      where.OR = [
        { namaMember: { contains: query.search.trim() } },
        { instansi: { contains: query.search.trim() } },
        { telp: { contains: query.search.trim() } },
      ];
    }

    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [total, members] = await Promise.all([
      this.prisma.member.count({ where }),
      this.prisma.member.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    const items = members.map((m) => ({
      id: m.id,
      nama_member: m.namaMember,
      instansi: m.instansi,
      alamat: m.alamat,
      telp: m.telp,
      foto: m.foto,
      foto_url: m.foto ? this.storage.getPublicUrl('members', m.foto) : null,
      created_at: m.createdAt.toISOString(),
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

  async createMemberAssisted(user: any, dto: CreateMemberAdminDto) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new BadRequestException('Username sudah digunakan oleh akun lain!');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const media = dto.foto
        ? await tx.mediaUpload.findFirst({
            where: {
              objectKey: `members/${dto.foto}`,
              ownerId: user.spaceOwner.id,
              uploaderUserId: user.id,
              purpose: 'member_photo',
              status: 'staged',
              deletedAt: null,
              expiresAt: { gt: new Date() },
            },
          })
        : null;

      if (dto.foto && !media) {
        throw new BadRequestException(
          'Foto member tidak valid, sudah digunakan, kedaluwarsa, atau bukan milik akun Anda.',
        );
      }

      const createdUser = await tx.user.create({
        data: {
          username: dto.username,
          passwordHash,
          role: 'member',
        },
      });

      const member = await tx.member.create({
        data: {
          idUser: createdUser.id,
          roleGuard: 'member',
          namaMember: dto.nama_member.trim(),
          instansi: dto.instansi.trim(),
          alamat: dto.alamat.trim(),
          telp: dto.telp.trim(),
          foto: dto.foto || null,
        },
      });

      if (media) {
        await tx.mediaUpload.update({
          where: { id: media.id },
          data: {
            status: 'attached',
            attachedEntityType: 'member',
            attachedEntityId: member.id,
          },
        });
      }

      return {
        message: 'Data member baru berhasil ditambahkan!',
        data: {
          id: member.id,
          nama_member: member.namaMember,
          instansi: member.instansi,
          alamat: member.alamat,
          telp: member.telp,
          foto: member.foto,
          foto_url: member.foto ? this.storage.getPublicUrl('members', member.foto) : null,
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
      foto_url: member.foto ? this.storage.getPublicUrl('members', member.foto) : null,
      created_at: member.createdAt.toISOString(),
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const media = dto.foto && dto.foto !== existing.foto
        ? await tx.mediaUpload.findFirst({
            where: {
              objectKey: `members/${dto.foto}`,
              ownerId: ownerId,
              uploaderUserId: user.id,
              purpose: 'member_photo',
              status: 'staged',
              deletedAt: null,
              expiresAt: { gt: new Date() },
            },
          })
        : null;

      if (dto.foto && dto.foto !== existing.foto && !media) {
        throw new BadRequestException(
          'Foto member tidak valid, sudah digunakan, kedaluwarsa, atau bukan milik akun Anda.',
        );
      }

      const res = await tx.member.update({
        where: { id: existing.id },
        data: {
          namaMember: dto.nama_member !== undefined ? dto.nama_member.trim() : existing.namaMember,
          instansi: dto.instansi !== undefined ? dto.instansi.trim() : existing.instansi,
          alamat: dto.alamat !== undefined ? dto.alamat.trim() : existing.alamat,
          telp: dto.telp !== undefined ? dto.telp.trim() : existing.telp,
          foto: dto.foto !== undefined ? dto.foto : existing.foto,
        },
      });

      if (media) {
        await tx.mediaUpload.update({
          where: { id: media.id },
          data: {
            status: 'attached',
            attachedEntityType: 'member',
            attachedEntityId: res.id,
          },
        });
      }

      return res;
    });

    return {
      message: 'Data member berhasil diperbarui!',
      data: {
        id: updated.id,
        nama_member: updated.namaMember,
        instansi: updated.instansi,
        alamat: updated.alamat,
        telp: updated.telp,
        foto: updated.foto,
        foto_url: updated.foto ? this.storage.getPublicUrl('members', updated.foto) : null,
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
        member: r.detail
          ? {
              id: r.idMember,
              nama_member: r.detail.namaMemberSnapshot,
              telp: r.detail.telpMemberSnapshot,
              instansi: r.detail.instansiMemberSnapshot,
            }
          : r.member
            ? {
                id: r.member.id,
                nama_member: r.member.namaMember,
                telp: r.member.telp,
              }
            : null,
        space: r.detail
          ? {
              id: r.idSpace,
              nama_space: r.detail.namaSpaceSnapshot,
              tipe: r.detail.tipeSpaceSnapshot,
            }
          : r.space
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

    if (dto.status !== 'disetujui' && dto.status !== 'dibatalkan') {
      throw new BadRequestException(
        `Perubahan status manual hanya diizinkan untuk disetujui atau dibatalkan. Gunakan check-in/out untuk status aktif/selesai.`,
      );
    }

    const resId = BigInt(id);
    const result = await this.prisma.reservation.updateMany({
      where: {
        id: resId,
        idOwner: user.spaceOwner.id,
        status: { in: ['belum_dikonfirm', 'disetujui'] },
      },
      data: {
        status: dto.status,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      const existing = await this.prisma.reservation.findFirst({
        where: {
          id: resId,
          idOwner: user.spaceOwner.id,
        },
      });

      if (!existing) {
        throw new NotFoundException('Reservasi tidak ditemukan');
      }

      throw new ConflictException(
        `Status ${existing.status} tidak dapat diubah ke ${dto.status} atau telah berubah oleh proses lain!`,
      );
    }

    const updated = await this.prisma.reservation.findUniqueOrThrow({
      where: { id: resId },
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
    const now = new Date();
    const result = await this.prisma.reservation.updateMany({
      where: {
        id: resId,
        idOwner: user.spaceOwner.id,
        status: 'disetujui',
      },
      data: {
        status: 'aktif',
        checkInAt: now,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      const existing = await this.prisma.reservation.findFirst({
        where: {
          id: resId,
          idOwner: user.spaceOwner.id,
        },
      });

      if (!existing) {
        throw new NotFoundException('Reservasi tidak ditemukan');
      }

      throw new ConflictException(
        `Check-in hanya dapat dilakukan untuk reservasi yang sudah disetujui! Status saat ini: ${existing.status}`,
      );
    }

    const updated = await this.prisma.reservation.findUniqueOrThrow({
      where: { id: resId },
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
    const now = new Date();
    const result = await this.prisma.reservation.updateMany({
      where: {
        id: resId,
        idOwner: user.spaceOwner.id,
        status: 'aktif',
      },
      data: {
        status: 'selesai',
        checkOutAt: now,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      const existing = await this.prisma.reservation.findFirst({
        where: {
          id: resId,
          idOwner: user.spaceOwner.id,
        },
      });

      if (!existing) {
        throw new NotFoundException('Reservasi tidak ditemukan');
      }

      throw new ConflictException(
        `Check-out hanya dapat dilakukan untuk reservasi yang sedang aktif! Status saat ini: ${existing.status}`,
      );
    }

    const updated = await this.prisma.reservation.findUniqueOrThrow({
      where: { id: resId },
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

  async getReportSummary(user: any, query: ReportSummaryQueryDto) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    const validationError = validateReportRange(query.granularity, query.from, query.to);
    if (validationError) {
      throw new BadRequestException(validationError);
    }

    const buckets = generateTimeBuckets(query.granularity, query.from, query.to);
    const startDate = parseDateOnlyUtc(query.from);
    const endDateExclusive = new Date(parseDateOnlyUtc(query.to).getTime() + 24 * 60 * 60 * 1000);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        idOwner: user.spaceOwner.id,
        tanggalReservasi: {
          gte: startDate,
          lt: endDateExclusive,
        },
        status: {
          in: ['disetujui', 'aktif', 'selesai'],
        },
      },
      include: {
        detail: true,
      },
      orderBy: [
        { tanggalReservasi: 'asc' },
        { id: 'asc' },
      ],
    });

    const seriesData = buckets.map((b) => ({
      bucket_start: b.bucket_start,
      bucket_end: b.bucket_end,
      label: b.label,
      total_transaksi: 0,
      total_jam: 0,
      estimasi_pendapatan_kotor: 0n,
      total_potongan_diskon: 0n,
      realisasi_pendapatan_bersih: 0n,
    }));

    let totalTransaksi = 0;
    let totalJamTerpakai = 0;
    let estimasiPendapatanKotor = 0n;
    let totalPotonganDiskon = 0n;
    let realisasiPendapatanBersih = 0n;

    const typeSummary: Record<
      string,
      {
        label: string;
        totalBooking: number;
        totalJam: number;
        estimasiPendapatanBersih: bigint;
        realisasiPendapatanBersih: bigint;
      }
    > = {
      desk: {
        label: 'Personal Desk',
        totalBooking: 0,
        totalJam: 0,
        estimasiPendapatanBersih: 0n,
        realisasiPendapatanBersih: 0n,
      },
      meeting_room: {
        label: 'Meeting Room',
        totalBooking: 0,
        totalJam: 0,
        estimasiPendapatanBersih: 0n,
        realisasiPendapatanBersih: 0n,
      },
      private_office: {
        label: 'Private Office',
        totalBooking: 0,
        totalJam: 0,
        estimasiPendapatanBersih: 0n,
        realisasiPendapatanBersih: 0n,
      },
    };

    for (const r of reservations) {
      const dateStr = formatDateOnlyUtc(r.tanggalReservasi);
      const bucketIdx = findBucketIndex(buckets, dateStr);
      const durasi = r.durasiJam;

      totalTransaksi += 1;
      totalJamTerpakai += durasi;

      const kotor = r.detail ? r.detail.totalHargaAwal : 0n;
      const potongan = r.detail ? r.detail.potonganDiskon : 0n;
      const bersih = r.detail ? r.detail.totalHarga : 0n;
      const isSelesai = r.status === 'selesai';

      estimasiPendapatanKotor += kotor;
      totalPotonganDiskon += potongan;
      if (isSelesai) {
        realisasiPendapatanBersih += bersih;
      }

      if (bucketIdx >= 0) {
        seriesData[bucketIdx].total_transaksi += 1;
        seriesData[bucketIdx].total_jam += durasi;
        seriesData[bucketIdx].estimasi_pendapatan_kotor += kotor;
        seriesData[bucketIdx].total_potongan_diskon += potongan;
        if (isSelesai) {
          seriesData[bucketIdx].realisasi_pendapatan_bersih += bersih;
        }
      }

      if (r.detail) {
        const tipe = r.detail.tipeSpaceSnapshot;
        if (typeSummary[tipe]) {
          typeSummary[tipe].totalBooking += 1;
          typeSummary[tipe].totalJam += durasi;
          typeSummary[tipe].estimasiPendapatanBersih += bersih;
          if (isSelesai) {
            typeSummary[tipe].realisasiPendapatanBersih += bersih;
          }
        }
      }
    }

    return {
      granularity: query.granularity,
      from: query.from,
      to: query.to,
      timezone: 'Asia/Jakarta',
      totals: {
        total_transaksi: totalTransaksi,
        total_jam_terpakai: totalJamTerpakai,
        estimasi_pendapatan_kotor: estimasiPendapatanKotor,
        total_potongan_diskon: totalPotonganDiskon,
        realisasi_pendapatan_bersih: realisasiPendapatanBersih,
      },
      series: seriesData,
      rincian_per_tipe_space: [
        {
          tipe: 'desk',
          label: typeSummary.desk.label,
          total_booking: typeSummary.desk.totalBooking,
          total_jam: typeSummary.desk.totalJam,
          estimasi_pendapatan_bersih: typeSummary.desk.estimasiPendapatanBersih,
          realisasi_pendapatan_bersih: typeSummary.desk.realisasiPendapatanBersih,
        },
        {
          tipe: 'meeting_room',
          label: typeSummary.meeting_room.label,
          total_booking: typeSummary.meeting_room.totalBooking,
          total_jam: typeSummary.meeting_room.totalJam,
          estimasi_pendapatan_bersih: typeSummary.meeting_room.estimasiPendapatanBersih,
          realisasi_pendapatan_bersih: typeSummary.meeting_room.realisasiPendapatanBersih,
        },
        {
          tipe: 'private_office',
          label: typeSummary.private_office.label,
          total_booking: typeSummary.private_office.totalBooking,
          total_jam: typeSummary.private_office.totalJam,
          estimasi_pendapatan_bersih: typeSummary.private_office.estimasiPendapatanBersih,
          realisasi_pendapatan_bersih: typeSummary.private_office.realisasiPendapatanBersih,
        },
      ],
    };
  }
}
