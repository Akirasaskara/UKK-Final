import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateReservasiDto, HistoryQueryDto } from './dto/reservation.dto.js';
import {
  calculateEndTime,
  generateBookingCode,
  generateTicketNumber,
  getJakartaDateString,
} from '../../common/utils/time.util.js';

@Injectable()
export class ReservationsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async create(user: any, dto: CreateReservasiDto) {
    if (!user?.member?.id) {
      throw new ForbiddenException('Akses hanya untuk member yang terdaftar');
    }

    const spaceId = BigInt(dto.id_space);
    let jamSelesai: string;
    try {
      jamSelesai = calculateEndTime(dto.jam_mulai, dto.durasi_jam);
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Format jam mulai atau durasi tidak valid');
    }

    const targetDate = new Date(`${dto.tanggal_reservasi}T00:00:00.000Z`);
    const requestedStartTime = new Date(`1970-01-01T${dto.jam_mulai}:00.000Z`);
    const requestedEndTime =
      jamSelesai === '24:00'
        ? new Date('1970-01-01T23:59:59.000Z')
        : new Date(`1970-01-01T${jamSelesai}:00.000Z`);

    if (isNaN(requestedStartTime.getTime()) || isNaN(requestedEndTime.getTime())) {
      throw new BadRequestException('Format jam mulai atau durasi tidak valid');
    }

    return this.prisma.$transaction(
      async (tx) => {
        const lockedSpaces = await tx.$queryRaw<any[]>`
          SELECT id, id_owner, harga_per_jam, nama_space, tipe, archived_at
          FROM space
          WHERE id = ${spaceId} AND archived_at IS NULL
          FOR UPDATE
        `;

        if (!lockedSpaces || lockedSpaces.length === 0) {
          throw new NotFoundException('Space tidak ditemukan atau telah dinonaktifkan!');
        }

        const space = lockedSpaces[0];
        const ownerId = BigInt(space.id_owner);

        const overlapping = await tx.$queryRaw<any[]>`
          SELECT id
          FROM reservasi
          WHERE id_space = ${spaceId}
            AND tanggal_reservasi = ${dto.tanggal_reservasi}
            AND status IN ('belum_dikonfirm', 'disetujui', 'aktif')
            AND ${dto.jam_mulai} < DATE_FORMAT(jam_selesai, '%H:%i')
            AND DATE_FORMAT(jam_mulai, '%H:%i') < ${jamSelesai}
          LIMIT 1
          FOR UPDATE
        `;

        if (overlapping && overlapping.length > 0) {
          throw new ConflictException(
            'Space tidak tersedia pada tanggal dan rentang jam tersebut!',
          );
        }

        const now = new Date();
        let discountRecord: any = null;

        if (dto.id_diskon && dto.kode_promo) {
          const normalizedCode = dto.kode_promo.trim().toUpperCase();
          discountRecord = await tx.discount.findFirst({
            where: {
              id: BigInt(dto.id_diskon),
              namaDiskon: normalizedCode,
              idOwner: ownerId,
              archivedAt: null,
              tanggalAwal: { lte: now },
              tanggalAkhir: { gte: now },
            },
          });
          if (!discountRecord) {
            throw new BadRequestException('Kombinasi ID diskon dan kode promo tidak valid atau sudah kedaluwarsa');
          }
        } else if (dto.id_diskon) {
          discountRecord = await tx.discount.findFirst({
            where: {
              id: BigInt(dto.id_diskon),
              idOwner: ownerId,
              archivedAt: null,
              tanggalAwal: { lte: now },
              tanggalAkhir: { gte: now },
            },
          });
          if (!discountRecord) {
            throw new BadRequestException('Diskon yang dipilih tidak valid atau sudah kedaluwarsa');
          }
        } else if (dto.kode_promo) {
          const normalizedCode = dto.kode_promo.trim().toUpperCase();
          discountRecord = await tx.discount.findFirst({
            where: {
              namaDiskon: normalizedCode,
              idOwner: ownerId,
              archivedAt: null,
              tanggalAwal: { lte: now },
              tanggalAkhir: { gte: now },
            },
          });
          if (!discountRecord) {
            throw new BadRequestException('Kode promo tidak valid atau sudah kedaluwarsa');
          }
        }

        const owner = await tx.spaceOwner.findUnique({
          where: { id: ownerId },
        });

        if (!owner) {
          throw new NotFoundException('Data pengelola space tidak ditemukan');
        }

        const hargaPerJam = BigInt(space.harga_per_jam);
        const totalHargaAwal = hargaPerJam * BigInt(dto.durasi_jam);
        let persentaseDiskon = 0;
        let potonganDiskon = 0n;
        let namaDiskonSnapshot: string | null = null;
        let discountId: bigint | null = null;

        if (discountRecord) {
          persentaseDiskon = discountRecord.persentaseDiskon;
          potonganDiskon = (totalHargaAwal * BigInt(persentaseDiskon)) / 100n;
          namaDiskonSnapshot = discountRecord.namaDiskon;
          discountId = discountRecord.id;
        }

        const totalBayar = totalHargaAwal > potonganDiskon ? totalHargaAwal - potonganDiskon : 0n;
        const kodeBooking = generateBookingCode(dto.tanggal_reservasi);

        const reservation = await tx.reservation.create({
          data: {
            idOwner: ownerId,
            idMember: user.member.id,
            idSpace: spaceId,
            kodeBooking,
            tanggalReservasi: targetDate,
            jamMulai: requestedStartTime,
            jamSelesai: requestedEndTime,
            durasiJam: dto.durasi_jam,
            status: 'belum_dikonfirm',
          },
        });

        await tx.reservationDetail.create({
          data: {
            idOwner: ownerId,
            idReservasi: reservation.id,
            idSpace: spaceId,
            idDiskon: discountId,
            hargaPerJam,
            totalHargaAwal,
            potonganDiskon,
            totalHarga: totalBayar,
            persentaseDiskon: discountRecord ? persentaseDiskon : null,
            namaDiskonSnapshot,
            namaSpaceSnapshot: space.nama_space,
            tipeSpaceSnapshot: space.tipe,
            namaCoworkingSnapshot: owner.namaCoworking,
            telpCoworkingSnapshot: owner.telp,
            namaMemberSnapshot: user.member.namaMember,
            instansiMemberSnapshot: user.member.instansi,
            telpMemberSnapshot: user.member.telp,
          },
        });

        return {
          message: 'Reservasi berhasil dibuat! Silakan tunggu konfirmasi admin.',
          data: {
            id: reservation.id,
            kode_booking: reservation.kodeBooking,
            id_member: reservation.idMember,
            id_space: reservation.idSpace,
            id_diskon: discountId,
            tanggal_reservasi: dto.tanggal_reservasi,
            jam_mulai: dto.jam_mulai,
            jam_selesai: jamSelesai,
            durasi_jam: dto.durasi_jam,
            harga_per_jam: hargaPerJam,
            total_harga_awal: totalHargaAwal,
            potongan_diskon: potonganDiskon,
            total_bayar: totalBayar,
            status: reservation.status,
            created_at: reservation.createdAt.toISOString(),
          },
        };
      },
      {
        isolationLevel: 'ReadCommitted',
        timeout: 10000,
      },
    );
  }

  async findMyReservations(user: any) {
    if (!user?.member?.id) {
      throw new ForbiddenException('Akses hanya untuk member');
    }

    const reservations = await this.prisma.reservation.findMany({
      where: { idMember: user.member.id },
      include: {
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
        total_bayar: r.detail ? r.detail.totalHarga : 0n,
        status: r.status,
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

  async findMyHistory(user: any, query: HistoryQueryDto) {
    if (!user?.member?.id) {
      throw new ForbiddenException('Akses hanya untuk member');
    }

    const jakartaToday = getJakartaDateString().split('-');
    const currentYear = query.year ?? Number(jakartaToday[0]);
    const currentMonth = query.month ?? Number(jakartaToday[1]);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const startDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const endDate = new Date(Date.UTC(currentYear, currentMonth, 1));
    const where = {
      idMember: user.member.id,
      tanggalReservasi: {
        gte: startDate,
        lt: endDate,
      },
    };

    const [reservations, totalReservations, aggregate] = await this.prisma.$transaction([
      this.prisma.reservation.findMany({
        where,
        include: {
          detail: true,
        },
        orderBy: [
          { tanggalReservasi: 'desc' },
          { id: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.reservation.count({ where }),
      this.prisma.reservationDetail.aggregate({
        where: {
          reservation: where,
        },
        _sum: { totalHarga: true },
      }),
    ]);

    const items = reservations.map((r) => {
      const dateStr = r.tanggalReservasi.toISOString().split('T')[0];
      const startStr = r.jamMulai.toISOString().split('T')[1].substring(0, 5);
      const endStr = r.jamSelesai.toISOString().split('T')[1].substring(0, 5);
      const totalBayar = r.detail ? r.detail.totalHarga : 0n;

      return {
        id: r.id,
        kode_booking: r.kodeBooking,
        tanggal_reservasi: dateStr,
        jam_mulai: startStr,
        jam_selesai: endStr,
        durasi_jam: r.durasiJam,
        total_bayar: totalBayar,
        status: r.status,
        space_name: r.detail ? r.detail.namaSpaceSnapshot : '',
      };
    });

    return {
      month: currentMonth,
      year: currentYear,
      page,
      limit,
      total_reservasi: totalReservations,
      total_pengeluaran: aggregate._sum.totalHarga ?? 0n,
      items,
    };
  }

  async findOne(user: any, id: number) {
    const resId = BigInt(id);
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: resId },
      include: {
        member: true,
        space: true,
        detail: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservasi tidak ditemukan');
    }

    if (user.role === 'member') {
      if (!user.member || reservation.idMember !== user.member.id) {
        throw new NotFoundException('Reservasi tidak ditemukan');
      }
    } else if (user.role === 'admin_space') {
      if (!user.spaceOwner || reservation.idOwner !== user.spaceOwner.id) {
        throw new NotFoundException('Reservasi tidak ditemukan');
      }
    } else {
      throw new ForbiddenException('Peran tidak memiliki hak akses');
    }

    const dateStr = reservation.tanggalReservasi.toISOString().split('T')[0];
    const startStr = reservation.jamMulai.toISOString().split('T')[1].substring(0, 5);
    const endStr = reservation.jamSelesai.toISOString().split('T')[1].substring(0, 5);

    return {
      id: reservation.id,
      kode_booking: reservation.kodeBooking,
      id_member: reservation.idMember,
      id_space: reservation.idSpace,
      tanggal_reservasi: dateStr,
      jam_mulai: startStr,
      jam_selesai: endStr,
      durasi_jam: reservation.durasiJam,
      total_bayar: reservation.detail ? reservation.detail.totalHarga : 0n,
      status: reservation.status,
      member: reservation.detail
        ? {
            nama_member: reservation.detail.namaMemberSnapshot,
            telp: reservation.detail.telpMemberSnapshot,
            instansi: reservation.detail.instansiMemberSnapshot,
          }
        : reservation.member
          ? {
              nama_member: reservation.member.namaMember,
              telp: reservation.member.telp,
            }
          : null,
      space: reservation.detail
        ? {
            id: reservation.idSpace,
            nama_space: reservation.detail.namaSpaceSnapshot,
            tipe: reservation.detail.tipeSpaceSnapshot,
            harga_per_jam: reservation.detail.hargaPerJam,
          }
        : reservation.space
          ? {
              id: reservation.space.id,
              nama_space: reservation.space.namaSpace,
              tipe: reservation.space.tipe,
              harga_per_jam: reservation.space.hargaPerJam,
            }
          : null,
    };
  }

  async getETicket(user: any, id: number) {
    const resId = BigInt(id);
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: resId },
      include: {
        detail: true,
      },
    });

    if (!reservation || !reservation.detail) {
      throw new NotFoundException('E-Ticket tidak ditemukan');
    }

    if (user.role === 'member') {
      if (!user.member || reservation.idMember !== user.member.id) {
        throw new NotFoundException('E-Ticket tidak ditemukan');
      }
    } else if (user.role === 'admin_space') {
      if (!user.spaceOwner || reservation.idOwner !== user.spaceOwner.id) {
        throw new NotFoundException('E-Ticket tidak ditemukan');
      }
    } else {
      throw new ForbiddenException('Peran tidak memiliki hak akses');
    }

    const d = reservation.detail;
    const dateStr = reservation.tanggalReservasi.toISOString().split('T')[0];
    const startStr = reservation.jamMulai.toISOString().split('T')[1].substring(0, 5);
    const endStr = reservation.jamSelesai.toISOString().split('T')[1].substring(0, 5);

    const ticketNumber = generateTicketNumber(dateStr, reservation.id);
    const qrPayload = `VERIFY-RESERVASI-${reservation.id}-${reservation.kodeBooking}`;

    let diskonPromoStr = '0%';
    if (d.persentaseDiskon && d.namaDiskonSnapshot) {
      diskonPromoStr = `${d.persentaseDiskon}% (${d.namaDiskonSnapshot})`;
    }

    return {
      message: 'E-Ticket berhasil dimuat',
      data: {
        e_ticket_number: ticketNumber,
        kode_booking: reservation.kodeBooking,
        coworking_space: {
          nama: d.namaCoworkingSnapshot,
          telepon: d.telpCoworkingSnapshot,
        },
        member: {
          nama: d.namaMemberSnapshot,
          instansi: d.instansiMemberSnapshot,
          telp: d.telpMemberSnapshot,
        },
        space: {
          nama: d.namaSpaceSnapshot,
          tipe: d.tipeSpaceSnapshot,
          harga_per_jam: d.hargaPerJam,
        },
        jadwal: {
          tanggal: dateStr,
          jam_mulai: startStr,
          jam_selesai: endStr,
          durasi: `${reservation.durasiJam} Jam`,
        },
        rincian_pembayaran: {
          tarif_kotor: d.totalHargaAwal,
          diskon_promo: diskonPromoStr,
          potongan: d.potonganDiskon,
          total_dibayar: d.totalHarga,
        },
        status_reservasi: reservation.status,
        qr_code_payload: qrPayload,
      },
    };
  }

  async cancelMember(user: any, id: number) {
    if (!user?.member?.id) {
      throw new ForbiddenException('Akses hanya untuk member');
    }

    const resId = BigInt(id);
    const result = await this.prisma.reservation.updateMany({
      where: {
        id: resId,
        idMember: user.member.id,
        status: { in: ['belum_dikonfirm', 'disetujui'] },
      },
      data: {
        status: 'dibatalkan',
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      const reservation = await this.prisma.reservation.findFirst({
        where: {
          id: resId,
          idMember: user.member.id,
        },
      });

      if (!reservation) {
        throw new NotFoundException('Reservasi tidak ditemukan');
      }

      throw new ConflictException(
        `Pembatalan hanya diizinkan untuk reservasi belum dikonfirmasi atau disetujui! Status saat ini: ${reservation.status}`,
      );
    }

    const updated = await this.prisma.reservation.findUniqueOrThrow({
      where: { id: resId },
    });

    return {
      message: 'Reservasi berhasil dibatalkan oleh pengguna',
      data: {
        id: updated.id,
        status: updated.status,
        updated_at: updated.updatedAt.toISOString(),
      },
    };
  }
}
