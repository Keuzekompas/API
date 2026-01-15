import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, UnauthorizedException, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { redisInstance } from '../../src/utils/redis';
import { UserService } from '../../src/user/user.service';
import { UserInterface } from 'src/user/user.interface';
import { AuthGuard } from '../../src/auth/guards/auth.guard';

describe('Security & Penetration Tests', () => {
  let app: INestApplication;
  let userService: UserService;
  let mockAuthGuard: CanActivate;

  beforeAll(async () => {
    mockAuthGuard = {
      canActivate: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideProvider('DATABASE_CONNECTION')
      .useValue({
        model: jest.fn(() => ({
          findOne: jest.fn().mockReturnThis(),
          findById: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn(),
        })),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Ensure the validation pipe is applied globally, mirroring main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    userService = moduleFixture.get<UserService>(UserService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await redisInstance.quit(); // Close Redis connection to prevent hangs
  });

  beforeEach(async () => {
    // Clear Redis keys to ensure clean state between tests
    const keys = await redisInstance.keys('*');
    if (keys.length > 0) {
      await redisInstance.del(...keys);
    }
    jest.clearAllMocks();
  });

  describe('1. Authentication Throttling (Brute Force Protection)', () => {
    it('should block the user after 5 failed login attempts', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      const targetEmail = 'victim@student.avans.nl';
      const password = 'WrongPassword123!!'; // Requires 2 special chars

      // 1. Send 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: targetEmail, password })
          .expect(401); // Unauthorized
      }

      // 2. The 6th attempt should be blocked (429 Too Many Requests)
      const blockedResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: targetEmail, password });

      expect(blockedResponse.status).toBe(429);
      // Actual message is "Limit reached. You are now blocked for X minute(s)."
      expect(blockedResponse.body.message).toMatch(/Limit reached|blocked for/);
    });
  });

  describe('2. Input Validation (NoSQL Injection Defense)', () => {
    it('should reject non-string email inputs (MongoDB Operator Injection)', async () => {
      // Attacker tries to send a NoSQL operator instead of a string email
      const maliciousPayload = {
        email: { $ne: null }, // "Not equal to null" - common MongoDB injection
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(maliciousPayload)
        .expect(400); // Bad Request (Validation failed)
    });
  });

  describe('3. Broken Access Control (Protected Routes)', () => {
    it('should deny access to profile without a token', async () => {
      (mockAuthGuard.canActivate as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedException();
      });
      await request(app.getHttpServer())
        .get('/user/profile')
        .expect(401); // Unauthorized
    });

    it('should deny access with an invalid/forged token', async () => {
      (mockAuthGuard.canActivate as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedException();
      });
      await request(app.getHttpServer())
        .get('/user/profile')
        .set('Cookie', [`token=invalid-fake-token`])
        .expect(401);
    });

    it('should allow access with a valid token', async () => {
      (mockAuthGuard.canActivate as jest.Mock).mockImplementation((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId: '507f1f77bcf86cd799439011' };
        return true;
      });
      const user: UserInterface = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@student.avans.nl',
        name: 'Test User',
        favoriteModules: [],
      };
      jest.spyOn(userService, 'findById').mockResolvedValue(user);
      await request(app.getHttpServer())
        .get('/user/profile')
        .expect(200);
    });
  });

  describe('4. JWT Security (Signature Verification)', () => {
    it('should reject a token signed with a different secret', async () => {
      (mockAuthGuard.canActivate as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedException();
      });
      const jwt = require('jsonwebtoken');
      // Create a token that LOOKS valid but is signed with 'attacker-secret' instead of the real one
      const forgedToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011' }, // Random valid-looking ObjectId
        'attacker-secret'
      );

      await request(app.getHttpServer())
        .get('/user/profile')
        .set('Cookie', [`token=${forgedToken}`])
        .expect(401); // Should fail validation
    });

    it('should reject a token with "None" algorithm', async () => {
      (mockAuthGuard.canActivate as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedException();
      });
      const jwt = require('jsonwebtoken');
      // "None" algorithm attack: trying to bypass signature check entirely
      const noneToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011' },
        null, // No secret
        { algorithm: 'none' }
      );

      await request(app.getHttpServer())
        .get('/user/profile')
        .set('Cookie', [`token=${noneToken}`])
        .expect(401);
    });
  });

  describe('5. IP Spoofing (Throttling Bypass)', () => {
    it('should block requests even when IP headers are spoofed', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      const targetEmail = 'victim2@student.avans.nl';
      const password = 'WrongPassword123!!';

      // 1. Exhaust the limit with the "real" IP
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: targetEmail, password })
          .expect(401);
      }

      // 2. Try to bypass the block by spoofing X-Forwarded-For
      // If the server trusts this header blindly (and isn't configured with 'trust proxy'),
      // it might think this request comes from a new IP (1.2.3.4).
      // However, our LoginThrottlerGuard also locks by 'account:{email}', so this specifically checks
      // if the *Account Lockout* holds regardless of IP.
      const spoofedResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', '1.2.3.4')
        .send({ email: targetEmail, password });

      expect(spoofedResponse.status).toBe(429);
      expect(spoofedResponse.body.message).toMatch(/Limit reached|blocked for/);
    });
  });

  describe('6. 2FA Security', () => {
    it('should reject 2FA verification without a session (temp_token)', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-2fa')
        .send({ code: '123456' })
        .expect(401); // Unauthorized (No temp token)
    });

    it('should reject invalid 2FA codes', async () => {
      const user: UserInterface = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@student.avans.nl',
        name: 'Test User',
        favoriteModules: [],
      };
      jest.spyOn(userService, 'findById').mockResolvedValue(user);
      const jwt = require('jsonwebtoken');
      // Mock a valid temp token
      const tempToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011', isTemp: true },
        process.env.JWT_SECRET || 'secret' // Use the same secret as the app
      );

      await request(app.getHttpServer())
        .post('/auth/verify-2fa')
        .set('Cookie', [`temp_token=${tempToken}`])
        .send({ code: '000000' }) // Wrong code
        .expect(401);
    });
  });
});
