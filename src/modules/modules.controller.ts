import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { AuthGuard } from '../auth/auth.guard';
import { ModuleListDto, ModuleDetailDto } from './dtos/module-response.dto';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Query('lang') lang: string = 'en'): Promise<JsonResponse<ModuleListDto[] | null>> {
    try {
      const modules = await this.modulesService.findAll(lang);
      return createJsonResponse(200, 'Modules successfully retrieved', modules);
    } catch (error) {
      handleError(error, 'ModulesController.findAll');
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Query('lang') lang: string = 'en'): Promise<JsonResponse<ModuleDetailDto | null>> {
    try {
      const module = await this.modulesService.findOne(id, lang);
      if (!module) {
        return createJsonResponse(404, 'Module not found', null);
      }
      return createJsonResponse(200, 'Module successfully retrieved', module);
    } catch (error) {
      handleError(error, 'ModulesController.findOne');
      throw error;
    }

    const module = await this.modulesService.findOne(id);

    return createJsonResponse(200, 'Module successfully retrieved', module);
  }
}
