import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseProviders } from './database/database.providers';
import { UserModule } from './user/user.module';

import * as dotenv from 'dotenv';
import { AuthModule } from './auth/auth.module';
import { ModulesModule } from './modules/modules.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './utils/CustomThrottlerGuard';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
dotenv.config();

@Module({
  imports: [
    UserModule,
    AuthModule,
    ModulesModule,
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [{ ttl: 60000, limit: 60 }], // Globale limit
        storage: new ThrottlerStorageRedisService(
          new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
          }),
        ),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard, // Apply rate limiting globally (on all routes)
    },
    AppService,
    ...databaseProviders,
  ],
})
export class AppModule {}
