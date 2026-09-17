import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { serializeBigInt } from '../utils/serializer.util.js';

export interface Response<T> {
  status: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((resData) => {
        let message = 'Berhasil memproses permintaan';
        let data = resData;

        if (
          resData &&
          typeof resData === 'object' &&
          'message' in resData &&
          'data' in resData &&
          Object.keys(resData).length <= 3
        ) {
          message = resData.message;
          data = resData.data;
        } else if (
          resData &&
          typeof resData === 'object' &&
          'message' in resData &&
          Object.keys(resData).length === 1
        ) {
          message = resData.message;
          data = null;
        }

        return {
          status: true,
          statusCode,
          message,
          data: serializeBigInt(data),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
