import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  // Override getTracker to use email as identifier, not IP
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email = req.body?.email;
    if (!email) {
      return req.ip; // Fallback on IP if no email is provided
    }
    return `login-limit:${email.toLowerCase()}`;
  }

  // Later add a progressive penalty system here if needed
}
