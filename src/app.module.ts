import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseProviders } from './database/database.providers';
import { UserModule } from './user/user.module';

import * as dotenv from 'dotenv';
import { AuthModule } from './auth/auth.module';
import { ModulesModule } from './modules/modules.module';
dotenv.config();

@Module({
  imports: [UserModule, AuthModule, ModulesModule],
  controllers: [AppController],
  providers: [AppService, ...databaseProviders],
})
export class AppModule {}
