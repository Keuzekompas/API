import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { UserDocument } from '../user/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { LoginResponse } from './auth.interface';
import { redisInstance } from '../utils/redis';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject('USER_MODEL') private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
    ip: string,
  ): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(email);
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Login successful, reset throttle penalty
    const accountKey = `login-limit:${email.toLowerCase()}`;
    await redisInstance.del(`level:${ip}`, `block:${ip}`, accountKey);

    const token = this.jwtService.sign({ userId: user._id.toString() });
    return {
      user: { id: user._id.toString() },
      token,
    };
  }

  async validateUser(userId: string) {
    return this.userRepository.findById(userId);
  }
}
