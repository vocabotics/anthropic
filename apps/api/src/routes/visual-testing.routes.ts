import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { visualTestingService } from '../services/visual-testing.service';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

// Validation schemas
const runTestSuiteSchema = z.object({
  tests: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    viewport: z.object({
      width: z.number(),
      height: z.number(),
    }).optional(),
    selector: z.string().optional(),
    waitForSelector: z.string().optional(),
    waitTime: z.number().optional(),
  })),
  threshold: z.number().min(0).max(100).optional(),
});

const updateBaselineSchema = z.object({
  testName: z.string(),
});

/**
 * POST /api/visual-testing/:projectId/run
 * Run visual test suite
 */
router.post('/:projectId/run', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const input = runTestSuiteSchema.parse(req.body);

    logger.info('Running visual test suite', {
      projectId,
      testCount: input.tests.length,
      userId: req.user!.userId,
    });

    const results = await visualTestingService.runTestSuite({
      projectId,
      tests: input.tests,
      threshold: input.threshold,
    });

    res.json({ results });
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
 * POST /api/visual-testing/:projectId/generate
 * Auto-generate visual tests from project
 */
router.post('/:projectId/generate', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Generating visual tests', {
      projectId,
      userId: req.user!.userId,
    });

    const tests = await visualTestingService.generateTestsForProject(projectId);

    res.json({ tests });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/visual-testing/:projectId/run-auto
 * Generate and run visual tests automatically
 */
router.post('/:projectId/run-auto', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { threshold } = req.body;

    logger.info('Auto-running visual tests', {
      projectId,
      userId: req.user!.userId,
    });

    // Generate tests
    const tests = await visualTestingService.generateTestsForProject(projectId);

    // Run tests
    const results = await visualTestingService.runTestSuite({
      projectId,
      tests,
      threshold,
    });

    res.json({ tests, results });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/visual-testing/:projectId/baseline
 * Update baseline for a test
 */
router.patch('/:projectId/baseline', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const input = updateBaselineSchema.parse(req.body);

    logger.info('Updating visual test baseline', {
      projectId,
      testName: input.testName,
      userId: req.user!.userId,
    });

    await visualTestingService.updateBaseline(projectId, input.testName);

    res.json({ message: 'Baseline updated successfully' });
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
 * GET /api/visual-testing/:projectId/results
 * Get visual test results history
 */
router.get('/:projectId/results', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    logger.info('Fetching visual test results', {
      projectId,
      limit,
      userId: req.user!.userId,
    });

    const results = await visualTestingService.getTestResults(projectId, limit);

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

export default router;
