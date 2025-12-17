import { Controller, Get, Param } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { Module } from './interfaces/module.interface';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  async findAll(): Promise<Module[]> {
    return this.modulesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Module> {
    return this.modulesService.findOne(id);
  }
}
