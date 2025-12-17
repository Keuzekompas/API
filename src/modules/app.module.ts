import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { databaseProviders } from '../database/dbConfig';

import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ...databaseProviders],
})
export class AppModule {}
