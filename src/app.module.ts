import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseProviders } from './database/database.providers';
import { UserModule } from './user/modules/user.module';

import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [UserModule],
  controllers: [AppController],
  providers: [AppService, ...databaseProviders],
})
export class AppModule {}
