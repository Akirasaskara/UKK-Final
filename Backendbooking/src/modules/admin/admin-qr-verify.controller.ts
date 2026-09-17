import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PrismaService } from '../../database/prisma.service.js';

export class VerifyQrDto {
  token!: string;
}

@Controller('api/admin/reservasi')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_space')
export class AdminQrVerifyController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Post('verify-qr')
  @HttpCode(HttpStatus.OK)
  async verifyQr(@CurrentUser() user: any, @Body() dto: VerifyQrDto) {
    if (!user?.spaceOwner?.id) {
      throw new ForbiddenException('Akses hanya untuk admin space');
    }

    if (!dto.token || typeof dto.token !== 'string') {
      throw new BadRequestException('Token QR wajib disertakan');
    }

    // Format QR Token: VERIFY-RESERVASI-{id}-{kodeBooking}
    const parts = dto.token.split('-');
    if (parts.length < 4 || parts[0] !== 'VERIFY' || parts[1] !== 'RESERVASI') {
      throw new BadRequestException('Format QR Code tiket tidak valid');
    }

    const resId = BigInt(parts[2]);
    const kodeBooking = parts.slice(3).join('-');

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: resId,
        kodeBooking,
        idOwner: user.spaceOwner.id,
      },
      include: {
        member: true,
        space: true,
        detail: true,
      },
    });

    if (!reservation || !reservation.detail) {
      throw new NotFoundException('Tiket reservasi tidak ditemukan atau bukan milik coworking Anda');
    }

    const d = reservation.detail;
    const dateStr = reservation.tanggalReservasi.toISOString().split('T')[0];
    const startStr = reservation.jamMulai.toISOString().split('T')[1].substring(0, 5);
    const endStr = reservation.jamSelesai.toISOString().split('T')[1].substring(0, 5);

    return {
      message: 'QR Code valid dan terverifikasi',
      data: {
        id: reservation.id,
        kode_booking: reservation.kodeBooking,
        status: reservation.status,
        can_check_in: reservation.status === 'disetujui',
        member: {
          nama: d.namaMemberSnapshot,
          instansi: d.instansiMemberSnapshot,
          telp: d.telpMemberSnapshot,
        },
        space: {
          nama: d.namaSpaceSnapshot,
          tipe: d.tipeSpaceSnapshot,
        },
        jadwal: {
          tanggal: dateStr,
          jam_mulai: startStr,
          jam_selesai: endStr,
          durasi: `${reservation.durasiJam} Jam`,
        },
        total_dibayar: d.totalHarga,
      },
    };
  }
}
