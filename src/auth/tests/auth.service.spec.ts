import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UserRepository } from '../../user/user.repository';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt to avoid hashing calculation time
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userRepository: UserRepository;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
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
      const result = await service.login('test@example.com', 'password');

      // Assert
      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('id', mockUser._id);
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login('wrong@email.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('test@example.com', 'wrongPass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should generate a token with correct Session Length (1 hour)', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const { token } = await service.login('test@example.com', 'password');
      const decoded: any = jwtService.decode(token);

      // Assert
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
      
      // Check difference between issued-at and expiration is 3600 seconds (1 hour)
      const sessionLength = decoded.exp - decoded.iat;
      expect(sessionLength).toBe(3600); 
    });
  });
});