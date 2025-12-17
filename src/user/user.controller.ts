import { Controller, Get, HttpCode, Request } from '@nestjs/common';
import { handleError } from '../utils/error-handler';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { UserService } from './user.service';
import { UserInterface } from './user.interface';

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
