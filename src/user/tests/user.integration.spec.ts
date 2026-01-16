import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import mongoose, { Model, Types } from 'mongoose';
import cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from '../user.module';
import { UserDocument } from '../user.schema';
import { ModulesModule } from '../../modules/modules.module';
import { setupIntegrationTest, teardownIntegrationTest, IntegrationTestContext } from '../../../test/test-utils';

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

describe('User Integration (Flows)', () => {
  let ctx: IntegrationTestContext;
  let app: INestApplication;
  let userModel: Model<UserDocument>;
  let moduleModel: Model<any>;
  let jwtService: JwtService;

  beforeAll(async () => {
    ctx = await setupIntegrationTest([UserModule, ModulesModule]);
    app = ctx.app;
    
    userModel = ctx.moduleFixture.get<Model<UserDocument>>('USER_MODEL');
    moduleModel = ctx.moduleFixture.get<Model<any>>('MODULE_MODEL');
    jwtService = ctx.moduleFixture.get<JwtService>(JwtService);
  }, 30000);

  afterAll(async () => {
    await teardownIntegrationTest(ctx);
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    await moduleModel.deleteMany({});
  });

  const createTestUser = async () => {
    return userModel.create({
      email: 'test@student.avans.nl',
      password: 'hashedpassword',
      name: 'Test User',
    });
  };

  const getAuthCookie = (userId: string) => {
    const token = jwtService.sign({ userId }, { secret: process.env.JWT_SECRET });
    return `token=${token}`;
  };

  describe('1. Profiel ophalen (GET /user/profile)', () => {
    it('should return 401 if not logged in', async () => {
      await request(app.getHttpServer())
        .get('/user/profile')
        .expect(401);
    });

    it('should return 200 and user profile if logged in', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user._id.toString());
      
      const checkUser = await userModel.findById(user._id);
      expect(checkUser).toBeDefined();

      const response = await request(app.getHttpServer())
        .get('/user/profile')
        .set('Cookie', [cookie])
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe('test@student.avans.nl');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 404 if user does not exist (token valid but user deleted)', async () => {
      // Create valid token for non-existent ID
      const fakeId = new Types.ObjectId();
      const cookie = getAuthCookie(fakeId.toString());

      await request(app.getHttpServer())
        .get('/user/profile')
        .set('Cookie', [cookie])
        .expect(404);
    });
  });

  describe('4. Favoriet maken/verwijderen', () => {
    it('should add a module to favorites', async () => {
      const user = await createTestUser();
      const module = await moduleModel.create({
        name_en: 'Test Module',
        name_nl: 'Test Module NL',
        description_en: 'Desc',
        description_nl: 'Desc',
        module_tags_en: [],
        module_tags_nl: [],
      });

      const cookie = getAuthCookie(user._id.toString());

      await request(app.getHttpServer())
        .post(`/user/favorites/${module._id.toString()}`)
        .set('Cookie', [cookie])
        .expect(201); // Created

      const updatedUser = await userModel.findById(user._id);
      expect(updatedUser).toBeDefined();
      expect(updatedUser!.favoriteModules).toContainEqual(module._id);
    });
  });
});
