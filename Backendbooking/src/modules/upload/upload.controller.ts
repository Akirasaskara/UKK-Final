import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service.js';
import type { UploadedFileDto } from './upload.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

const uploadOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: Number(process.env.UPLOAD_MAX_BYTES || 5 * 1024 * 1024),
    files: 1,
  },
};

@ApiTags('Media & Uploads (S3 / Local Storage)')
@ApiBearerAuth()
@Controller('api/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(@Inject(UploadService) private uploadService: UploadService) {}

  @ApiOperation({ summary: 'Upload Gambar Media Umum (Member & Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary', description: 'Gambar (.jpg/.png/.webp, maksimum 5MB)' } } } })
  @ApiResponse({ status: 201, description: 'File umum berhasil diupload dan staged menuju storage' })
  @Roles('member', 'admin_space')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  uploadGeneral(
    @UploadedFile() file: UploadedFileDto,
    @CurrentUser() user: any,
  ) {
    return this.uploadService.uploadGeneral(file, user);
  }

  @ApiOperation({ summary: 'Upload Gambar / Foto Space Pekerjaan (Admin Owner)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary', description: 'Gambar fasilitas space (.jpg/.png/.webp, 5MB)' } } } })
  @Roles('admin_space')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('spaces')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  uploadSpace(
    @UploadedFile() file: UploadedFileDto,
    @CurrentUser() user: any,
  ) {
    return this.uploadService.uploadSpace(file, user);
  }

  @ApiOperation({ summary: 'Upload Foto Profil Akun Member (Admin / Member)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary', description: 'Foto profil (.jpg/.png/.webp, 5MB)' } } } })
  @Roles('member', 'admin_space')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  uploadMember(
    @UploadedFile() file: UploadedFileDto,
    @CurrentUser() user: any,
  ) {
    return this.uploadService.uploadMember(file, user);
  }
}
