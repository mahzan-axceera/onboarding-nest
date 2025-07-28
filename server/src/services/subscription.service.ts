import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new InternalServerErrorException(
        'STRIPE_SECRET_KEY is not defined in environment variables',
      );
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-06-30.basil',
    });
  }

  async createCheckoutSession(userId: number, priceId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    let customerId = (
      await this.prisma.subscription.findUnique({ where: { userId } })
    )?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${this.configService.get('CORS_ORIGIN')}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('CORS_ORIGIN')}/settings`,
      metadata: { userId: userId.toString() },
      subscription_data: {
        metadata: { userId: userId.toString() }, // Ensure metadata is set on subscription
      },
    });
    console.log(session);

    return { sessionId: session.id };
  }

  async createCustomerPortalSession(userId: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!subscription) throw new UnauthorizedException('No subscription found');

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${this.configService.get('CORS_ORIGIN')}/settings`,
    });

    return { url: portalSession.url };
  }

  async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription & {
            current_period_end: number;
          };
          console.log(subscription);
          console.log(subscription.current_period_end);

          console.log('Processing subscription event:', {
            eventType: event.type,
            subscriptionId: subscription.id,
            metadata: subscription.metadata,
            customerId: subscription.customer,
            currentPeriodEnd: subscription.current_period_end,
          });
          if (!subscription.metadata.userId) {
            console.error(
              'Missing userId in subscription metadata:',
              subscription.id,
            );
            throw new InternalServerErrorException(
              'Subscription metadata userId is missing',
            );
          }
          const userId = parseInt(subscription.metadata.userId, 10);
          if (isNaN(userId)) {
            console.error(
              'Invalid userId in subscription metadata:',
              subscription.metadata.userId,
            );
            throw new InternalServerErrorException(
              'Invalid userId in subscription metadata',
            );
          }
          if (!subscription.current_period_end) {
            console.error(
              'No current_period_end in subscription:',
              subscription.id,
            );
            throw new InternalServerErrorException(
              'Subscription current_period_end is missing',
            );
          }
          if (!subscription.items.data[0]?.price.id) {
            console.error(
              'No price ID in subscription items:',
              subscription.id,
            );
            throw new InternalServerErrorException(
              'No price ID in subscription items',
            );
          }

          const price = await this.stripe.prices.retrieve(
            subscription.items.data[0].price.id,
          );
          const product = await this.stripe.products.retrieve(
            price.product as string,
          );
          console.log(product);

          await this.prisma.subscription.upsert({
            where: { userId },
            update: {
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              tier: product.metadata.tier.toUpperCase() as
                | 'LITE'
                | 'BASIC'
                | 'PRO',
              postLimit:
                product.metadata.post_limit === 'unlimited'
                  ? null
                  : parseInt(product.metadata.post_limit, 10),
              interval: price.recurring?.interval || 'month',
              currentPeriodEnd: new Date(
                subscription.current_period_end * 1000,
              ),
              updatedAt: new Date(),
            },
            create: {
              userId,
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              tier: product.metadata.tier.toUpperCase() as
                | 'LITE'
                | 'BASIC'
                | 'PRO',
              postLimit:
                product.metadata.post_limit === 'unlimited'
                  ? null
                  : parseInt(product.metadata.post_limit, 10),
              interval: price.recurring?.interval || 'month',
              currentPeriodEnd: new Date(
                subscription.current_period_end * 1000,
              ),
            },
          });
          console.log('Subscription upsert successful for userId:', userId);
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (err) {
      console.error('Webhook handling error:', {
        message: err.message,
        stack: err.stack,
        eventType: event.type,
        eventId: event.id,
      });
      throw new InternalServerErrorException(
        `Webhook handling error: ${err.message}`,
      );
    }
  }

  async getActiveSubscription(userId: number) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        tier: true,
        postLimit: true,
        status: true,
        interval: true,
        currentPeriodEnd: true,
        createdAt: true,
      },
    });
  }

  async canCreatePost(
    userId: number,
  ): Promise<{ canCreate: boolean; reason?: string }> {
    const subscription = await this.getActiveSubscription(userId);
    console.log(subscription);

    if (!subscription || subscription.status !== 'active') {
      return { canCreate: false, reason: 'No active subscription' };
    }

    if (subscription.postLimit === null) {
      console.log('Unlimited posts allowed for user:', {
        userId,
        tier: subscription.tier,
      });
      return { canCreate: true };
    } // Unlimited posts (Pro)
        
    const postsCount = await this.prisma.post.count({
      where: {
        authorId: userId,
        createdAt: { gte: subscription.createdAt },
      },
    });
    console.log('Post limit check:', {
      userId,
      postsCount,
      postLimit: subscription.postLimit,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });

    return postsCount < subscription.postLimit
      ? { canCreate: true }
      : {
          canCreate: false,
          reason: `Post limit of ${subscription.postLimit} reached for ${subscription.tier} tier`,
        };
  }
}
