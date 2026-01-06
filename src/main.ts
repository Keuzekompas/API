import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as MongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import { ApiExceptionFilter } from './utils/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalFilters(new ApiExceptionFilter());

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      // or check if the origin is in the whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // This blocks the request directly at the CORS level
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
  });

  app.use((req, res, next) => {
    if (req.body) MongoSanitize.sanitize(req.body);
    if (req.params) MongoSanitize.sanitize(req.params);
    if (req.query) MongoSanitize.sanitize(req.query);
    next();
  });

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
