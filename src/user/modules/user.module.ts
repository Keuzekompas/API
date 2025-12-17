import { Module } from '@nestjs/common';

import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { DatabaseModule } from 'src/database/database.module';
import { userProviders } from 'src/user/providers/user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService, UserRepository, ...userProviders],
})
export class UserModule {}
