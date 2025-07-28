import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable rawBody globally
  });

  // Custom middleware to capture raw body for webhooks
  app.use('/subscriptions/webhook', (req, res, next) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks);
      // console.log('Captured raw body:', rawBody.toString());
      (req as any).rawBody = rawBody; // Explicitly set rawBody
      next();
    });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert primitive types
      },
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Transform payloads to DTO classes
    }),
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static('uploads')); // Serve uploads directory

  const config = new DocumentBuilder()
    .setTitle('Axceera API')
    .setDescription('Basic Facebook-style API')
    .setVersion('1.0')
    .addTag('posts')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // localhost:3000/api

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    exposedHeaders: ['Set-Cookie'], // Expose Set-Cookie header
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
