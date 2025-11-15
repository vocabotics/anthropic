import { Router } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { authenticate } from '../middleware/auth';
import { githubService } from '../services/github.service';
import { keyManagerService } from '../services/key-manager.service';
import { logger } from '../utils/logger';

const router = Router();

// OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/github/callback';

// Validation schemas
const createRepoSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

const createCommitSchema = z.object({
  projectId: z.string().uuid(),
  owner: z.string(),
  repo: z.string(),
  branch: z.string(),
  message: z.string(),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
  })),
});

const createPRSchema = z.object({
  projectId: z.string().uuid(),
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  body: z.string(),
  head: z.string(),
  base: z.string(),
});

/**
 * GET /api/github/auth
 * Redirect to GitHub OAuth
 */
router.get('/auth', authenticate, (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({
      error: 'GitHub OAuth not configured',
    });
  }

  const state = Buffer.from(JSON.stringify({
    userId: req.user!.userId,
    timestamp: Date.now(),
  })).toString('base64');

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=repo,user:email&state=${state}`;

  res.redirect(authUrl);
});

/**
 * GET /api/github/callback
 * GitHub OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        error: 'Missing code or state',
      });
    }

    // Verify state
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const userId = stateData.userId;

    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    // Store token using BYOK manager
    await keyManagerService.createKey({
      userId,
      provider: 'github',
      apiKey: accessToken,
      name: 'GitHub OAuth Token',
      description: 'OAuth token for GitHub integration',
    });

    logger.info('GitHub OAuth successful', { userId });

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/integrations?github=success`);
  } catch (error) {
    logger.error('GitHub OAuth callback failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/integrations?github=error`);
  }
});

/**
 * GET /api/github/user
 * Get authenticated GitHub user info
 */
router.get('/user', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await githubService.getAuthenticatedUser(req.user.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repos
 * List user's GitHub repositories
 */
router.get('/repos', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 30;

    const repos = await githubService.listRepositories(req.user.userId, page, perPage);
    res.json({ repos });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/github/repos
 * Create a new repository
 */
router.post('/repos', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const input = createRepoSchema.parse(req.body);

    const repoUrl = await githubService.createRepository(
      req.user.userId,
      input.projectId,
      {
        name: input.name,
        description: input.description,
        isPrivate: input.isPrivate,
      }
    );

    res.status(201).json({ repoUrl });
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
 * POST /api/github/commits
 * Create a commit
 */
router.post('/commits', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const input = createCommitSchema.parse(req.body);

    const commitSha = await githubService.createCommit(
      req.user.userId,
      input.projectId,
      {
        owner: input.owner,
        repo: input.repo,
        branch: input.branch,
        message: input.message,
        files: input.files,
      }
    );

    res.status(201).json({ commitSha });
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
 * POST /api/github/pulls
 * Create a pull request
 */
router.post('/pulls', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const input = createPRSchema.parse(req.body);

    const prUrl = await githubService.createPullRequest(
      req.user.userId,
      input.projectId,
      {
        owner: input.owner,
        repo: input.repo,
        title: input.title,
        body: input.body,
        head: input.head,
        base: input.base,
      }
    );

    res.status(201).json({ prUrl });
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

export default router;
