<<<<<<< HEAD
import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { Mongoose } from 'mongoose';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('DATABASE_CONNECTION') private readonly mongoose: Mongoose,
  ) {}
=======
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
>>>>>>> 100b4043cac0087e7763fe51945248ed8e4c21b0

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}