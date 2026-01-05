import {
  Controller,
  Post,
  HttpCode,
  Body,
  Get,
  UseGuards,
  Res,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { handleError } from '../utils/error-handler';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { AuthDto } from './dtos/auth.dto';
import { AuthGuard } from './auth.guard';
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
}
