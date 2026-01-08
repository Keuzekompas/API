import { Injectable, Inject } from '@nestjs/common';
import { Request } from 'express';
import { BaseThrottlerGuard } from '../../utils/guards/base-throttler.guard';
import * as Throttler from '@nestjs/throttler';
import { THROTTLER_OPTIONS } from '@nestjs/throttler/dist/throttler.constants';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class Verify2faThrottlerGuard extends BaseThrottlerGuard {
  constructor(
    @Inject(THROTTLER_OPTIONS) protected readonly options: Throttler.ThrottlerModuleOptions,
    protected readonly storageService: Throttler.ThrottlerStorage,
    protected readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected getTargetKey(request: Request): string {
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    // Get token from HttpOnly cookie
    const tempToken = request.cookies?.['temp_token'];

    if (tempToken) {
      try {
        const decoded = this.jwtService.decode(tempToken) as { userId?: string };
        if (decoded?.userId) {
          // Primary: Throttle by User ID to protect the account
          return `verify2fa:${decoded.userId}`;
        }
      } catch (error) {
        // Token invalid, fall back to IP throttling
        void error;
      }
    }

    // Fallback: Throttle by IP
    return `verify2fa:${ip}`;
  }

  protected async handleRequest(
    requestProps: Throttler.ThrottlerRequest,
  ): Promise<boolean> {
    const { throttler } = requestProps;

    if (throttler.name !== 'verify2fa') {
      return true;
    }

    return super.handleRequest(requestProps);
  }
}