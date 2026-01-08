import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { BaseThrottlerGuard } from '../../utils/guards/base-throttler.guard';
import { ThrottlerRequest } from '@nestjs/throttler';

// In login-throttler.guard.ts
@Injectable()
export class LoginThrottlerGuard extends BaseThrottlerGuard {
  protected getTargetKey(request: Request): string {
    const email = request.body?.email?.toLowerCase();
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    return email ? `account:${email}` : `ip:${ip}`;
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { throttler } = requestProps;

    if (throttler.name !== 'loginAttempts') {
      return true;
    }

    return super.handleRequest(requestProps);
  }
}
