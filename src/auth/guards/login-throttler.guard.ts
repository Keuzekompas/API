import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { BaseThrottlerGuard } from '../../utils/guards/base-throttler.guard';
import { ThrottlerRequest } from '@nestjs/throttler';

// In login-throttler.guard.ts
@Injectable()
export class LoginThrottlerGuard extends BaseThrottlerGuard {
  protected getTargetKey(request: Request): string {
    const { body } = request;
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';

    // Check if email exists AND is a string
    if (body && typeof body.email === 'string') {
      const email = body.email.toLowerCase();
      return `account:${email}`;
    }

    return `ip:${ip}`; // Fallback to IP-based throttling
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
