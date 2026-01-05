import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { JsonResponse } from './json-response';

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Get the message from the exception response
    const message =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as any).message
        : exception.message;

    // Construct your specific body format
    const body: JsonResponse<null> = {
      status: status,
      message: Array.isArray(message) ? message[0] : message, // Sometimes the message is an array in validation errors
      data: {}, // Empty object as you wanted
    };

    // Send the response with the CORRECT HTTP status code and your custom body
    response.status(status).json(body);
  }
}
