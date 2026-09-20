import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReservationsService } from './reservations.service.js';
import { CreateReservasiDto, HistoryQueryDto } from './dto/reservation.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@ApiTags('Reservations (Member/User)')
@ApiBearerAuth()
@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(@Inject(ReservationsService) private reservationsService: ReservationsService) {}

  @ApiOperation({ summary: 'Buat Pemesanan / Reservasi Baru (Member)' })
  @ApiHeader({ name: 'Idempotency-Key', description: 'ID Acak dari frontend untuk mencegah duplicate submit' })
  @ApiResponse({ status: 201, description: 'Reservasi dibuat, menunggu konfirmasi' })
  @ApiResponse({ status: 409, description: 'Bentrok Jadwal / Double Booking (Concurrency Blocked)' })
  @Roles('member')
  @Post('reservasi')
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: any, @Body() dto: CreateReservasiDto) {
    return this.reservationsService.create(user, dto);
  }

  @ApiOperation({ summary: 'Daftar Reservasi Belum Selesai (Member)' })
  @Roles('member')
  @Get('reservasi/my')
  findMyReservations(@CurrentUser() user: any) {
    return this.reservationsService.findMyReservations(user);
  }

  @ApiOperation({ summary: 'Histori Pemesanan Berdasarkan Waktu (Member)' })
  @Roles('member')
  @Get('reservasi/my/history')
  async findMyHistory(
    @CurrentUser() user: any,
    @Query() query: HistoryQueryDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.reservationsService.findMyHistory(user, query);
    response.setHeader('X-Page', String(result.page));
    response.setHeader('X-Per-Page', String(result.limit));
    response.setHeader('X-Total-Count', String(result.total_reservasi));
    return {
      month: result.month,
      year: result.year,
      total_reservasi: result.total_reservasi,
      total_pengeluaran: result.total_pengeluaran,
      items: result.items,
    };
  }

  @ApiOperation({ summary: 'Klaim / Tampilkan E-Ticket & QR Code (Member / Admin)' })
  @ApiParam({ name: 'id', description: 'ID Reservasi' })
  @Roles('member', 'admin_space')
  @Get('reservasi/:id/e-ticket')
  getETicket(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservationsService.getETicket(user, id);
  }

  @ApiOperation({ summary: 'Lihat Detail Reservasi Keseluruhan (Member / Admin)' })
  @Roles('member', 'admin_space')
  @Get('reservasi/:id')
  findOne(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservationsService.findOne(user, id);
  }

  @ApiOperation({ summary: 'Batalkan Reservasi oleh Pelanggan (Member)' })
  @ApiResponse({ status: 200, description: 'Reservasi berhasil dibatalkan.' })
  @ApiResponse({ status: 400, description: 'Reservasi dengan status aktif/selesai tidak dapat dibatalkan.' })
  @Roles('member')
  @Patch('reservasi/:id/cancel')
  cancelMember(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservationsService.cancelMember(user, id);
  }
}
