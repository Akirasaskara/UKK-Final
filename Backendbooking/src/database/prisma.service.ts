import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Optional() configService?: ConfigService) {
    const rawUrl = configService?.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
    if (!rawUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    const mariaUrl = rawUrl.replace('mysql://', 'mariadb://');
    const adapter = new PrismaMariaDb(mariaUrl as any);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
