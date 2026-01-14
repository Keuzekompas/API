import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { BaseThrottlerGuard } from './base-throttler.guard';
import { ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class IpThrottlerGuard extends BaseThrottlerGuard {
  protected getTargetKey(request: Request): string {
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    return `ip:${ip}`;
  }

  // Overrides handleRequest, so only default throttler is used
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { throttler } = requestProps;

    // If the current check is NOT for the 'default' throttler, ignore it in this guard
    if (throttler.name !== 'short' && throttler.name !== 'long') {
      return true;
    }

    return super.handleRequest(requestProps);
  }
}
