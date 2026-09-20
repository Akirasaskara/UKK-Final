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

  app.enableShutdownHooks();

  const trustProxy = process.env.TRUST_PROXY || '1';
  const expressApp = app.getHttpAdapter().getInstance();
  if (trustProxy === 'true') {
    expressApp.set('trust proxy', true);
  } else if (!isNaN(Number(trustProxy))) {
    expressApp.set('trust proxy', Number(trustProxy));
  } else {
    expressApp.set('trust proxy', trustProxy);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const isProduction = process.env.NODE_ENV === 'production';
  const corsRaw = process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3001';
  const allowedOrigins = corsRaw.split(',').map((o) => o.trim()).filter(Boolean);

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow server-to-server or tools without origin header (e.g. curl, health probes)
      if (!requestOrigin) return callback(null, true);
      if (!isProduction && corsRaw === '*') return callback(null, true);
      if (allowedOrigins.includes(requestOrigin)) return callback(null, true);
      return callback(new Error(`Origin ${requestOrigin} not allowed by CORS policy`), false);
    },
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

  const storageDriver = process.env.STORAGE_DRIVER || 'local';
  if (storageDriver === 'local') {
    const uploadsDir = path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR || 'uploads');
    app.use('/uploads', express.static(uploadsDir));
  }

  const swaggerEnabled =
    process.env.SWAGGER_ENABLED === 'true' ||
    (!isProduction && process.env.SWAGGER_ENABLED !== 'false');

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Smart Space Booking API')
      .setDescription('Dokumentasi RESTful API Backend untuk Sistem Pemesanan Coworking Space & Workstation (Paket B)')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`Smart Space Booking API is running on port ${port} (environment: ${process.env.NODE_ENV || 'development'})`);
  if (swaggerEnabled) {
    console.log(`Swagger documentation available at http://localhost:${port}/docs`);
  }
}

await bootstrap();
