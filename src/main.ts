import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as MongoSanitize from 'express-mongo-sanitize';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
