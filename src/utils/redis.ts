import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

export const redisInstance = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});
