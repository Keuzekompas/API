import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseProviders } from './database/database.providers';
import { UserModule } from './user/modules/user.module';

import * as dotenv from 'dotenv';
import { ModulesModule } from './modules/modules.module';
dotenv.config();

@Module({
  imports: [UserModule, ModulesModule],
  controllers: [AppController],
  providers: [AppService, ...databaseProviders],
})
export class AppModule {}
