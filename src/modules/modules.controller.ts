import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ModuleDetailDto } from './dtos/module-response.dto';
import { PaginatedModuleListDto } from './dtos/paginated-module-response.dto';
import { GetModulesQueryDto } from './dtos/get-modules-query.dto';
import { isValidObjectId } from 'mongoose';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() query: GetModulesQueryDto,
  ): Promise<JsonResponse<PaginatedModuleListDto>> {
    const result = await this.modulesService.findAll(query);
    return createJsonResponse(200, 'Modules successfully retrieved', result);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: GetModulesQueryDto,
  ): Promise<JsonResponse<ModuleDetailDto | null>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid module ID format');
    }

    const module = await this.modulesService.findOne(id, query.lang);
    return createJsonResponse(200, 'Module successfully retrieved', module);
  }
}
