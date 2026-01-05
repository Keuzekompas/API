import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Module } from './module.interface';

@Injectable()
export class ModulesService {
  constructor(
    @Inject('MODULE_MODEL')
    private readonly moduleModel: Model<Module>,
  ) {}

  async findAll(lang: string = 'en'): Promise<any[]> {
    const modules = await this.moduleModel.find().exec();
    return modules.map((module) => ({
      _id: module._id,
      name: lang === 'nl' ? module.name_nl : module.name_en,
      description: lang === 'nl' ? module.description_nl : module.description_en,
      studycredit: module.studycredit,
      location: module.location,
    }));
  }

  async findOne(id: string): Promise<Module> {
    const module = await this.moduleModel.findById(id).exec();
    if (!module) {
      throw new NotFoundException(`Module with ID "${id}" not found`);
    }
    return module;
  }
}
