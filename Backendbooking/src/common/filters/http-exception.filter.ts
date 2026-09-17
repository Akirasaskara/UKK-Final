import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Terjadi kesalahan pada server';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as any;
        if (Array.isArray(resObj.message)) {
          message = resObj.message.join(', ');
        } else if (resObj.message) {
          message = resObj.message;
        }
        error = resObj.error || exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(`Prisma error code: ${exception.code}`);
      switch (exception.code) {
        case 'P2002':
          statusCode = HttpStatus.CONFLICT;
          message = 'Data yang dimasukkan sudah terdaftar atau terjadi duplikasi';
          error = 'Conflict';
          break;
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          message = 'Data yang diminta tidak ditemukan';
          error = 'NotFound';
          break;
        case 'P2003':
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Relasi data tidak valid';
          error = 'BadRequest';
          break;
        default:
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Terjadi kesalahan operasi basis data';
          error = 'DatabaseError';
          break;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      message = 'Terjadi kesalahan internal pada server';
      error = 'InternalServerError';
    }

    response.status(statusCode).json({
      status: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
