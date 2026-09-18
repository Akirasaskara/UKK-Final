import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator.js';

@ApiTags('System & Health')
@Controller()
export class AppController {
  @ApiOperation({ summary: 'Informasi Root API Project UKK' })
  @ApiResponse({ status: 200, description: 'Menampilkan links Swagger dan status Service' })
  @Public()
  @Get()
  getRoot() {
    return {
      message: 'Berhasil memproses permintaan',
      data: {
        name: 'Coworking Space Backend API - UKK RPL Paket B',
        version: '1.0.0',
        status: 'online',
        swagger_docs: '/docs',
        description: 'Backend service untuk Smart Space Booking.',
        documentation_links: {
          swagger: 'http://localhost:3000/docs',
          swagger_json: 'http://localhost:3000/docs-json',
        },
      },
    };
  }

  @ApiOperation({ summary: 'Server Liveness Health Check (Ops)' })
  @ApiResponse({ status: 200, description: 'Database and NestJS up and running' })
  @Public()
  @Get('health')
  getHealth() {
    return {
      message: 'Berhasil memproses permintaan',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
