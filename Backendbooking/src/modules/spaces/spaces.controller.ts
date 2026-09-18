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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SpacesService } from './spaces.service.js';
import {
  CreateSpaceDto,
  UpdateSpaceDto,
  CheckAvailabilityQueryDto,
} from './dto/space.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@ApiTags('Spaces & Workstations')
@Controller('api')
export class SpacesController {
  constructor(@Inject(SpacesService) private spacesService: SpacesService) {}

  @ApiOperation({ summary: 'Daftar Kategori Tipe Space (Publik)' })
  @Public()
  @Get('spaces/types')
  getTypes() {
    return this.spacesService.getTypes();
  }

  @ApiOperation({ summary: 'Cek Ketersediaan Waktu & Space (Advisory Publik)' })
  @ApiResponse({ status: 200, description: 'Space tersedia untuk dipesan' })
  @ApiResponse({ status: 400, description: 'Bentrok Jadwal / Waktu tidak valid' })
  @Public()
  @Get('spaces/availability')
  checkAvailability(@Query() query: CheckAvailabilityQueryDto) {
    return this.spacesService.checkAvailability(query);
  }

  @ApiOperation({ summary: 'Lihat Katalog Seluruh Space (Publik)' })
  @ApiQuery({ name: 'tipe', required: false, enum: ['desk', 'meeting_room', 'private_office'] })
  @ApiQuery({ name: 'search', required: false, description: 'Cari namaspace/fasilitas' })
  @Public()
  @Get('spaces')
  findAllPublic(
    @Query('tipe') tipe?: string,
    @Query('search') search?: string,
  ) {
    return this.spacesService.findAllPublic(tipe, search);
  }

  @ApiOperation({ summary: 'Lihat Detail Space (Publik)' })
  @ApiParam({ name: 'id', description: 'ID Space', type: Number, example: 1 })
  @Public()
  @Get('spaces/:id')
  findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.spacesService.findOnePublic(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lihat Daftar Spaces Inventaris (Admin Space)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Get('admin/spaces')
  findAllAdmin(@CurrentUser() user: any) {
    return this.spacesService.findAllAdmin(user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat/Tambah Space Baru (Admin Space)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Post('admin/spaces')
  @HttpCode(HttpStatus.CREATED)
  createAdmin(@CurrentUser() user: any, @Body() dto: CreateSpaceDto) {
    return this.spacesService.createAdmin(user, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lihat Detail Space Inventory (Admin Space)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Get('admin/spaces/:id')
  findOneAdmin(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.spacesService.findOneAdmin(user, id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Data Space (Admin Space)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Put('admin/spaces/:id')
  updateAdmin(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpaceDto,
  ) {
    return this.spacesService.updateAdmin(user, id, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Arsipkan/Hapus Space (Admin Space)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Delete('admin/spaces/:id')
  deleteAdmin(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.spacesService.deleteAdmin(user, id);
  }
}
