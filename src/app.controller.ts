import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { Mongoose } from 'mongoose';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('DATABASE_CONNECTION') private readonly mongoose: Mongoose,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
