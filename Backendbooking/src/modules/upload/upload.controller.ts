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
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service.js';
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

@Controller('api/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(@Inject(UploadService) private uploadService: UploadService) {}

  @Roles('member', 'admin_space')
  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  uploadGeneral(
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    return this.uploadService.uploadGeneral(file, user);
  }

  @Roles('admin_space')
  @Post('spaces')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  uploadSpace(
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    return this.uploadService.uploadSpace(file, user);
  }

  @Roles('member', 'admin_space')
  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  uploadMember(
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    return this.uploadService.uploadMember(file, user);
  }
}
