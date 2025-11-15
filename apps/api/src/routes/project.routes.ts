import { Router } from 'express';

const router = Router();

/**
 * GET /api/projects
 * List all projects
 * TODO: Implement in next step
 */
router.get('/', (req, res) => {
  res.status(501).json({
    message: 'List projects endpoint - Coming soon',
  });
});

/**
 * POST /api/projects
 * Create new project
 * TODO: Implement in next step
 */
router.post('/', (req, res) => {
  res.status(501).json({
    message: 'Create project endpoint - Coming soon',
  });
});

/**
 * GET /api/projects/:id
 * Get project by ID
 * TODO: Implement in next step
 */
router.get('/:id', (req, res) => {
  res.status(501).json({
    message: 'Get project endpoint - Coming soon',
    projectId: req.params.id,
  });
});

export default router;
