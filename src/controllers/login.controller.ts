import { Controller, Get, HttpCode, Request } from '@nestjs/common';
import { LoginService } from '../services/login.service';
import { User } from '../schemas/user.schema';

@Controller('api/login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}
    @Get()
    @HttpCode(200)
    async login(@Request() req): Promise<User> {
        return this.loginService.login(req.query.email, req.query.password);
    }
}   
