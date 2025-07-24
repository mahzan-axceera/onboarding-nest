import { Module } from '@nestjs/common';
import { PostsService } from '../../services/posts.service';
import { PostsController } from './posts.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TypesenseModule } from 'src/typesense/typesense.module';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from 'src/services/supabase.service';

@Module({
  imports: [TypesenseModule],
  providers: [PostsService, PrismaService, JwtService, SupabaseService],
  controllers: [PostsController]
})
export class PostsModule {}
