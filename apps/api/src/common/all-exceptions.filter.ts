import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AditErrorBody, AditErrorCode, ERROR_MESSAGES } from '@adit/shared';

// สถานะที่ใช้เทียบกับ statusCode ซึ่งเป็น number ธรรมดา (ไม่ใช่ enum)
const STATUS_SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;
const STATUS_TOO_MANY_REQUESTS: number = HttpStatus.TOO_MANY_REQUESTS;
const STATUS_REQUEST_TIMEOUT: number = HttpStatus.REQUEST_TIMEOUT;
const STATUS_NOT_FOUND: number = HttpStatus.NOT_FOUND;

/**
 * แปลง exception ทุกชนิดให้เป็น AditErrorBody รูปแบบเดียว
 * เพื่อให้ Frontend จัดการ error ได้จากที่เดียว
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toErrorBody(exception);

    if (body.statusCode >= STATUS_SERVER_ERROR) {
      this.logger.error(
        `[${body.code}] ${body.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${body.code}] ${body.message}`);
    }

    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown): AditErrorBody {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (
        typeof payload === 'object' &&
        payload !== null &&
        'code' in payload
      ) {
        return payload as AditErrorBody;
      }

      // HttpException ที่ Nest หรือ library อื่นโยนมาเอง (เช่น ThrottlerException, 404)
      const code = this.codeFromStatus(status);
      return { statusCode: status, code, message: ERROR_MESSAGES[code] };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }

  private codeFromStatus(status: number): AditErrorCode {
    if (status === STATUS_TOO_MANY_REQUESTS) return 'RATE_LIMITED';
    if (status === STATUS_REQUEST_TIMEOUT) return 'PROVIDER_TIMEOUT';
    if (status === STATUS_NOT_FOUND) return 'NOT_FOUND';
    if (status < STATUS_SERVER_ERROR) return 'VALIDATION_ERROR';
    return 'INTERNAL_ERROR';
  }
}
