import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { workflowService } from '../services/workflow.service';
import { TransitionTrigger } from '../lib/state-machine';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  vision: z.string().min(10),
  description: z.string().optional(),
  technologyStack: z.object({
    frontend: z.array(z.string()).optional(),
    backend: z.array(z.string()).optional(),
    database: z.array(z.string()).optional(),
  }).optional(),
  targetAudience: z.string().optional(),
  keyFeatures: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
});

/**
 * POST /api/workflow/projects
 * Initialize a new project workflow
 */
router.post('/projects', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate input
    const input = createProjectSchema.parse(req.body);

    // Initialize project
    const projectId = await workflowService.initializeProject(
      req.user.userId,
      input
    );

    res.status(201).json({
      projectId,
      message: 'Project initialized successfully. PRD generation started.',
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
 * GET /api/workflow/projects/:id
 * Get project workflow status
 */
router.get('/projects/:id', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    const status = await workflowService.getWorkflowStatus(id);

    res.json(status);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/workflow/projects/:id/approve-prd
 * Approve PRD and start architecture generation
 */
router.post('/projects/:id/approve-prd', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    await workflowService.startArchitectureGeneration(id, req.user.userId);

    res.json({
      message: 'PRD approved. Architecture generation started.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/workflow/projects/:id/approve-architecture
 * Approve architecture and start code generation
 */
router.post('/projects/:id/approve-architecture', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    // Start code generation for all component types
    await workflowService.startCodeGeneration(id, req.user.userId, 'backend');

    res.json({
      message: 'Architecture approved. Code generation started.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/workflow/projects/:id/generate-code
 * Generate code for specific component type
 */
router.post('/projects/:id/generate-code', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { componentType } = req.body;

    if (!['frontend', 'backend', 'database'].includes(componentType)) {
      return res.status(400).json({
        error: 'Invalid component type. Must be frontend, backend, or database.',
      });
    }

    await workflowService.startCodeGeneration(
      id,
      req.user.userId,
      componentType as 'frontend' | 'backend' | 'database'
    );

    res.json({
      message: `${componentType} code generation started.`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/workflow/projects/:id/reject
 * Reject current phase and regenerate
 */
router.post('/projects/:id/reject', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    // TODO: Implement rejection logic with feedback
    // This would transition back to previous generation state

    res.json({
      message: 'Artifact rejected. Regeneration will start with your feedback.',
      reason,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/workflow/projects/:id/events
 * Get workflow events for project (SSE)
 */
router.get('/projects/:id/events', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    // Setup Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial event
    res.write(`data: ${JSON.stringify({ type: 'connected', projectId: id })}\n\n`);

    // Subscribe to workflow events
    const listener = (event: any) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    workflowService.addEventListener(id, listener);

    // Cleanup on close
    req.on('close', () => {
      workflowService.removeEventListener(id, listener);
    });
  } catch (error) {
    next(error);
  }
});

export default router;
