import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { dockerService } from '../services/docker.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schema
const executeSchema = z.object({
  projectId: z.string().uuid(),
  code: z.string().min(1),
  language: z.enum(['javascript', 'typescript', 'python']),
  timeout: z.number().min(1000).max(60000).optional(),
  environment: z.record(z.string()).optional(),
});

/**
 * POST /api/execute
 * Execute code in Docker container
 */
router.post('/', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate input
    const input = executeSchema.parse(req.body);

    // Execute code
    const result = await dockerService.executeCode({
      ...input,
      userId: req.user.userId,
    });

    res.json({ result });
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
 * GET /api/execute/test
 * Test Docker execution environment
 */
router.get('/test/:language', async (req, res, next) => {
  try {
    const language = req.params.language as 'javascript' | 'typescript' | 'python';

    if (!['javascript', 'typescript', 'python'].includes(language)) {
      return res.status(400).json({
        error: 'Invalid language. Must be javascript, typescript, or python',
      });
    }

    const success = await dockerService.testExecution(language);

    res.json({
      language,
      success,
      message: success
        ? `${language} execution environment is working`
        : `${language} execution environment failed`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/execute/info
 * Get Docker environment info
 */
router.get('/info', async (req, res, next) => {
  try {
    const info = await dockerService.getInfo();

    res.json({
      available: !!info,
      info: info ? {
        containers: info.Containers,
        images: info.Images,
        serverVersion: info.ServerVersion,
        operatingSystem: info.OperatingSystem,
        architecture: info.Architecture,
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
