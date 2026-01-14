import {
  Controller,
  Post,
  HttpCode,
  Body,
  Res,
  Req,
  Ip,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { createJsonResponse } from '../utils/json-response';
import { AuthDto } from './dtos/auth.dto';
import { Verify2faDto } from './dtos/verify-2fa.dto';
import type { Response, Request } from 'express';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';
import { Verify2faThrottlerGuard } from './guards/verify-2fa-throttler.guard';

const setTokenCookie = (res: Response, token: string | undefined) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LoginThrottlerGuard)
  @SkipThrottle({ short: true, long: true })
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

    if (response.requires2FA) {
      // Set temporary token in cookie
      res.cookie('temp_token', response.tempToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Needed for 2FA flow
        maxAge: 5 * 60 * 1000, // 5 minutes
      });

      // Remove sensitive data from response body
      const { tempToken, ...safeResponse } = response;
      return createJsonResponse(200, '2FA required', safeResponse);
    }

    setTokenCookie(res, response.token);

    // Remove sensitive data from response body
    const { token, ...safeResponse } = response;
    return createJsonResponse(200, 'Login successful', safeResponse);
  }

  @UseGuards(Verify2faThrottlerGuard)
  @SkipThrottle({ short: true, long: true })
  @Post('/verify-2fa')
  @HttpCode(200)
  async verify2FA(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() verifyDto: Verify2faDto,
  ) {
    const tempToken = req.cookies?.['temp_token'];

    if (!tempToken) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    const response = await this.authService.verifyTwoFactor(
      tempToken,
      verifyDto.code,
    );

    // Clear the temporary token
    res.clearCookie('temp_token');

    // Set the real access token
    setTokenCookie(res, response.token);

    // Remove sensitive data from response body
    const { token, ...safeResponse } = response;
    return createJsonResponse(200, 'Login successful', safeResponse);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    };

    res.clearCookie('token', cookieOptions);
    res.cookie('token', '', { ...cookieOptions, maxAge: 0 });
    
    // Also clear temp token just in case
    res.clearCookie('temp_token', cookieOptions);
    res.cookie('temp_token', '', { ...cookieOptions, maxAge: 0 });

    return createJsonResponse(200, 'Logout successful', null);
  }
}
