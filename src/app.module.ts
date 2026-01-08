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
        { name: 'default', ttl: 60000, limit: 60 }, // Global limit
        { name: 'loginAttempts', ttl: 60000, limit: 60 }, // login limit
      ],
      storage: new ThrottlerStorageRedisService(redisInstance),
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: IpThrottlerGuard, // Protects every route by IP
    },
    AppService,
    ...databaseProviders,
  ],
})
export class AppModule {}
