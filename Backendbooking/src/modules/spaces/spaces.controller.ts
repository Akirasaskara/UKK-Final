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

@Controller('api')
export class SpacesController {
  constructor(@Inject(SpacesService) private spacesService: SpacesService) {}

  @Public()
  @Get('spaces/types')
  getTypes() {
    return this.spacesService.getTypes();
  }

  @Public()
  @Get('spaces/availability')
  checkAvailability(@Query() query: CheckAvailabilityQueryDto) {
    return this.spacesService.checkAvailability(query);
  }

  @Public()
  @Get('spaces')
  findAllPublic(
    @Query('tipe') tipe?: string,
    @Query('search') search?: string,
  ) {
    return this.spacesService.findAllPublic(tipe, search);
  }

  @Public()
  @Get('spaces/:id')
  findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.spacesService.findOnePublic(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Get('admin/spaces')
  findAllAdmin(@CurrentUser() user: any) {
    return this.spacesService.findAllAdmin(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Post('admin/spaces')
  @HttpCode(HttpStatus.CREATED)
  createAdmin(@CurrentUser() user: any, @Body() dto: CreateSpaceDto) {
    return this.spacesService.createAdmin(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_space')
  @Get('admin/spaces/:id')
  findOneAdmin(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.spacesService.findOneAdmin(user, id);
  }

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
