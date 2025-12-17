/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, HttpCode, Request } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { handleError } from '../utils/error-handler';
import { UserInterface } from '../interfaces/user.interface';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @HttpCode(200)
  async getProfile(@Request() req): Promise<UserInterface | null> {
    try {
      const userId = req.user?.userId;
      if (!userId) return null;
      return await this.userService.findById(userId);
    } catch (error) {
      handleError(error, 'UserController.getProfile');
      throw error;
    }
  }
}
