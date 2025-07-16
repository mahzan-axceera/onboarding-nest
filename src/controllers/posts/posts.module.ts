import { Module } from '@nestjs/common';
import { PostsService } from '../../services/posts.service';
import { PostsController } from './posts.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TypesenseModule } from 'src/typesense/typesense.module';

@Module({
  imports: [TypesenseModule],
  providers: [PostsService, PrismaService],
  controllers: [PostsController]
})
export class PostsModule {}
