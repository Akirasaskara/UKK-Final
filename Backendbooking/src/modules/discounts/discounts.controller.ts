import {
  Controller,
  Get,
  Post,
  Put,
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
import { DiscountsService } from './discounts.service.js';
import { CheckPromoDto } from './dto/discount.dto.js';
import {
  CreateDiskonDto,
  UpdateDiskonDto,
  AdminPromotionQueryDto,
} from './dto/create-discount.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@ApiTags('Promotions & Discounts')
@Controller('api')
export class DiscountsController {
  constructor(@Inject(DiscountsService) private discountsService: DiscountsService) {}

  @ApiOperation({ summary: 'Daftar Promo Diskon Aktif Semua Coworking atau Scoped Space (Publik)' })
  @ApiQuery({ name: 'id_space', required: false, type: Number, description: 'Filter promo aktif milik owner space spesifik' })
  @Public()
  @Get('diskon/active')
  findActive(@Query('id_space') idSpace?: string) {
    const parsedSpaceId = idSpace ? Number.parseInt(idSpace, 10) : undefined;
    return this.discountsService.findActive(
      Number.isFinite(parsedSpaceId) && (parsedSpaceId as number) > 0 ? parsedSpaceId : undefined,
    );
  }

  @ApiOperation({ summary: 'Cek Validitas Kode Promo (Publik)' })
  @ApiResponse({ status: 200, description: 'Kode promo valid' })
  @ApiResponse({ status: 400, description: 'Kode promo invalid/expired' })
  @Public()
  @Post('diskon/check')
  @HttpCode(HttpStatus.OK)
  checkPromo(@Body() dto: CheckPromoDto) {
    return this.discountsService.checkPromo(dto);
  }

  @ApiOperation({ summary: 'Detail Promo Diskon (Publik)' })
  @ApiParam({ name: 'id', description: 'ID Diskon', type: Number, example: 1 })
  @Public()
  @Get('diskon/:id')
  findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.discountsService.findOnePublic(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lihat Semua Promo Diskon (Admin Space)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Get('admin/diskon')
  findAllAdmin(
    @CurrentUser() user: any,
    @Query() query: AdminPromotionQueryDto,
  ) {
    return this.discountsService.findAllAdmin(user, query);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tambah Promo Diskon (Admin Space)' })
  @ApiResponse({ status: 201, description: 'Promo Diskon Baru Berhasil Dibuat' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Post('admin/diskon')
  @HttpCode(HttpStatus.CREATED)
  createAdmin(@CurrentUser() user: any, @Body() dto: CreateDiskonDto) {
    return this.discountsService.createAdmin(user, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detail Promo Diskon Spesifik (Admin Space)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Get('admin/diskon/:id')
  findOneAdmin(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.discountsService.findOneAdmin(user, id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Promo Diskon (Admin Space)' })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Arsipkan/Hapus Promo Diskon (Admin Space)' })
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
