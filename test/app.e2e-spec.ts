import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { redisInstance } from 'src/utils/redis';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    await app.close();
    if (redisInstance) {
      await redisInstance.quit();
    }
  });

  beforeEach(async () => {
    const uri = mongod.getUri();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DATABASE_CONNECTION')
      .useFactory({
        factory: async () => {
          return await mongoose.connect(uri);
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    await app.init();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('should have security headers', async () => {
    const response = await request(app.getHttpServer()).get('/');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toBeDefined();
  });
});
