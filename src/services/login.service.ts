import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserDocument } from '../schemas/user.schema';
import { LoginDto } from '../dtos/login.dto';

@Injectable()
export class LoginService {
  constructor(private readonly userRepository: UserRepository) {}
  async login(email: string, password: string): Promise<UserDocument> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }
    return user;
  }
}
