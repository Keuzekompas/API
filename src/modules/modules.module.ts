import { Module } from '@nestjs/common';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { modulesProviders } from './modules.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ModulesController],
  providers: [
    ModulesService,
    ...modulesProviders,
  ],
})
export class ModulesModule {}
