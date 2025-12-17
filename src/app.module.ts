import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseProviders } from './database/database.providers';
import { UserModule } from './user/user.module';

import * as dotenv from 'dotenv';
import { AuthModule } from './auth/auth.module';
dotenv.config();

@Module({
  imports: [UserModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
