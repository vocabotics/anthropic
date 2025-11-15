import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth';
import { stripeService } from '../services/stripe.service';
import { logger } from '../utils/logger';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Validation schemas
const createCheckoutSchema = z.object({
  priceId: z.string(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const updateSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  priceId: z.string().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

/**
 * GET /api/stripe/prices
 * Get available pricing plans
 */
router.get('/prices', async (req, res, next) => {
  try {
    const prices = await stripeService.getPricingPlans();
    res.json({ prices });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stripe/checkout
 * Create checkout session
 */
router.post('/checkout', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const input = createCheckoutSchema.parse(req.body);

    const session = await stripeService.createCheckoutSession(
      req.user.userId,
      input.priceId,
      input.successUrl || `${process.env.FRONTEND_URL}/settings/billing?success=true`,
      input.cancelUrl || `${process.env.FRONTEND_URL}/settings/billing?canceled=true`
    );

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    next(error);
  }
});

/**
 * POST /api/stripe/portal
 * Create customer portal session
 */
router.post('/portal', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await stripeService.createPortalSession(
      req.user.userId,
      `${process.env.FRONTEND_URL}/settings/billing`
    );

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stripe/subscriptions
 * List user subscriptions
 */
router.get('/subscriptions', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const subscriptions = await stripeService.listUserSubscriptions(
      req.user.userId
    );

    res.json({ subscriptions });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/stripe/subscriptions
 * Update subscription
 */
router.patch('/subscriptions', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const input = updateSubscriptionSchema.parse(req.body);

    const subscription = await stripeService.updateSubscription(input);

    res.json({ subscription });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    next(error);
  }
});

/**
 * DELETE /api/stripe/subscriptions/:id
 * Cancel subscription
 */
router.delete('/subscriptions/:id', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { immediately } = req.query;

    await stripeService.cancelSubscription(
      id,
      immediately === 'true'
    );

    res.json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stripe/webhook
 * Stripe webhook handler
 */
router.post('/webhook', async (req, res, next) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    await stripeService.handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(400).json({
      error: 'Webhook signature verification failed',
    });
  }
});

export default router;
