import { Module } from '@nestjs/common';
import { PostsModule } from './controllers/posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './controllers/auth/auth.module';
import { AuthService } from './services/auth.service';
import { SupabaseService } from './services/supabase.service';
import { SubscriptionModule } from './controllers/subscriptions/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Loads .env globally
    PostsModule,
    PrismaModule,
    AuthModule,
    SubscriptionModule
  ],
  providers: [SupabaseService],
})
export class AppModule {}
