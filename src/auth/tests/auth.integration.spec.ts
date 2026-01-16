import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Model } from 'mongoose';
import { AuthModule } from '../auth.module';
import { UserModule } from '../../user/user.module';
import { UserDocument } from '../../user/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { redisInstance } from '../../utils/redis';
import { setupIntegrationTest, teardownIntegrationTest, IntegrationTestContext } from '../../utils/tests/test-utils';

// Mock PenaltyManager to avoid 429s during tests completely
jest.mock('../../utils/penalty', () => ({
  PenaltyManager: {
    getBlockData: jest.fn().mockResolvedValue({ isBlocked: false }),
    resetPenalty: jest.fn(),
    applyPenalty: jest.fn().mockResolvedValue(60),
    formatTime: jest.fn().mockReturnValue('1m'),
  },
})); 

// Mock Redis
jest.mock('../../utils/redis');

describe('Auth Integration (Flows)', () => {
  let ctx: IntegrationTestContext;
  let app: INestApplication;
  let userModel: Model<UserDocument>;
  let jwtService: JwtService;

  const mockedRedisInstance = redisInstance as jest.Mocked<typeof redisInstance>;

  beforeAll(async () => {
    ctx = await setupIntegrationTest([AuthModule, UserModule]);
    app = ctx.app;
    
    userModel = ctx.moduleFixture.get<Model<UserDocument>>('USER_MODEL');
    jwtService = ctx.moduleFixture.get<JwtService>(JwtService);
  }, 30000);

  afterAll(async () => {
    await teardownIntegrationTest(ctx);
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    jest.clearAllMocks();
  });

  describe('5. Inloggen/JWT/2FA flow (POST /auth/login & /verify-2fa)', () => {
    it('should trigger 2FA flow with valid credentials', async () => {
      const password = 'password123!!';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new userModel({
        email: 'test-2fa@student.avans.nl',
        password: hashedPassword,
        name: 'Test',
        is2FAEnabled: true,
        trustedIPs: [],
      });
      await user.save();

      mockedRedisInstance.get.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test-2fa@student.avans.nl', password });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('2FA required');
    });

    it('should complete 2FA verification with valid code', async () => {
      const user = await userModel.create({ email: 'test-verify@student.avans.nl', password: 'password123', name: 'TestUser' });
      const tempToken = jwtService.sign({ userId: user._id.toString(), isTemp: true }, { secret: process.env.JWT_SECRET });

      mockedRedisInstance.get.mockResolvedValue('123456');

      const response = await request(app.getHttpServer())
        .post('/auth/verify-2fa')
        .set('Cookie', [`temp_token=${tempToken}`])
        .send({ code: '123456' })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies.some(c => c.startsWith('token='))).toBe(true);
    });

    it('should fail 2FA with invalid code', async () => {
       const user = await userModel.create({ email: 'test-fail@student.avans.nl', password: 'password123', name: 'TestUserFail' });
       const tempToken = jwtService.sign({ userId: user._id.toString(), isTemp: true }, { secret: process.env.JWT_SECRET });

       mockedRedisInstance.get.mockResolvedValue('123456');
       mockedRedisInstance.del.mockResolvedValue(1);

       const response = await request(app.getHttpServer())
        .post('/auth/verify-2fa')
        .set('Cookie', [`temp_token=${tempToken}`])
        .send({ code: '654321' });

       expect(response.status).toBe(401);
       expect(response.body.message).toBe('Invalid or expired 2FA code');
    });
  });
});
