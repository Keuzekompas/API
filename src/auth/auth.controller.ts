import { Controller, Post, HttpCode, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { handleError } from '../utils/error-handler';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { AuthDto } from './dtos/auth.dto';
import { User } from '../user/user.schema';

@Controller('api/login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(200)
  async login(@Body() authDto: AuthDto): Promise<JsonResponse<User | null>> {
    try {
      const user = await this.authService.login(
        authDto.email,
        authDto.password,
      );
      return createJsonResponse(200, 'Login succesvol', user); //Add JWT Token later
    } catch (error) {
      handleError(error, 'AuthController.login');
      return createJsonResponse(401, 'Ongeldige inloggegevens', null);
    }
  }
}
