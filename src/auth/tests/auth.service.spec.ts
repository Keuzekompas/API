import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UserRepository } from '../../user/user.repository';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { redisInstance } from '../../utils/redis';
import { MailService } from '../mail.service';

// Mock bcrypt to avoid hashing calculation time
jest.mock('bcrypt');

// Mock Redis
jest.mock('../../utils/redis', () => ({
  redisInstance: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('../../utils/penalty', () => ({
  PenaltyManager: {
    getBlockData: jest.fn().mockResolvedValue({ isBlocked: false, timeLeft: 0 }),
    applyPenalty: jest.fn(),
    resetPenalty: jest.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userRepository: UserRepository;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@student.avans.nl',
    password: 'hashedPassword',
  };

  const mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  const mockMailService = {
    sendTwoFactorCode: jest.fn(),
  };

  const mockUserModel = {}; // Mock for @Inject('USER_MODEL')

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'testSecret',
          signOptions: { expiresIn: '1h' }, // 1 Hour Session Length
        }),
      ],
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: 'USER_MODEL', useValue: mockUserModel },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get<UserRepository>(UserRepository);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return 2FA requirement and temp token on successful credentials', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (redisInstance.setex as jest.Mock).mockResolvedValue('OK');

      // Act
      const result = await service.login('test@student.avans.nl', 'password', '127.0.0.1');

      // Assert
      expect(result).toHaveProperty('requires2FA', true);
      expect(result).toHaveProperty('tempToken');
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@student.avans.nl');
      expect(mockMailService.sendTwoFactorCode).toHaveBeenCalled();
      expect(redisInstance.setex).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login('wrong@email.com', 'password', '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('test@student.avans.nl', 'wrongPass', '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyTwoFactor', () => {
    it('should return user and token on valid 2FA code', async () => {
      // 1. Setup valid temp token
      const userId = mockUser._id;
      const tempToken = jwtService.sign({ userId, isTemp: true });

      // 2. Setup Redis mock to return matching code
      const code = '123456';
      (redisInstance.get as jest.Mock).mockResolvedValue(code);
      (redisInstance.del as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await service.verifyTwoFactor(tempToken, code);

      // Assert
      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('id', userId);
      
      // Check session length
      const decoded: any = jwtService.decode(result.token!);
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
      expect(decoded.exp - decoded.iat).toBe(3600); // 1 hour
    });

    it('should throw UnauthorizedException on invalid 2FA code', async () => {
      const userId = mockUser._id;
      const tempToken = jwtService.sign({ userId, isTemp: true });
      (redisInstance.get as jest.Mock).mockResolvedValue('123456');

      await expect(service.verifyTwoFactor(tempToken, '000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});