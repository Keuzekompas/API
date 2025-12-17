import { Controller, Post, HttpCode, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { handleError } from '../utils/error-handler';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { AuthDto } from '../dtos/auth.dto';
import { User } from '../schemas/user.schema';

@Controller('api/login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Post()
  @HttpCode(200)
  async login(@Body() authDto: AuthDto): Promise<JsonResponse<User | null>> {
    try {
      const user = await this.authService.login(authDto.email, authDto.passwordHash);
      return createJsonResponse(200, 'Login succesvol', user);
    } catch (error) {
      handleError(error, 'AuthController.login');
      return createJsonResponse(401, 'Ongeldige inloggegevens', null);
    }
  }
}
