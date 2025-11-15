import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { isoComplianceService, ComplianceStandard } from '../services/iso-compliance.service';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

// Validation schemas
const validateSchema = z.object({
  standard: z.enum(['ISO_9001', 'ISO_12207', 'WCAG_2_1', 'ISO_25010']),
});

/**
 * POST /api/compliance/:projectId/validate
 * Validate compliance for a standard
 */
router.post('/:projectId/validate', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const input = validateSchema.parse(req.body);

    logger.info('Validating compliance', {
      projectId,
      standard: input.standard,
      userId: req.user!.userId,
    });

    const report = await isoComplianceService.validateCompliance(
      projectId,
      input.standard as ComplianceStandard
    );

    res.json({ report });
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
 * GET /api/compliance/:projectId/report/:standard
 * Get latest compliance report
 */
router.get('/:projectId/report/:standard', async (req, res, next) => {
  try {
    const { projectId, standard } = req.params;

    if (!['ISO_9001', 'ISO_12207', 'WCAG_2_1', 'ISO_25010'].includes(standard)) {
      return res.status(400).json({ error: 'Invalid standard' });
    }

    logger.info('Fetching compliance report', {
      projectId,
      standard,
      userId: req.user!.userId,
    });

    const report = await isoComplianceService.getLatestReport(
      projectId,
      standard as ComplianceStandard
    );

    if (!report) {
      return res.status(404).json({ error: 'No compliance report found' });
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/:projectId/validate-all
 * Validate all supported standards
 */
router.post('/:projectId/validate-all', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Validating all compliance standards', {
      projectId,
      userId: req.user!.userId,
    });

    const standards: ComplianceStandard[] = ['ISO_9001', 'ISO_12207', 'WCAG_2_1'];
    const reports = [];

    for (const standard of standards) {
      const report = await isoComplianceService.validateCompliance(projectId, standard);
      reports.push(report);
    }

    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/:projectId/summary
 * Get compliance summary across all standards
 */
router.get('/:projectId/summary', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    logger.info('Fetching compliance summary', {
      projectId,
      userId: req.user!.userId,
    });

    const standards: ComplianceStandard[] = ['ISO_9001', 'ISO_12207', 'WCAG_2_1'];
    const summary = [];

    for (const standard of standards) {
      const report = await isoComplianceService.getLatestReport(projectId, standard);
      if (report) {
        summary.push({
          standard,
          overallCompliance: report.overallCompliance,
          passed: report.summary.passedRequirements,
          failed: report.summary.failedRequirements,
          total: report.summary.totalRequirements,
          criticalGaps: report.summary.criticalGaps,
        });
      }
    }

    res.json({ summary });
  } catch (error) {
    next(error);
  }
});

export default router;
