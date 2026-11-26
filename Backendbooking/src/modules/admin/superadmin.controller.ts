import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@ApiTags('Superadmin Operations')
@ApiBearerAuth()
@Controller('api/admin/superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
export class SuperadminController {
  constructor(@Inject(AdminService) private adminService: AdminService) {}

  @ApiOperation({ summary: 'Daftar Semua Pengajuan Coworking Space (Superadmin)' })
  @Get('workspaces')
  listWorkspaces() {
    return this.adminService.listWorkspacesForSuperadmin();
  }

  @ApiOperation({ summary: 'Setujui atau Tolak Pengajuan Coworking Space (Superadmin)' })
  @Patch('workspaces/:id/status')
  updateWorkspaceStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    if (status !== 'approved' && status !== 'rejected') {
      throw new BadRequestException('Status harus bernilai "approved" atau "rejected"');
    }
    return this.adminService.updateWorkspaceStatus(id, status);
  }
}
