import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../user/repositories/user.repository';
import { UserDocument } from '../../user/schemas/user.schema';
<<<<<<< HEAD
import { JwtService } from '@nestjs/jwt';
=======
>>>>>>> 100b4043cac0087e7763fe51945248ed8e4c21b0
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}
  async login(email: string, password: string): Promise<UserDocument> {
    const user = await this.userRepository.findByEmail(email);
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password)
      : false;
    if (!user || !passwordMatch) {
      throw new Error('Invalid email or password');
    }
    return user;
  }
}
