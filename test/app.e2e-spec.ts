import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import helmet from 'helmet';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DATABASE_CONNECTION')
      .useValue({
        model: jest.fn(() => ({
          findOne: jest.fn(() => ({
            select: jest.fn(() => ({
              lean: jest.fn(() => ({
                exec: jest.fn(),
              })),
            })),
          })),
        })),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    await app.init();
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
