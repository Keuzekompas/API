/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { UserDocument } from '../user/user.schema';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject('USER_MODEL') private userModel: Model<UserDocument>,
  ) {}

  async login(email: string, password: string): Promise<UserDocument> {
    const user = await this.userRepository.findByEmail(email);
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password)
      : false;
    if (!user || !passwordMatch) {
      throw new Error('Invalid email or password');
    }
    return user; // Add JWT token later
  }
}
