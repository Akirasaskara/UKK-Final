import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service.js';
import { CreateReservasiDto, HistoryQueryDto } from './dto/reservation.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(@Inject(ReservationsService) private reservationsService: ReservationsService) {}

  @Roles('member')
  @Post('reservasi')
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: any, @Body() dto: CreateReservasiDto) {
    return this.reservationsService.create(user, dto);
  }

  @Roles('member')
  @Get('reservasi/my')
  findMyReservations(@CurrentUser() user: any) {
    return this.reservationsService.findMyReservations(user);
  }

  @Roles('member')
  @Get('reservasi/my/history')
  findMyHistory(
    @CurrentUser() user: any,
    @Query() query: HistoryQueryDto,
  ) {
    return this.reservationsService.findMyHistory(user, query);
  }

  @Roles('member', 'admin_space')
  @Get('reservasi/:id/e-ticket')
  getETicket(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservationsService.getETicket(user, id);
  }

  @Roles('member', 'admin_space')
  @Get('reservasi/:id')
  findOne(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservationsService.findOne(user, id);
  }

  @Roles('member')
  @Patch('reservasi/:id/cancel')
  cancelMember(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservationsService.cancelMember(user, id);
  }
}
