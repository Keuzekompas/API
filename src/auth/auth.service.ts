import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { UserDocument } from '../user/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { LoginResponse } from './auth.interface';
import { redisInstance } from '../utils/redis';
import { PenaltyManager } from '../utils/penalty';
import { MailService } from './mail.service';
import * as crypto from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject('USER_MODEL') private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
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

    // Generate 2FA code
    const code = crypto.randomInt(100000, 999999).toString();
    const userId = user._id.toString();

    // Save code to Redis (expires in 5 minutes)
    await redisInstance.setex(`2fa:${userId}`, 300, code);

    // Send email
    await this.mailService.sendTwoFactorCode(user.email, code);

    // Generate temporary token for verification
    const tempToken = this.jwtService.sign(
      { userId, isTemp: true },
      { expiresIn: '5m' }
    );

    return {
      requires2FA: true,
      tempToken,
    };
  }

  async verifyTwoFactor(tempToken: string, code: string, ip: string): Promise<LoginResponse> {
    let payload: { userId: string; isTemp: boolean };
    try {
      payload = this.jwtService.verify(tempToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired session', {
        cause: error,
      });
    }

    if (!payload.isTemp) {
      throw new UnauthorizedException('Invalid token type');
    }

    const userId = payload.userId;
    const storedCode = await redisInstance.get(`2fa:${userId}`);

    if (!storedCode || storedCode.length !== code.length) {
      throw new UnauthorizedException('Invalid or expired 2FA code');
    }

    // Use constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(storedCode),
      Buffer.from(code),
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired 2FA code');
    }

    // Code is valid, remove it
    await redisInstance.del(`2fa:${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Login fully successful, reset throttle penalty
    await PenaltyManager.resetPenalty(`ip:${ip}`);
    await PenaltyManager.resetPenalty(`account:${user.email.toLowerCase()}`);

    // Issue full token
    const token = this.jwtService.sign({ userId, name: user.name });

    return {
      user: { id: userId },
      token,
    };
  }

  async validateUser(userId: string) {
    return this.userRepository.findById(userId);
  }
}