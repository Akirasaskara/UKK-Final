import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import {
  UpdateCoworkingProfileDto,
  CreateMemberAdminDto,
  UpdateMemberAdminDto,
  UpdateReservasiStatusDto,
  ReportQueryDto,
} from './dto/admin.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@ApiTags('Admin Operations')
@ApiBearerAuth()
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_space')
export class AdminController {
  constructor(@Inject(AdminService) private adminService: AdminService) {}

  @ApiOperation({ summary: 'Lihat Profil Coworking Space miliknya (Admin)' })
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.adminService.getProfile(user);
  }

  @ApiOperation({ summary: 'Simpan Profil Lokasi Coworking (Admin)' })
  @Put('profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateCoworkingProfileDto,
  ) {
    return this.adminService.updateProfile(user, dto);
  }

  @ApiOperation({ summary: 'Daftar Member yang Pernah Reservasi di Lokasi Ini (Admin)' })
  @ApiQuery({ name: 'search', required: false, description: 'Cari Nama/Instansi/Telepon' })
  @Get('members')
  findMembers(
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
    return this.adminService.findMembers(user, search);
  }

  @ApiOperation({ summary: 'Buat Akun Member Pelanggan Global (Assisted Registration)' })
  @ApiResponse({ status: 201, description: 'Pembuatan akun selesai (belum terlihat di list hingga reservasi pertama)' })
  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  createMemberAssisted(@Body() dto: CreateMemberAdminDto) {
    return this.adminService.createMemberAssisted(dto);
  }

  @ApiOperation({ summary: 'Detail Profil Member yang Sesuai Scope Reservasi (Admin)' })
  @ApiParam({ name: 'id', description: 'ID Member' })
  @Get('members/:id')
  findOneMember(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.findOneMember(user, id);
  }

  @ApiOperation({ summary: 'Update Profil Member Spesifik (Whitelist) (Admin)' })
  @Put('members/:id')
  updateMember(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberAdminDto,
  ) {
    return this.adminService.updateMember(user, id, dto);
  }

  @ApiOperation({ summary: 'Tolak Penghapusan Akun Member Global (Perlindungan Histori) (Admin)' })
  @ApiResponse({ status: 409, description: 'Akun member tidak dapat dihapus oleh pengelola' })
  @Delete('members/:id')
  deleteMember() {
    return this.adminService.deleteMember();
  }

  @ApiOperation({ summary: 'Daftar Semua Reservasi Masuk (Admin)' })
  @ApiQuery({ name: 'status', required: false, description: 'Enum Status Reservasi' })
  @ApiQuery({ name: 'tanggal', required: false, description: 'Spesifik tanggal' })
  @Get('reservasi')
  findReservations(
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    return this.adminService.findReservations(user, query);
  }

  @ApiOperation({ summary: 'Ubah / Konfirmasi Status Setuju & Batalkan Reservasi (Admin)' })
  @Patch('reservasi/:id/status')
  updateReservationStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservasiStatusDto,
  ) {
    return this.adminService.updateReservationStatus(user, id, dto);
  }

  @ApiOperation({ summary: 'Check-In Pengunjung (Set status Aktif) (Admin)' })
  @ApiResponse({ status: 200, description: 'Check-in berhasil. Status sekarang aktif/digunakan.' })
  @ApiResponse({ status: 400, description: 'Status belum disetujui / gagal check-in.' })
  @Post('reservasi/:id/check-in')
  @HttpCode(HttpStatus.OK)
  checkIn(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.checkIn(user, id);
  }

  @ApiOperation({ summary: 'Check-Out Pengunjung (Set status Selesai) (Admin)' })
  @Post('reservasi/:id/check-out')
  @HttpCode(HttpStatus.OK)
  checkOut(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.checkOut(user, id);
  }

  @ApiOperation({ summary: 'Laporan Rekapitulasi Rincian Tipe & Finansial Bulanan (Admin)' })
  @Get('reports/monthly')
  getMonthlyReport(
    @CurrentUser() user: any,
    @Query() query: ReportQueryDto,
  ) {
    return this.adminService.getMonthlyReport(user, query);
  }

  @ApiOperation({ summary: 'Alias Spesifik Untuk Fallback Hanya Net Income Laporan Finansial (Admin)' })
  @Get('reports/income')
  getIncomeAlias(
    @CurrentUser() user: any,
    @Query() query: ReportQueryDto,
  ) {
    return this.adminService.getIncomeAlias(user, query);
  }
}
