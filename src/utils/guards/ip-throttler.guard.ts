import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { BaseThrottlerGuard } from './base-throttler.guard';

@Injectable()
// Gives throttling based on IP address
export class IpThrottlerGuard extends BaseThrottlerGuard {
  protected getTargetKey(request: Request): string {
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    return `ip:${ip}`;
  }
}
