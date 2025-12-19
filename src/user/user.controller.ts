import { Controller, Get, HttpCode, Request } from '@nestjs/common';
<<<<<<<< HEAD:src/user/controllers/user.controller.ts
import { UserService } from '../services/user.service';
import { handleError } from '../../utils/error-handler';
import { UserInterface } from '../interfaces/user.interface';
import { createJsonResponse, JsonResponse } from '../../utils/json-response';
========
import { handleError } from '../utils/error-handler';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { UserService } from './user.service';
import { UserInterface } from './user.interface';
>>>>>>>> 100b4043cac0087e7763fe51945248ed8e4c21b0:src/user/user.controller.ts

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @HttpCode(200)
  async getProfile(
    @Request() req,
  ): Promise<JsonResponse<UserInterface | null>> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        // Fix this later with a guard
        return createJsonResponse(401, 'Not logged in', null);
      }

      const user = await this.userService.findById(userId);
      if (!user) {
        return createJsonResponse(404, 'User not found', null);
      }

      return createJsonResponse(200, 'User successfully retrieved', user);
    } catch (error) {
      handleError(error, 'UserController.getProfile');
      throw error;
    }
  }
}
