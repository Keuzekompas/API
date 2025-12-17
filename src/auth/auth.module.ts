import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from '../user/user.repository';
import { DatabaseModule } from 'src/database/database.module';
import { userProviders } from 'src/user/user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, ...userProviders],
})
export class AuthModule {}
