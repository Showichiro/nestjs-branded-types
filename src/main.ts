import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaClientKnownRequestErrorFilter } from './prisma-client-known-request-error/prisma-client-known-request-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new PrismaClientKnownRequestErrorFilter());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
