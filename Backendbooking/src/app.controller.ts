import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator.js';
import { PrismaService } from './database/prisma.service.js';

@ApiTags('System & Health')
@Controller()
export class AppController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @ApiOperation({ summary: 'Informasi Root API Project UKK' })
  @ApiResponse({ status: 200, description: 'Menampilkan links Swagger dan status Service' })
  @Public()
  @Get()
  getRoot() {
    const isProduction = process.env.NODE_ENV === 'production';
    const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true' || (!isProduction && process.env.SWAGGER_ENABLED !== 'false');

    return {
      message: 'Berhasil memproses permintaan',
      data: {
        name: 'Coworking Space Backend API - UKK RPL Paket B',
        version: '1.0.0',
        status: 'online',
        swagger_docs: swaggerEnabled ? '/docs' : null,
        description: 'Backend service untuk Smart Space Booking.',
      },
    };
  }

  @ApiOperation({ summary: 'Server Liveness Probe (Memeriksa event loop dan proses Node.js)' })
  @ApiResponse({ status: 200, description: 'Proses aplikasi berjalan normal' })
  @Public()
  @Get('health')
  getHealth() {
    return {
      message: 'Proses aplikasi berjalan normal',
      data: {
        status: 'alive',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @ApiOperation({ summary: 'Server Readiness Probe (Memeriksa konektivitas basis data)' })
  @ApiResponse({ status: 200, description: 'Aplikasi dan database siap melayani permintaan' })
  @ApiResponse({ status: 503, description: 'Database tidak dapat dihubungi' })
  @Public()
  @Get('ready')
  async getReady() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        message: 'Layanan siap menerima trafik',
        data: {
          status: 'ready',
          database: 'connected',
          timestamp: new Date().toISOString(),
        },
      };
    } catch {
      throw new ServiceUnavailableException('Database belum siap atau koneksi terputus');
    }
  }
}
