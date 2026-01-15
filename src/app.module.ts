import { Module, Global } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseProviders } from './database/database.providers';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ModulesModule } from './modules/modules.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { IpThrottlerGuard } from './utils/guards/ip-throttler.guard';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { redisInstance } from './utils/redis';

@Global()
@Module({
  imports: [
    UserModule,
    AuthModule,
    ModulesModule,
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 10000, limit: 30 }, // Global Burst: 30 per 10s
        { name: 'long', ttl: 900000, limit: 500 }, // Global Anti-Scrape: 500 per 15m
        { name: 'loginAttempts', ttl: 60000, limit: 5 }, // login limit
        { name: 'verify2fa', ttl: 60000, limit: 5 }, // 2FA verification limit
      ],
      storage: new ThrottlerStorageRedisService(redisInstance),
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: IpThrottlerGuard,
    },
    AppService,
    ...databaseProviders,
  ],
})
export class AppModule {}
