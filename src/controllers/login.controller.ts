import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { LoginService } from '../services/login.service';
import { handleError } from '../utils/error-handler';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { LoginDto } from '../dtos/login.dto';
import { User } from '../schemas/user.schema';

@Controller('api/login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Get()
  @HttpCode(200)
  async login(@Query() query: LoginDto): Promise<JsonResponse<User | null>> {
    try {
      const user = await this.loginService.login(query.email, query.password);
      return createJsonResponse(200, 'Login succesvol', user);
    } catch (error) {
      handleError(error, 'LoginController.login');
      return createJsonResponse(401, 'Ongeldige inloggegevens', null);
    }
  }
}
