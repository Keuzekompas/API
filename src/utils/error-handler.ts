import { Logger, HttpException, HttpStatus } from '@nestjs/common';

export function handleError(error: unknown, context?: string): void {
  const logger = new Logger(context || 'ErrorHandler');
  let status = HttpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';

  if (error instanceof HttpException) {
    status = error.getStatus();
    message = error.message;
    logger.error(`[${status}] ${message}`, error.stack);
  } else if (error instanceof Error) {
    message = error.message;
    logger.error(`[${status}] ${message}`, error.stack);
  } else {
    logger.error(`[${status}] Unknown error`, JSON.stringify(error));
  }
}
