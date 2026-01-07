import { Injectable } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerRequest,
} from '@nestjs/throttler';
import { redisInstance } from './redis';

const PENALTIES = [60, 300, 900, 86400]; // 1m, 5m, 15m, 24h

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly redis = redisInstance;

  // Override handleRequest to implement progressive penalties
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress;

    const blockKey = `block:${ip}`;

    // Check if the IP is currently blocked
    const isBlocked = await this.redis.get(blockKey);
    if (isBlocked) {
      const timeLeft = await this.redis.ttl(blockKey);
      throw new ThrottlerException(
        `Too many attempts. Account locked for ${this.formatTime(timeLeft)}.`,
      );
    }

    try {
      // Try to handle the request normally
      return await super.handleRequest(requestProps);
    } catch (e) {
      // If it's not a ThrottlerException, rethrow it
      if (!(e instanceof ThrottlerException)) throw e;

      // Limit is NOW reached. We retrieve the level to show the correct time.
      const levelKey = `level:${ip}`;
      const currentLevel = await this.redis.get(levelKey);
      const level = currentLevel ? Number.parseInt(currentLevel) : 0;
      const penaltySeconds = PENALTIES[level] || PENALTIES.at(-1);

      // Apply penalty in Redis
      await this.applyProgressivePenalty(ip);

      // Throw the error directly with the timer (this overrides throwThrottlingException)
      throw new ThrottlerException(
        `Limit reached. You are now blocked for ${this.formatTime(penaltySeconds as number)}.`,
      );
    }
  }

  private async applyProgressivePenalty(ip: string) {
    const levelKey = `level:${ip}`;
    const blockKey = `block:${ip}`;
    const currentLevel = await this.redis.get(levelKey);
    const level = currentLevel ? Number.parseInt(currentLevel) : 0;
    const penaltySeconds = PENALTIES[level] || PENALTIES.at(-1);

    // Set the block and increase the offense level
    await this.redis.set(blockKey, 'blocked', 'EX', penaltySeconds as number);
    await this.redis.set(levelKey, (level + 1).toString(), 'EX', 86400); // Level expires after 24h
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} minute(s)`;
    return `${Math.ceil(seconds / 3600)} hour(s)`;
  }
}
