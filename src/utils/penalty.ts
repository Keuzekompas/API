import { redisInstance } from './redis';
import { TimeFormatter } from './time-formatter';

export const PENALTIES = [60, 300, 900, 86400]; // 1m, 5m, 15m, 24h

export interface BlockStatus {
  isBlocked: boolean;
  timeLeft: number;
}

// This manager counts the level, sets blocks, formats time strings and resets penalties
export class PenaltyManager {
  private static redis = redisInstance;

  static async getBlockData(key: string): Promise<BlockStatus> {
    const blockKey = `block:${key}`;
    const isBlocked = await this.redis.get(blockKey);
    const timeLeft = isBlocked ? await this.redis.ttl(blockKey) : 0;
    return { isBlocked: !!isBlocked, timeLeft };
  }

  static async applyPenalty(key: string): Promise<number> {
    const levelKey = `level:${key}`;
    const blockKey = `block:${key}`;

    // Atomic increment
    const newLevelRaw = await this.redis.incr(levelKey);
    const level = newLevelRaw - 1; // We begin at index 0 for the array

    const penaltySeconds = PENALTIES[level] ?? PENALTIES[PENALTIES.length - 1];

    await this.redis.set(blockKey, 'blocked', 'EX', penaltySeconds);
    await this.redis.expire(levelKey, 86400);

    return penaltySeconds;
  }

  static async resetPenalty(key: string): Promise<void> {
    await this.redis.del(`block:${key}`, `level:${key}`);
  }

  static formatTime(seconds: number): string {
    return TimeFormatter.format(seconds);
  }
}
