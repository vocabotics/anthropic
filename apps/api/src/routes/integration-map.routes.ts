import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { integrationMapService } from '../services/integration-map.service';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

/**
 * GET /api/integration-map/:projectId
 * Get complete integration map for project
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Fetching integration map', { projectId, userId: req.user!.userId });

    const integrationMap = await integrationMapService.getIntegrationMap(projectId);

    res.json({ integrationMap });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integration-map/:projectId/build
 * Build/rebuild integration map
 */
router.post('/:projectId/build', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Building integration map', { projectId, userId: req.user!.userId });

    const integrationMap = await integrationMapService.buildIntegrationMap(projectId);

    res.json({ integrationMap });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integration-map/:projectId/element/:vocaboticsId
 * Get specific element by Vocabotics ID
 */
router.get('/:projectId/element/:vocaboticsId', async (req, res, next) => {
  try {
    const { vocaboticsId } = req.params;

    logger.info('Fetching integration element', { vocaboticsId, userId: req.user!.userId });

    const element = await integrationMapService.getElement(vocaboticsId);

    if (!element) {
      return res.status(404).json({ error: 'Element not found' });
    }

    res.json({ element });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integration-map/:projectId/analyze-impact
 * Analyze impact of requirement change
 */
router.post('/:projectId/analyze-impact', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { requirementId } = req.body;

    if (!requirementId) {
      return res.status(400).json({ error: 'requirementId is required' });
    }

    logger.info('Analyzing requirement impact', {
      projectId,
      requirementId,
      userId: req.user!.userId,
    });

    const impact = await integrationMapService.analyzeImpact(projectId, requirementId);

    res.json({ impact });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integration-map/:projectId/requirements/:requirementId
 * Get all elements implementing a requirement
 */
router.get('/:projectId/requirements/:requirementId', async (req, res, next) => {
  try {
    const { projectId, requirementId } = req.params;

    logger.info('Fetching requirement implementation', {
      projectId,
      requirementId,
      userId: req.user!.userId,
    });

    const integrationMap = await integrationMapService.getIntegrationMap(projectId);

    // Find all elements implementing this requirement
    const implementingElements = integrationMap.elements.filter(element =>
      element.requirements.includes(requirementId)
    );

    res.json({
      requirementId,
      implementingElements,
      totalElements: implementingElements.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integration-map/:projectId/coverage
 * Get requirement coverage summary
 */
router.get('/:projectId/coverage', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Fetching requirement coverage', { projectId, userId: req.user!.userId });

    const integrationMap = await integrationMapService.getIntegrationMap(projectId);

    res.json({ coverage: integrationMap.coverage });
  } catch (error) {
    next(error);
  }
});

export default router;
