import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Module } from './module.interface';

@Injectable()
export class ModulesService {
  constructor(
    @Inject('MODULE_MODEL')
    private readonly moduleModel: Model<Module>,
  ) {}

  async findAll(): Promise<Module[]> {
    return this.moduleModel.find().exec();
  }

  async findOne(id: string): Promise<Module> {
    const module = await this.moduleModel.findById(id).exec();
    if (!module) {
      throw new NotFoundException(`Module with ID "${id}" not found`);
    }
    return module;
  }
}
