import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { Module } from './module.interface';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { handleError } from '../utils/error-handler';
import { AuthGuard } from '../auth/auth.guard';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(): Promise<JsonResponse<Module[] | null>> {
    try {
      const modules = await this.modulesService.findAll();
      return createJsonResponse(200, 'Modules successfully retrieved', modules);
    } catch (error) {
      handleError(error, 'ModulesController.findAll');
      throw error;
    }
  }

  @UseGuards(AuthGuard)  
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<JsonResponse<Module | null>> {
    try {
      const module = await this.modulesService.findOne(id);
      if (!module) {
        return createJsonResponse(404, 'Module not found', null);
      }
      return createJsonResponse(200, 'Module successfully retrieved', module);
    } catch (error) {
      handleError(error, 'ModulesController.findOne');
      throw error;
    }
  }
}
