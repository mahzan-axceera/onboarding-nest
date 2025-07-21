import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { format } from 'date-fns';

export type Response<T> = {
  status: boolean;
  statusCode: number;
  path: string;
  message: string;
  data?: T;
  timestamp: string;
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: unknown) => this.responseHandler(data, context)),
      catchError((exception: HttpException | Error) => {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();

        const status =
          exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        let message: string | string[] = 'Internal server error';

        if (exception instanceof HttpException) {
          const response = exception.getResponse();
          if (typeof response === 'object' && response !== null) {
            message = (response as any).message ?? exception.message;
          } else {
            message = exception.message;
          }
        }

        return throwError(
          () =>
            new HttpException(
              {
                status: false,
                statusCode: status,
                path: request.url,
                message,
                timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
              },
              status,
            ),
        );
      }),
    );
  }

  responseHandler(data: any, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const statusCode = ctx.getResponse().statusCode;

    return {
      status: true,
      path: request.url,
      statusCode,
      message: 'Success',
      data,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
  }
}
