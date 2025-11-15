import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export interface CreateSubscriptionInput {
  userId: string;
  priceId: string;
  paymentMethodId?: string;
}

export interface UpdateSubscriptionInput {
  subscriptionId: string;
  priceId?: string;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Stripe Subscription Service
 * Handles payment processing and subscription management
 */
export class StripeService {
  /**
   * Create or get Stripe customer for user
   */
  async getOrCreateCustomer(userId: string): Promise<string> {
    // Check if user already has a Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id,
      },
    });

    // Update user with customer ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    logger.info('Stripe customer created', {
      userId,
      customerId: customer.id,
    });

    return customer.id;
  }

  /**
   * Create subscription
   */
  async createSubscription(
    input: CreateSubscriptionInput
  ): Promise<Stripe.Subscription> {
    try {
      const customerId = await this.getOrCreateCustomer(input.userId);

      // Attach payment method if provided
      if (input.paymentMethodId) {
        await stripe.paymentMethods.attach(input.paymentMethodId, {
          customer: customerId,
        });

        // Set as default payment method
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: input.paymentMethodId,
          },
        });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: input.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: input.userId,
        },
      });

      // Save subscription to database
      await prisma.subscription.create({
        data: {
          userId: input.userId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: input.priceId,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });

      logger.info('Subscription created', {
        userId: input.userId,
        subscriptionId: subscription.id,
        priceId: input.priceId,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription', {
        userId: input.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    input: UpdateSubscriptionInput
  ): Promise<Stripe.Subscription> {
    try {
      const updateData: Stripe.SubscriptionUpdateParams = {};

      if (input.priceId) {
        const subscription = await stripe.subscriptions.retrieve(
          input.subscriptionId
        );

        updateData.items = [
          {
            id: subscription.items.data[0].id,
            price: input.priceId,
          },
        ];
      }

      if (input.cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = input.cancelAtPeriodEnd;
      }

      const subscription = await stripe.subscriptions.update(
        input.subscriptionId,
        updateData
      );

      // Update in database
      await prisma.subscription.update({
        where: { stripeSubscriptionId: input.subscriptionId },
        data: {
          stripePriceId: input.priceId || undefined,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });

      logger.info('Subscription updated', {
        subscriptionId: input.subscriptionId,
        priceId: input.priceId,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to update subscription', {
        subscriptionId: input.subscriptionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<void> {
    try {
      if (immediately) {
        await stripe.subscriptions.cancel(subscriptionId);
      } else {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Update in database
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          cancelAtPeriodEnd: !immediately,
          status: immediately ? 'canceled' : 'active',
        },
      });

      logger.info('Subscription canceled', {
        subscriptionId,
        immediately,
      });
    } catch (error) {
      logger.error('Failed to cancel subscription', {
        subscriptionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create usage record (for usage-based billing)
   */
  async recordUsage(
    subscriptionItemId: string,
    quantity: number,
    action: 'increment' | 'set' = 'increment'
  ): Promise<void> {
    try {
      await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        action,
        timestamp: Math.floor(Date.now() / 1000),
      });

      logger.info('Usage recorded', {
        subscriptionItemId,
        quantity,
        action,
      });
    } catch (error) {
      logger.error('Failed to record usage', {
        subscriptionItemId,
        quantity,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * List subscriptions for user
   */
  async listUserSubscriptions(userId: string) {
    const customerId = await this.getOrCreateCustomer(userId);

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });

    return subscriptions.data;
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const customerId = await this.getOrCreateCustomer(userId);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
        },
      });

      logger.info('Checkout session created', {
        userId,
        sessionId: session.id,
        priceId,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create checkout session', {
        userId,
        priceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create portal session (for customers to manage subscriptions)
   */
  async createPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const customerId = await this.getOrCreateCustomer(userId);

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logger.info('Portal session created', {
        userId,
        sessionId: session.id,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create portal session', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get pricing plans
   */
  async getPricingPlans(): Promise<Stripe.Price[]> {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    return prices.data;
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    logger.info('Processing Stripe webhook', {
      type: event.type,
      id: event.id,
    });

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(
          event.data.object as Stripe.Invoice
        );
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    logger.info('Subscription updated from webhook', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<void> {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'canceled',
      },
    });

    logger.info('Subscription deleted from webhook', {
      subscriptionId: subscription.id,
    });
  }

  /**
   * Handle payment succeeded
   */
  private async handlePaymentSucceeded(
    invoice: Stripe.Invoice
  ): Promise<void> {
    logger.info('Payment succeeded', {
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
      customerId: invoice.customer,
    });

    // You could send a receipt email here
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.error('Payment failed', {
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      customerId: invoice.customer,
    });

    // You could send a payment failed email here
  }
}

// Export singleton
export const stripeService = new StripeService();
