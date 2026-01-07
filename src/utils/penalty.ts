import { redisInstance } from './redis';

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

    const currentLevel = await this.redis.get(levelKey);
    const level = currentLevel ? parseInt(currentLevel, 10) : 0;
    const penaltySeconds = PENALTIES[level] ?? PENALTIES[PENALTIES.length - 1];

    // Set block and increment level (level expires after 24h)
    await this.redis.set(blockKey, 'blocked', 'EX', penaltySeconds);
    await this.redis.set(levelKey, (level + 1).toString(), 'EX', 86400);

    return penaltySeconds;
  }

  static async resetPenalty(key: string): Promise<void> {
    await this.redis.del(`block:${key}`, `level:${key}`);
  }

  static formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} minute(s)`;
    return `${Math.ceil(seconds / 3600)} hour(s) `;
  }
}
