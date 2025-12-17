import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import MongoSanitize from 'express-mongo-sanitize';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(MongoSanitize());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
