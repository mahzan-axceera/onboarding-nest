import { Module } from '@nestjs/common';
import { PostsService } from '../../services/posts.service';
import { PostsController } from './posts.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TypesenseModule } from 'src/typesense/typesense.module';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from 'src/services/supabase.service';
import { SubscriptionService } from 'src/services/subscription.service';

@Module({
  imports: [TypesenseModule],
  providers: [PostsService, PrismaService, JwtService, SupabaseService, SubscriptionService],
  controllers: [PostsController]
})
export class PostsModule {}
