import { Router } from 'express';
import { z } from 'zod';
import { keyManagerService } from '../services/key-manager.service';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createKeySchema = z.object({
  provider: z.enum(['openrouter', 'github', 'stripe']),
  apiKey: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
});

const updateKeySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/keys
 * List all API keys for current user
 */
router.get('/', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const provider = req.query.provider as string | undefined;

    const keys = await keyManagerService.listKeys(req.user.userId, provider);

    res.json({ keys });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/keys
 * Create a new API key
 */
router.post('/', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate input
    const input = createKeySchema.parse(req.body);

    // Create key
    const key = await keyManagerService.createKey({
      userId: req.user.userId,
      ...input,
    });

    res.status(201).json({ key });
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
 * PATCH /api/keys/:id
 * Update an API key
 */
router.patch('/:id', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const keyId = req.params.id;

    // Validate input
    const input = updateKeySchema.parse(req.body);

    // Update key
    const key = await keyManagerService.updateKey(
      req.user.userId,
      keyId,
      input
    );

    res.json({ key });
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
 * DELETE /api/keys/:id
 * Delete an API key
 */
router.delete('/:id', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const keyId = req.params.id;

    await keyManagerService.deleteKey(req.user.userId, keyId);

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/keys/validate
 * Validate an API key without storing it
 */
router.post('/validate', async (req, res, next) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({
        error: 'Provider and apiKey are required',
      });
    }

    // Only OpenRouter validation is implemented for now
    if (provider !== 'openrouter') {
      return res.status(400).json({
        error: 'Only OpenRouter validation is supported',
      });
    }

    const { OpenRouterClient } = await import('../lib/openrouter');
    const client = OpenRouterClient.withKey(apiKey);
    const isValid = await client.validateKey();

    res.json({ valid: isValid });
  } catch (error) {
    res.json({ valid: false });
  }
});

export default router;
