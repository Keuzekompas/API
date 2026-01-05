import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { UserDocument } from '../user/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { LoginResponse } from './auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject('USER_MODEL') private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(email);
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordMatch) {
      throw new UnauthorizedException('Ongeldige inloggegevens');
    }

    const token = this.jwtService.sign({ userId: user._id.toString() });
    return {
      user: { id: user._id.toString() },
      token,
    };
  }
}
