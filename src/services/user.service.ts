import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserDocument } from '../schemas/user.schema';
import { UserInterface } from 'src/interfaces/user.interface';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: string): Promise<UserInterface | null> {
    return await this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userRepository.findByEmail(email);
  }
}
