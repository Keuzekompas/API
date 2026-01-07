import {
  Controller,
  Get,
  NotFoundException,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserInterface } from './user.interface';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { AuthGuard } from '../auth/auth.guard';
import { ModuleListDto } from 'src/modules/dtos/module-response.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(
    @Request() req,
  ): Promise<JsonResponse<UserInterface | null>> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return createJsonResponse(200, 'User successfully retrieved', user);
  }

  @UseGuards(AuthGuard)
  @Get('favorites')
  async getFavoriteModules(
    @Request() req,
    @Query('lang') lang: string,
  ): Promise<JsonResponse<ModuleListDto[] | null>> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    const favorites = await this.userService.getFavorites(userId, lang);
    if (!favorites) {
      throw new NotFoundException('User not found');
    }

    return createJsonResponse(
      200,
      'Favorite modules successfully retrieved',
      favorites,
    );
  }
}
