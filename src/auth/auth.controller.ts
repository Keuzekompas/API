import {
  Controller,
  Post,
  HttpCode,
  Body,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { handleError } from '../utils/error-handler';
import { createJsonResponse } from '../utils/json-response';
import { AuthDto } from './dtos/auth.dto';
import type { Response } from 'express';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @HttpCode(200)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() authDto: AuthDto,
  ) {
    try {
      const response = await this.authService.login(
        authDto.email,
        authDto.password,
      );
      
      res.cookie('token', response.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return createJsonResponse(200, 'Login successful', response);
    } catch (error) {
      handleError(error, 'AuthController.login');
      return createJsonResponse(401, 'Invalid login credentials', null);

    }
  }

  @Post('logout')
  logout(@Res() res: Response) {
    // Clear common cookie names used for tokens to be safe
    res.clearCookie('token', { path: '/' });
    res.clearCookie('access_token', { path: '/' });
    // also send an explicit expired cookie for non-Express clients/browsers
    res.cookie('token', '', { httpOnly: true, maxAge: 0, path: '/' });
    res.cookie('access_token', '', { httpOnly: true, maxAge: 0, path: '/' });

    return res.status(200).json({ success: true });
  }
}
