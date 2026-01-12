import {
  Controller,
  Get,
  NotFoundException,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
  Post,
  Delete,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserInterface } from './user.interface';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ModuleListDto } from '../modules/dtos/module-response.dto';
import { isValidObjectId } from 'mongoose';
import { LanguageDto } from '../utils/dtos/lang.dto';

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
    @Query() query: LanguageDto,
  ): Promise<JsonResponse<ModuleListDto[] | null>> {
    const { lang } = query;
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

  @UseGuards(AuthGuard)
  @Post('favorites/:moduleId')
  async addFavorite(
    @Request() req,
    @Param('moduleId') moduleId: string,
  ): Promise<JsonResponse<null>> {
    if (!isValidObjectId(moduleId)) {
      throw new BadRequestException('Invalid module ID');
    }

    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    const updatedUser = await this.userService.addFavorite(userId, moduleId);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return createJsonResponse(200, 'Module added to favorites', null);
  }

  @UseGuards(AuthGuard)
  @Delete('favorites/:moduleId')
  async removeFavorite(
    @Request() req,
    @Param('moduleId') moduleId: string,
  ): Promise<JsonResponse<null>> {
    if (!isValidObjectId(moduleId)) {
      throw new BadRequestException('Invalid module ID');
    }

    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    const updatedUser = await this.userService.removeFavorite(userId, moduleId);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return createJsonResponse(200, 'Module removed from favorites', null);
  }
}
