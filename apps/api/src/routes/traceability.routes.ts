import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { traceabilityMatrixService, ExportFormat } from '../services/traceability-matrix.service';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

// Validation schemas
const exportSchema = z.object({
  format: z.enum(['json', 'csv', 'pdf', 'html']),
});

/**
 * POST /api/traceability/:projectId/build
 * Build traceability matrix for project
 */
router.post('/:projectId/build', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Building traceability matrix', {
      projectId,
      userId: req.user!.userId,
    });

    const matrix = await traceabilityMatrixService.buildMatrix(projectId);

    res.json({ matrix });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/traceability/:projectId
 * Get latest traceability matrix
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Fetching traceability matrix', {
      projectId,
      userId: req.user!.userId,
    });

    const matrix = await traceabilityMatrixService.getLatestMatrix(projectId);

    if (!matrix) {
      return res.status(404).json({ error: 'No traceability matrix found for project' });
    }

    res.json({ matrix });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/traceability/:projectId/export
 * Export traceability matrix
 */
router.post('/:projectId/export', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const input = exportSchema.parse(req.body);

    logger.info('Exporting traceability matrix', {
      projectId,
      format: input.format,
      userId: req.user!.userId,
    });

    const filePath = await traceabilityMatrixService.exportMatrix(
      projectId,
      input.format as ExportFormat
    );

    res.json({
      message: 'Matrix exported successfully',
      filePath,
      format: input.format,
    });
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
 * GET /api/traceability/:projectId/summary
 * Get traceability matrix summary
 */
router.get('/:projectId/summary', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Fetching traceability matrix summary', {
      projectId,
      userId: req.user!.userId,
    });

    const matrix = await traceabilityMatrixService.getLatestMatrix(projectId);

    if (!matrix) {
      return res.status(404).json({ error: 'No traceability matrix found for project' });
    }

    res.json({ summary: matrix.summary });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/traceability/:projectId/requirement/:requirementId
 * Get traceability details for specific requirement
 */
router.get('/:projectId/requirement/:requirementId', async (req, res, next) => {
  try {
    const { projectId, requirementId } = req.params;

    logger.info('Fetching requirement traceability', {
      projectId,
      requirementId,
      userId: req.user!.userId,
    });

    const matrix = await traceabilityMatrixService.getLatestMatrix(projectId);

    if (!matrix) {
      return res.status(404).json({ error: 'No traceability matrix found for project' });
    }

    const row = matrix.rows.find(r => r.requirementId === requirementId);

    if (!row) {
      return res.status(404).json({ error: 'Requirement not found in matrix' });
    }

    res.json({ requirement: row });
  } catch (error) {
    next(error);
  }
});

export default router;
