import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerRequest,
} from '@nestjs/throttler';
import { Request } from 'express';
import { PenaltyManager } from '../../utils/penalty';

// This base guard implements penalty logic for throttling
export abstract class BaseThrottlerGuard extends ThrottlerGuard {
  protected abstract getTargetKey(request: Request): string;

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;
    const request = context.switchToHttp().getRequest<Request>();
    const targetKey = this.getTargetKey(request);

    // 1. Check if the target is currently blocked
    const { isBlocked, timeLeft } =
      await PenaltyManager.getBlockData(targetKey);
    if (isBlocked) {
      throw new ThrottlerException(
        `Too many attempts. Blocked for another ${PenaltyManager.formatTime(timeLeft)}.`,
      );
    }

    try {
      return await super.handleRequest(requestProps);
    } catch (e) {
      if (!(e instanceof ThrottlerException)) throw e;

      // 2. Limit reached, apply penalty
      const penalty = await PenaltyManager.applyPenalty(targetKey);
      throw new ThrottlerException(
        `Limit reached. You are now blocked for ${PenaltyManager.formatTime(penalty)}.`,
      );
    }
  }
}
