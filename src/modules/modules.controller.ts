import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { Module } from './module.interface';
import { createJsonResponse, JsonResponse } from '../utils/json-response';
import { AuthGuard } from '../auth/auth.guard';
import { isValidObjectId } from 'mongoose';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(): Promise<JsonResponse<Module[]>> {
    const modules = await this.modulesService.findAll();
    return createJsonResponse(200, 'Modules successfully retrieved', modules);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<JsonResponse<Module>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    const module = await this.modulesService.findOne(id);

    return createJsonResponse(200, 'Module successfully retrieved', module);
  }
}
