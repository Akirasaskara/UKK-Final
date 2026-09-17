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

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_space')
export class AdminController {
  constructor(@Inject(AdminService) private adminService: AdminService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.adminService.getProfile(user);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateCoworkingProfileDto,
  ) {
    return this.adminService.updateProfile(user, dto);
  }

  @Get('members')
  findMembers(
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
    return this.adminService.findMembers(user, search);
  }

  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  createMemberAssisted(@Body() dto: CreateMemberAdminDto) {
    return this.adminService.createMemberAssisted(dto);
  }

  @Get('members/:id')
  findOneMember(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.findOneMember(user, id);
  }

  @Put('members/:id')
  updateMember(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberAdminDto,
  ) {
    return this.adminService.updateMember(user, id, dto);
  }

  @Delete('members/:id')
  deleteMember() {
    return this.adminService.deleteMember();
  }

  @Get('reservasi')
  findReservations(
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    return this.adminService.findReservations(user, query);
  }

  @Patch('reservasi/:id/status')
  updateReservationStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservasiStatusDto,
  ) {
    return this.adminService.updateReservationStatus(user, id, dto);
  }

  @Post('reservasi/:id/check-in')
  @HttpCode(HttpStatus.OK)
  checkIn(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.checkIn(user, id);
  }

  @Post('reservasi/:id/check-out')
  @HttpCode(HttpStatus.OK)
  checkOut(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.checkOut(user, id);
  }

  @Get('reports/monthly')
  getMonthlyReport(
    @CurrentUser() user: any,
    @Query() query: ReportQueryDto,
  ) {
    return this.adminService.getMonthlyReport(user, query);
  }

  @Get('reports/income')
  getIncomeAlias(
    @CurrentUser() user: any,
    @Query() query: ReportQueryDto,
  ) {
    return this.adminService.getIncomeAlias(user, query);
  }
}
