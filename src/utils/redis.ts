import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

export const redisInstance = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: isTest, // Prevent immediate connection in tests
  tls:
    process.env.REDIS_TLS === 'true'
      ? {
          rejectUnauthorized: true,
        }
      : undefined,
});
