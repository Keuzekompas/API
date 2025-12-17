import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Add CORS support if needed
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
