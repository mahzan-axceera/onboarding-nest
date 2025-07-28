import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import Stripe from 'stripe';
import { SubscriptionService } from '../../services/subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private configService: ConfigService,
  ) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Stripe checkout session' })
  @ApiBody({
    schema: { type: 'object', properties: { priceId: { type: 'string' } } },
  })
  async createCheckoutSession(
    @Request() req,
    @Body() body: { priceId: string },
  ) {
    try {
      return await this.subscriptionService.createCheckoutSession(
        req.user.sub,
        body.priceId,
      );
    } catch (err) {
      console.error('Controller error:', err);
      throw err;
    }
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Stripe customer portal session' })
  async createCustomerPortalSession(@Request() req) {
    return this.subscriptionService.createCustomerPortalSession(req.user.sub);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async handleWebhook(@Request() req: RawBodyRequest<Request>) {
    const stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
      {
        apiVersion: '2025-06-30.basil',
      },
    );
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    )!;
    let event: Stripe.Event;

    if (!req.rawBody) {
      throw new InternalServerErrorException('No webhook payload provided');
    }
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error(
        `Webhook signature verification failed: ${err.message}`,
        err.stack,
      );
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }
    await this.subscriptionService.handleWebhook(event);
    return { received: true };
  }
}
