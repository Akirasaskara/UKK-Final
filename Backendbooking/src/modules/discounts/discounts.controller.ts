import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { DiscountsService } from './discounts.service.js';
import { CheckPromoDto } from './dto/discount.dto.js';
import { CreateDiskonDto, UpdateDiskonDto } from './dto/create-discount.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@Controller('api')
export class DiscountsController {
  constructor(@Inject(DiscountsService) private discountsService: DiscountsService) {}

  @Public()
  @Get('diskon/active')
  findActive() {
    return this.discountsService.findActive();
  }

  @Public()
  @Post('diskon/check')
  @HttpCode(HttpStatus.OK)
  checkPromo(@Body() dto: CheckPromoDto) {
    return this.discountsService.checkPromo(dto);
  }

  @Public()
  @Get('diskon/:id')
  findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.discountsService.findOnePublic(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Get('admin/diskon')
  findAllAdmin(@CurrentUser() user: any) {
    return this.discountsService.findAllAdmin(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Post('admin/diskon')
  @HttpCode(HttpStatus.CREATED)
  createAdmin(@CurrentUser() user: any, @Body() dto: CreateDiskonDto) {
    return this.discountsService.createAdmin(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Get('admin/diskon/:id')
  findOneAdmin(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.discountsService.findOneAdmin(user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Put('admin/diskon/:id')
  updateAdmin(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDiskonDto,
  ) {
    return this.discountsService.updateAdmin(user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Delete('admin/diskon/:id')
  deleteAdmin(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.discountsService.deleteAdmin(user, id);
  }
}
