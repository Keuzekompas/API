import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { UserDocument } from '../user/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject('USER_MODEL') private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ user: UserDocument; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password)
      : false;

    const token = 'kijken of jij meestuurt';
    // this.jwtService.sign({ email: user?.email });
    if (!user || !passwordMatch) {
      throw new Error('Invalid email or password');
    }
    return { user, token };
  }
}
