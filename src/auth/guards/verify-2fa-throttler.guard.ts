import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { BaseThrottlerGuard } from '../../utils/guards/base-throttler.guard';
import { ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class Verify2faThrottlerGuard extends BaseThrottlerGuard {
  protected getTargetKey(request: Request): string {
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    return `verify2fa:${ip}`;
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { throttler } = requestProps;

    if (throttler.name !== 'verify2fa') {
      return true;
    }

    return super.handleRequest(requestProps);
  }
}
