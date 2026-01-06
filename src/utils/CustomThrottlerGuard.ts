import { Injectable } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerRequest,
} from '@nestjs/throttler';
import Redis from 'ioredis';

const PENALTIES = [60, 300, 900, 86400, 604800]; // 1m, 5m, 15m, 1h, 1d, 7d

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  });

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
      const minutes = Math.ceil(timeLeft / 60);
      throw new ThrottlerException(
        `Too many attempts. Account locked for another ${minutes} minutes.`,
      );
    }

    try {
      // Call the super method with the full object
      return await super.handleRequest(requestProps);
    } catch (e) {
      // Apply penalty on limit exceed
      await this.applyProgressivePenalty(ip);
      throw e;
    }
  }

  private async applyProgressivePenalty(ip: string) {
    const levelKey = `level:${ip}`;
    const blockKey = `block:${ip}`;

    const currentLevel = await this.redis.get(levelKey);
    const level = currentLevel ? Number.parseInt(currentLevel) : 0;
    const penaltySeconds = PENALTIES[level] || PENALTIES.at(-1);

    await this.redis.set(blockKey, 'blocked', 'EX', penaltySeconds as number);

    await this.redis.set(levelKey, (level + 1).toString(), 'EX', 86400);
  }

  // The exception for the FIRST time the limit is reached
  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Limit reached. You are now blocked for 1 minute.',
    );
  }
}
