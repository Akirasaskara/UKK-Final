import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service.js';
import { S3StorageService } from './s3-storage.service.js';

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

@Global()
@Module({
  providers: [
    LocalStorageService,
    S3StorageService,
    {
      provide: STORAGE_SERVICE,
      useFactory: (
        configService: ConfigService,
        local: LocalStorageService,
        s3: S3StorageService,
      ) => {
        const driver = configService.get<string>('STORAGE_DRIVER') || 'local';
        return driver === 's3' ? s3 : local;
      },
      inject: [ConfigService, LocalStorageService, S3StorageService],
    },
  ],
  exports: [STORAGE_SERVICE, LocalStorageService, S3StorageService],
})
export class StorageModule {}
