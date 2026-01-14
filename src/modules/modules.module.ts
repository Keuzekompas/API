import { Module } from '@nestjs/common';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { modulesProviders } from './modules.providers';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/guards/auth.guard';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ModulesController],
  providers: [ModulesService, ...modulesProviders, AuthGuard],
})
export class ModulesModule {}
