import { Controller, Post, HttpCode, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { handleError } from '../utils/error-handler';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { AuthDto } from './dtos/auth.dto';
import { LoginResponse } from './auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @HttpCode(200)
  async login(
    @Body() authDto: AuthDto,
  ): Promise<JsonResponse<LoginResponse | null>> {
    try {
      const response = await this.authService.login(
        authDto.email,
        authDto.password,
      );
      return createJsonResponse(200, 'Login succesvol', response);
    } catch (error) {
      handleError(error, 'AuthController.login');
      return createJsonResponse(401, 'Ongeldige inloggegevens', null);
    }
  }
}
