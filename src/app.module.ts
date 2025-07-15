import { Module } from '@nestjs/common';
import { PostsModule } from './controllers/posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PostsModule, PrismaModule],
})
export class AppModule {}
