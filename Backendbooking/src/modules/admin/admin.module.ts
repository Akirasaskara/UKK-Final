import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { AdminQrVerifyController } from './admin-qr-verify.controller.js';
import { SuperadminController } from './superadmin.controller.js';

@Module({
  controllers: [AdminController, AdminQrVerifyController, SuperadminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
