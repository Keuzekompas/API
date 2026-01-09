import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Model , QueryFilter } from 'mongoose';
import { Module } from './module.interface';
import { ModuleListDto, ModuleDetailDto } from './dtos/module-response.dto';
import { GetModulesQueryDto } from './dtos/get-modules-query.dto';
import { PaginatedModuleListDto } from './dtos/paginated-module-response.dto';

@Injectable()
export class ModulesService {
  constructor(
    @Inject('MODULE_MODEL')
    private readonly moduleModel: Model<Module>,
  ) {}

  async findAll(query: GetModulesQueryDto): Promise<PaginatedModuleListDto> {
    const {
      lang = 'en',
      page = 1,
      limit = 10,
      search,
      location,
      studycredit,
    } = query;

    const filter: QueryFilter<Module> = {};

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      if (lang === 'nl') {
        filter.name_nl = searchRegex;
      } else {
        filter.name_en = searchRegex;
      }
    }

    if (location && location !== 'None') {
      filter.location = location;
    }

    if (studycredit && studycredit !== 0) {
      filter.studycredit = studycredit;
    }

    const skip = (page - 1) * limit;

    const [modules, total] = await Promise.all([
      this.moduleModel.find(filter).skip(skip).limit(limit).exec(),
      this.moduleModel.countDocuments(filter).exec(),
    ]);

    const mappedModules = modules.map((module) => ({
      _id: module._id.toString(),
      name: lang === 'nl' ? module.name_nl : module.name_en,
      description:
        lang === 'nl' ? module.description_nl : module.description_en,
      studycredit: module.studycredit,
      location: module.location,
    }));

    return {
      modules: mappedModules,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, lang: string = 'en'): Promise<ModuleDetailDto> {
    const module = await this.moduleModel.findById(id).exec();
    if (!module) {
      throw new NotFoundException(`Module with ID "${id}" not found`);
    }
    return {
      _id: module._id.toString(),
      name: lang === 'nl' ? module.name_nl : module.name_en,
      description:
        lang === 'nl' ? module.description_nl : module.description_en,
      studycredit: module.studycredit,
      location: module.location,
      level: module.level,
      start_date: module.start_date,
      module_tags:
        lang === 'nl' ? module.module_tags_nl : module.module_tags_en,
    };
  }
}
