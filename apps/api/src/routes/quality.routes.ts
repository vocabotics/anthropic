import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { qualityMetricsService } from '../services/quality-metrics.service';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

/**
 * GET /api/quality/:projectId/metrics
 * Get latest quality metrics for project
 */
router.get('/:projectId/metrics', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Fetching quality metrics', { projectId, userId: req.user!.userId });

    const metrics = await qualityMetricsService.getLatestMetrics(projectId);

    if (!metrics) {
      return res.status(404).json({ error: 'No metrics found for project' });
    }

    res.json({ metrics });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/quality/:projectId/calculate
 * Calculate quality metrics for project
 */
router.post('/:projectId/calculate', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Calculating quality metrics', { projectId, userId: req.user!.userId });

    const metrics = await qualityMetricsService.calculateMetrics(projectId);

    res.json({ metrics });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quality/:projectId/history
 * Get quality metrics history
 */
router.get('/:projectId/history', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;

    logger.info('Fetching quality metrics history', {
      projectId,
      limit,
      userId: req.user!.userId,
    });

    const history = await qualityMetricsService.getMetricsHistory(projectId, limit);

    res.json({
      history,
      count: history.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quality/:projectId/score
 * Get overall quality score
 */
router.get('/:projectId/score', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Fetching quality score', { projectId, userId: req.user!.userId });

    const metrics = await qualityMetricsService.getLatestMetrics(projectId);

    if (!metrics) {
      return res.status(404).json({ error: 'No metrics found for project' });
    }

    res.json({
      overallScore: metrics.overallScore,
      breakdown: {
        testCoverage: metrics.testCoverage.overallScore,
        codeQuality: metrics.codeQuality.qualityScore,
        requirementCoverage: metrics.requirementCoverage.coveragePercentage,
        securityScore: metrics.security.securityScore,
      },
      timestamp: metrics.timestamp,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quality/:projectId/test-coverage
 * Get test coverage details
 */
router.get('/:projectId/test-coverage', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Fetching test coverage', { projectId, userId: req.user!.userId });

    const metrics = await qualityMetricsService.getLatestMetrics(projectId);

    if (!metrics) {
      return res.status(404).json({ error: 'No metrics found for project' });
    }

    res.json({ testCoverage: metrics.testCoverage });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quality/:projectId/requirement-coverage
 * Get requirement coverage details
 */
router.get('/:projectId/requirement-coverage', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Fetching requirement coverage', { projectId, userId: req.user!.userId });

    const metrics = await qualityMetricsService.getLatestMetrics(projectId);

    if (!metrics) {
      return res.status(404).json({ error: 'No metrics found for project' });
    }

    res.json({ requirementCoverage: metrics.requirementCoverage });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quality/:projectId/ai-quality
 * Get AI generation quality metrics
 */
router.get('/:projectId/ai-quality', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Fetching AI quality metrics', { projectId, userId: req.user!.userId });

    const metrics = await qualityMetricsService.getLatestMetrics(projectId);

    if (!metrics) {
      return res.status(404).json({ error: 'No metrics found for project' });
    }

    res.json({ aiQuality: metrics.aiQuality });
  } catch (error) {
    next(error);
  }
});

export default router;
