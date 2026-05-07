import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes: /api/...
  app.setGlobalPrefix('api');

  // Enable CORS for the frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe with class-transformer integration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true,       // Auto-transform payloads to DTO instances
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`🚀 Barbería API running on http://localhost:${port}/api`);
}

bootstrap();
