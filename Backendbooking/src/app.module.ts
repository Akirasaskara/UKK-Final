import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { environmentSchema } from './config/env.validation.js';
import { PrismaModule } from './database/prisma.module.js';
import { StorageModule } from './infrastructure/storage/storage.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { SpacesModule } from './modules/spaces/spaces.module.js';
import { DiscountsModule } from './modules/discounts/discounts.module.js';
import { ReservationsModule } from './modules/reservations/reservations.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { AppController } from './app.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validationSchema: environmentSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    StorageModule,
    AuthModule,
    SpacesModule,
    DiscountsModule,
    ReservationsModule,
    AdminModule,
    UploadModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
