import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DatabaseModule } from '../../database/database.module';
import { ThrottlerModule } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';

export const mockRedisImplementation = {
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
};

export interface IntegrationTestContext {
  app: INestApplication;
  moduleFixture: TestingModule;
  mongod: MongoMemoryServer;
}

export const setupIntegrationTest = async (imports: any[] = []): Promise<IntegrationTestContext> => {
  process.env.JWT_SECRET = 'test-secret';
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  const builder: TestingModuleBuilder = Test.createTestingModule({
    imports: [
      DatabaseModule,
      ThrottlerModule.forRoot({
          throttlers: [
            { name: 'short', ttl: 10000, limit: 100 }, 
            { name: 'long', ttl: 900000, limit: 1000 }, 
            { name: 'loginAttempts', ttl: 60000, limit: 100 }, 
            { name: 'verify2fa', ttl: 60000, limit: 100 }, 
          ],
        }),
      ...imports
    ],
  })
  .overrideProvider('DATABASE_CONNECTION')
  .useFactory({
    factory: async () => {
      return await mongoose.connect(uri);
    },
  });

  const moduleFixture = await builder.compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true })); // Standardize pipe config
  
  await app.init();

  return { app, moduleFixture, mongod };
};

export const teardownIntegrationTest = async (context: IntegrationTestContext) => {
    await mongoose.disconnect();
    if (context.mongod) await context.mongod.stop();
    await context.app.close();
};
