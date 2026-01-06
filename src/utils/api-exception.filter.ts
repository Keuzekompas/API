import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JsonResponse } from './json-response';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Step 1: Determine the default values (for unknown crashes)
    let status = HttpStatus.INTERNAL_SERVER_ERROR; // 500
    let message = 'Internal server error';

    // Step 2: Check if it is a "conscious" NestJS error (such as NotFound, Unauthorized, BadRequest)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      message =
        typeof exceptionResponse === 'object' && 'message' in exceptionResponse
          ? (exceptionResponse as any).message
          : exception.message;
    } else {
      // Step 3: It is an unexpected error (e.g., your CastError or a bug)
      console.error('Unexpected server error:', exception);
    }

    // Step 4: Ensure array messages (validation) are nicely converted to strings
    const finalMessage = Array.isArray(message) ? message[0] : message;

    const body: JsonResponse<null> = {
      status: status,
      message: finalMessage,
      data: {},
    };

    response.status(status).json(body);
  }
}
