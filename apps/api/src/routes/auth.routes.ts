import { Router } from 'express';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 * TODO: Implement in next step
 */
router.post('/register', (req, res) => {
  res.status(501).json({
    message: 'Registration endpoint - Coming soon',
  });
});

/**
 * POST /api/auth/login
 * Login user
 * TODO: Implement in next step
 */
router.post('/login', (req, res) => {
  res.status(501).json({
    message: 'Login endpoint - Coming soon',
  });
});

/**
 * POST /api/auth/logout
 * Logout user
 * TODO: Implement in next step
 */
router.post('/logout', (req, res) => {
  res.status(501).json({
    message: 'Logout endpoint - Coming soon',
  });
});

/**
 * GET /api/auth/me
 * Get current user
 * TODO: Implement in next step
 */
router.get('/me', (req, res) => {
  res.status(501).json({
    message: 'Get current user endpoint - Coming soon',
  });
});

export default router;
