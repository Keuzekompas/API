import {
  Controller,
  Post,
  HttpCode,
  Body,
  Res,
  Ip,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { createJsonResponse } from '../utils/json-response';
import { AuthDto } from './dtos/auth.dto';
import type { Response } from 'express';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LoginThrottlerGuard)
  @SkipThrottle({ default: true })
  @Post('/login')
  @HttpCode(200)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() authDto: AuthDto,
    @Ip() ip: string,
  ) {
    const response = await this.authService.login(
      authDto.email,
      authDto.password,
      ip,
    );

    res.cookie('token', response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return createJsonResponse(200, 'Login successful', response);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' });
    res.cookie('token', '', { httpOnly: true, maxAge: 0, path: '/' });
    return createJsonResponse(200, 'Logout successful', null);
  }
}
