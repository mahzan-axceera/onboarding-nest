import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SubscriptionService } from 'src/services/subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';


@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PrismaService, JwtService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
