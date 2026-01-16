import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import mongoose, { Model } from 'mongoose';
import cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { ModulesModule } from '../modules.module';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongoMemoryServer } from 'mongodb-memory-server';

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

describe('Modules Integration (Flows)', () => {
  let app: INestApplication;
  let moduleModel: Model<any>;
  let jwtService: JwtService;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        ModulesModule,
        AuthModule, // Used for AuthGuard
        ThrottlerModule.forRoot({
          throttlers: [
            { name: 'short', ttl: 10000, limit: 100 }, 
            { name: 'long', ttl: 900000, limit: 1000 }, 
            { name: 'loginAttempts', ttl: 60000, limit: 100 }, 
            { name: 'verify2fa', ttl: 60000, limit: 100 }, 
          ],
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
    app.useGlobalPipes(new ValidationPipe({ transform: true })); // Transform for query DTOs
    
    moduleModel = moduleFixture.get<Model<any>>('MODULE_MODEL');
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    await app.close();
  });

  beforeEach(async () => {
    await moduleModel.deleteMany({});
  });

  const getAuthCookie = () => {
    // Generate a generic valid token
    const token = jwtService.sign({ userId: '507f1f77bcf86cd799439011' }, { secret: process.env.JWT_SECRET });
    return `token=${token}`;
  };

  const createTestModule = (props = {}) => {
    const defaultModule = {
      name_en: 'Test Module',
      name_nl: 'Test Module NL',
      description_en: 'Test Description',
      description_nl: 'Test Beschrijving',
      studycredit: 6,
      location: 'Breda',
      level: 'Advanced',
      module_tags_en: ['tech', 'fun'],
      module_tags_nl: ['tech', 'leuk'],
      start_date: new Date(),
    };
    return moduleModel.create({ ...defaultModule, ...props });
  };


  describe('2. Modules ophalen/filteren (GET /modules)', () => {
    it('should return all modules (paginated)', async () => {
      await moduleModel.deleteMany({});
      
      const defaultModule = {
          description_en: 'Description',
          description_nl: 'Beschrijving',
          studycredit: 3,
          location: 'Breda',
          level: 'Intro',
          module_tags_en: [],
          module_tags_nl: [],
          start_date: new Date()
      };

      await moduleModel.create({ ...defaultModule, name_en: 'Module A', name_nl: 'Module A' });
      await moduleModel.create({ ...defaultModule, name_en: 'Module B', name_nl: 'Module B', location: 'Den Bosch' });

      // Verification
      const count = await moduleModel.countDocuments();
      expect(count).toBe(2);

      const cookie = getAuthCookie();

      const response = await request(app.getHttpServer())
        .get('/modules')
        .set('Cookie', [cookie])
        .expect(200);
      
      expect(response.body.data.modules).toHaveLength(2);
    });



    it('should filter modules by name', async () => {
      await moduleModel.deleteMany({});
  
      await moduleModel.create({ 
          name_en: 'Python Intro', 
          name_nl: 'Python', 
          description_en: 'x', 
          description_nl: 'x', 
          studycredit: 1, 
          location: 'x',
          level: 'Intro',
          module_tags_en: [], 
          module_tags_nl: [], 
          start_date: new Date()
      });

      await moduleModel.create({ 
          name_en: 'History 101', 
          name_nl: 'History', 
          description_en: 'x', 
          description_nl: 'x', 
          studycredit: 1, 
          location: 'x',
          level: 'Intro',
          module_tags_en: [], 
          module_tags_nl: [], 
          start_date: new Date()
      });

      
      expect(await moduleModel.countDocuments({})).toBe(2);

      const cookie = getAuthCookie();

      const response = await request(app.getHttpServer())
        .get('/modules?search=Python')
        .set('Cookie', [cookie])
        .expect(200);

      
      expect(response.body.data.modules).toHaveLength(1);
      expect(response.body.data.modules[0].name).toContain('Python');
    });
  });

  describe('3. Module detail ophalen (GET /modules/:id)', () => {
    it('should return 404 for unknown ID', async () => {
      const cookie = getAuthCookie();
      // Use a valid ObjectId that doesn't exist
      await request(app.getHttpServer())
        .get('/modules/507f1f77bcf86cd799439011')
        .set('Cookie', [cookie])
        .expect(404); 
    });

    it('should return module detail', async () => {
      const module = await createTestModule({ name_en: 'Detail Test' });
      const cookie = getAuthCookie();

      const response = await request(app.getHttpServer())
        .get(`/modules/${module._id}`)
        .set('Cookie', [cookie])
        .expect(200);

      expect(response.body.data.name).toBe('Detail Test');
    });
  });
});
