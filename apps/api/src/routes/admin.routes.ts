import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProjects,
      totalAICalls,
      activeSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.aiCall.count(),
      prisma.subscription.count({
        where: { status: { in: ['active', 'trialing'] } },
      }),
      prisma.subscription.aggregate({
        where: { status: 'active' },
        _sum: { amount: true },
      }),
    ]);

    // Get AI costs
    const aiCosts = await prisma.aiCall.aggregate({
      _sum: { costUsd: true },
    });

    // Get usage this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [projectsThisMonth, usersThisMonth] = await Promise.all([
      prisma.project.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    res.json({
      totalUsers,
      totalProjects,
      totalAICalls,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalAICosts: aiCosts._sum.costUsd?.toNumber() || 0,
      thisMonth: {
        newProjects: projectsThisMonth,
        newUsers: usersThisMonth,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users
 * List all users
 */
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              projects: true,
            },
          },
        },
      }),
      prisma.user.count(),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/projects
 * List all projects
 */
router.get('/projects', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              artifacts: true,
            },
          },
        },
      }),
      prisma.project.count(),
    ]);

    res.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/analytics/ai-usage
 * Get AI usage analytics
 */
router.get('/analytics/ai-usage', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get AI calls by day
    const aiCalls = await prisma.aiCall.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
      _sum: {
        totalTokens: true,
        costUsd: true,
      },
    });

    // Get AI calls by model
    const byModel = await prisma.aiCall.groupBy({
      by: ['model'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
      _sum: {
        costUsd: true,
      },
    });

    // Get AI calls by task type
    const byTaskType = await prisma.aiCall.groupBy({
      by: ['taskType'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
      _sum: {
        costUsd: true,
      },
    });

    res.json({
      timeRange: {
        start: startDate,
        end: new Date(),
        days,
      },
      byDay: aiCalls,
      byModel,
      byTaskType,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/analytics/revenue
 * Get revenue analytics
 */
router.get('/analytics/revenue', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get subscriptions by status
    const byStatus = await prisma.subscription.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        amount: true,
      },
    });

    // Get MRR (Monthly Recurring Revenue)
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
      },
      select: {
        amount: true,
      },
    });

    const mrr = activeSubscriptions.reduce(
      (sum, sub) => sum + (sub.amount?.toNumber() || 0),
      0
    );

    // Get new subscriptions this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    res.json({
      mrr,
      byStatus,
      newSubscriptionsThisMonth: newSubscriptions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user (e.g., change role)
 */
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    logger.info('User updated by admin', {
      adminId: req.user!.userId,
      userId: id,
      changes: { role },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/projects/:id
 * Delete project (admin only)
 */
router.delete('/projects/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id },
    });

    logger.info('Project deleted by admin', {
      adminId: req.user!.userId,
      projectId: id,
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
