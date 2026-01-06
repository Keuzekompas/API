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
import { AuthGuard } from '../auth/auth.guard';
import { ModuleListDto, ModuleDetailDto } from './dtos/module-response.dto';
import { GetModulesQueryDto } from './dtos/get-modules-query.dto';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() query: GetModulesQueryDto,
  ): Promise<JsonResponse<ModuleListDto[] | null>> {
    const { lang } = query;
    const modules = await this.modulesService.findAll(lang);
    return createJsonResponse(200, 'Modules successfully retrieved', modules);
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

function isValidObjectId(id: string): boolean {
  // Simple check for a 24-character hex string (MongoDB ObjectId)
  return /^[a-fA-F0-9]{24}$/.test(id);
}
