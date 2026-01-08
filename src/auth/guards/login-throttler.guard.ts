import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { BaseThrottlerGuard } from '../../utils/guards/base-throttler.guard';

@Injectable()
export class LoginThrottlerGuard extends BaseThrottlerGuard {
  protected getTargetKey(request: Request): string {
    const email = request.body?.email?.toLowerCase();
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    // If no email is present in body, fallback to IP to ensure a key exists
    return email ? `account:${email}` : `ip:${ip}`;
  }

  protected async getTracker(req: Request): Promise<string> {
    return this.getTargetKey(req);
  }
}
