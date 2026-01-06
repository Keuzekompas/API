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
dotenv.config();

@Module({
  imports: [
    UserModule,
    AuthModule,
    ModulesModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 60, // 60 requests per minute max
      },
    ]),
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
