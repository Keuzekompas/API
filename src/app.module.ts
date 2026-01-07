import { Module, Global } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseProviders } from './database/database.providers';
import { UserModule } from './user/user.module';
import * as dotenv from 'dotenv';
import { AuthModule } from './auth/auth.module';
import { ModulesModule } from './modules/modules.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './utils/CustomThrottlerGuard';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { redisInstance } from './utils/redis';

dotenv.config();

@Global()
@Module({
  imports: [
    UserModule,
    AuthModule,
    ModulesModule,
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 60 }], // Default: 60 requests per minute
      storage: new ThrottlerStorageRedisService(redisInstance),
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
