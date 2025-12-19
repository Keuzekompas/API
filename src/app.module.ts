import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseProviders } from './database/database.providers';
<<<<<<< HEAD
import { UserModule } from './user/modules/user.module';

import * as dotenv from 'dotenv';
import { ModulesModule } from './modules/modules.module';
dotenv.config();

@Module({
  imports: [UserModule, ModulesModule],
  controllers: [AppController],
  providers: [AppService, ...databaseProviders],
=======
import { UserModule } from './user/user.module';

import * as dotenv from 'dotenv';
import { AuthModule } from './auth/auth.module';
dotenv.config();

@Module({
  imports: [UserModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
>>>>>>> 100b4043cac0087e7763fe51945248ed8e4c21b0
})
export class AppModule {}
