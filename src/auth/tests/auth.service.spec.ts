import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UserRepository } from '../../user/user.repository';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt to avoid hashing calculation time
jest.mock('bcrypt');

// Mock Redis and PenaltyManager to prevent real connections
jest.mock('../../utils/redis', () => ({
  redisInstance: {},
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get<UserRepository>(UserRepository);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return a JWT token and user ID on successful login', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login('test@example.com', 'password', '127.0.0.1');

      // Assert
      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('id', mockUser._id);
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
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

    it('should generate a token with correct Session Length (1 hour)', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const { token } = await service.login('test@student.avans.nl', 'password', '127.0.0.1');
      const decoded: any = jwtService.decode(token);

      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
      
      const sessionLength = decoded.exp - decoded.iat;
      expect(sessionLength).toBe(3600); 
    });
  });
});