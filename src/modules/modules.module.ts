import { Module } from '@nestjs/common';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { modulesProviders } from './modules.providers';
import { databaseProviders } from '../database/dbConfig';

@Module({
  imports: [],
  controllers: [ModulesController],
  providers: [
    ModulesService,
    ...modulesProviders,
    ...databaseProviders,
  ],
})
export class ModulesModule {}
