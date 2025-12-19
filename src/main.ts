import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as MongoSanitize from 'express-mongo-sanitize';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
<<<<<<< HEAD
  
=======

>>>>>>> 100b4043cac0087e7763fe51945248ed8e4c21b0
  app.use((req, res, next) => {
    if (req.body) MongoSanitize.sanitize(req.body);
    if (req.params) MongoSanitize.sanitize(req.params);
    if (req.query) MongoSanitize.sanitize(req.query);
    next();
  });

<<<<<<< HEAD
=======
  app.setGlobalPrefix('api');

>>>>>>> 100b4043cac0087e7763fe51945248ed8e4c21b0
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();