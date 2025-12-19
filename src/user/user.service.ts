import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserRepository } from './user.repository';
import { UserDocument } from './user.schema';
import { UserInterface } from 'src/user/user.interface';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject('USER_MODEL') private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserInterface | null> {
    return await this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userRepository.findByEmail(email);
  }
}
