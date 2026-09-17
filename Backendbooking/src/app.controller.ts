import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator.js';

@Controller()
export class AppController {
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
