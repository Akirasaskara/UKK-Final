import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL_MS') || 60000,
          limit: config.get<number>('RATE_LIMIT_DEFAULT') || 100,
        },
      ],
    }),
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
