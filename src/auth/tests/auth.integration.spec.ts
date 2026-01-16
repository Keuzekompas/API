import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import mongoose, { Model } from 'mongoose';
import cookieParser from 'cookie-parser';
import { AuthModule } from '../auth.module';
import { UserModule } from '../../user/user.module';
import { DatabaseModule } from '../../database/database.module';
import { UserDocument } from '../../user/user.schema';
import * as bcrypt from 'bcrypt';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { redisInstance } from '../../utils/redis';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Mock PenaltyManager to avoid 429s during tests completely
jest.mock('../../utils/penalty', () => ({
  PenaltyManager: {
    getBlockData: jest.fn().mockResolvedValue({ isBlocked: false }),
    resetPenalty: jest.fn(),
    applyPenalty: jest.fn().mockResolvedValue(60), // Return dummy penalty time
    formatTime: jest.fn().mockReturnValue('1m'),
  },
}));

// Mock Redis
jest.mock('../../utils/redis', () => ({
  redisInstance: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn(),
    ttl: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    setex: jest.fn(),
  },
}));

describe('Auth Integration (Flows)', () => {
  let app: INestApplication;
  let userModel: Model<UserDocument>;
  let jwtService: JwtService;
  let mongod: MongoMemoryServer;

  const mockRedisGet = redisInstance.get as jest.Mock;
  const mockRedisSetEx = redisInstance.setex as jest.Mock;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        AuthModule,
        UserModule,
        ThrottlerModule.forRoot({
            throttlers: [
              { name: 'short', ttl: 10000, limit: 100 }, 
              { name: 'long', ttl: 900000, limit: 1000 }, 
              { name: 'loginAttempts', ttl: 60000, limit: 100 }, 
              { name: 'verify2fa', ttl: 60000, limit: 100 }, 
            ],
            // force memory storage
          }),
      ],
    })
    .overrideProvider('DATABASE_CONNECTION')
    .useFactory({
      factory: async () => {
        return await mongoose.connect(uri);
      },
    })
    .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    
    userModel = moduleFixture.get<Model<UserDocument>>('USER_MODEL');
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    await app.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    jest.clearAllMocks();
  });

  describe('5. Inloggen/JWT/2FA flow (POST /auth/login & /verify-2fa)', () => {
    it('should trigger 2FA flow with valid credentials', async () => {
      // AuthDto forces lowercase, so we must use lowercase password to match
      const password = 'password123!!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await userModel.create({
        email: 'test-login@student.avans.nl',
        password: hashedPassword,
        name: 'Login User',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test-login@student.avans.nl', password: password })
        .expect(200);
      
      // Expect 2FA required response
      expect(response.body.data.requires2FA).toBe(true);
      expect(mockRedisSetEx).toHaveBeenCalled();
    });

    it('should complete 2FA verification with valid code', async () => {
      // 1. Setup User
      const user = await userModel.create({
        email: 'test-verify@student.avans.nl',
        password: 'password123',
        name: 'Verify User',
      });

      // 2. Generate temp token manually (mimic login)
      const tempToken = jwtService.sign({ userId: user._id.toString(), isTemp: true }, { expiresIn: '5m', secret: process.env.JWT_SECRET });

      // 3. Mock Redis to return the code when verified
      mockRedisGet.mockResolvedValue('123456');

      // 4. Perform Verify Request
      const response = await request(app.getHttpServer())
        .post('/auth/verify-2fa')
        .set('Cookie', [`temp_token=${tempToken}`]) // Controller looks for cookie
        .send({ code: '123456' })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.includes('token='))).toBeTruthy();
    });

    it('should fail 2FA with invalid code', async () => {
       const user = await userModel.create({ email: 'test-fail@student.avans.nl', password: 'password123', name: 'Fail User' });
       const tempToken = jwtService.sign({ userId: user._id.toString(), isTemp: true }, { secret: process.env.JWT_SECRET });

       mockRedisGet.mockResolvedValue('123456');

       await request(app.getHttpServer())
        .post('/auth/verify-2fa')
        .set('Cookie', [`temp_token=${tempToken}`])
        .send({ code: '000000' }) // Wrong code
        .expect(401);
    });
  });

  describe('6. Foutafhandeling (Login)', () => {
    it('should fail with invalid credentials', async () => {
       await userModel.create({
        email: 'test-login@student.avans.nl',
        password: 'hashedpassword',
        name: 'Login User',
      });

      // Use a password that meets complexity requirements but is incorrect
      const wrongPassword = 'WrongPassword123!!';

      await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test-login@student.avans.nl', password: wrongPassword })
      .expect(401);
    });

     it('should fail if user does not exist', async () => {
       // Must use valid password format to pass validation pipe
       await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nonexistent@student.avans.nl', password: 'Password123!!' })
      .expect(401); 
    });
  });
});
