import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module.js';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS === '*'
    ? '*'
    : process.env.CORS_ALLOWED_ORIGINS?.split(',') || '*';

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const uploadsDir = path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR || 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Smart Space Booking API')
    .setDescription('Dokumentasi RESTful API Backend untuk Sistem Pemesanan Coworking Space & Workstation (Paket B)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`Smart Space Booking API is running on port ${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/docs`);
}

await bootstrap();
