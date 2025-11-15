/**
 * Performance Monitoring Middleware
 *
 * Tracks request/response times, memory usage, and other performance metrics
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getMemoryUsage } from '../utils/performance';

/**
 * Request timing middleware
 */
export function requestTiming(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Store start time
  res.locals.startTime = start;

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        status: res.statusCode,
      });
    }

    // Add timing header
    res.setHeader('X-Response-Time', `${duration}ms`);
  });

  next();
}

/**
 * Memory monitoring middleware
 */
export function memoryMonitoring(req: Request, res: Response, next: NextFunction) {
  const memory = getMemoryUsage();

  // Warn if heap usage is high (> 80% of total)
  const heapUsagePercent = (memory.heapUsed / memory.heapTotal) * 100;
  if (heapUsagePercent > 80) {
    logger.warn('High memory usage detected', {
      heapUsed: `${memory.heapUsed}MB`,
      heapTotal: `${memory.heapTotal}MB`,
      percentage: `${heapUsagePercent.toFixed(2)}%`,
    });
  }

  next();
}

/**
 * Request size limiting middleware
 */
export function requestSizeLimit(maxSizeKB: number = 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSizeBytes = maxSizeKB * 1024;

    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: `${maxSizeKB}KB`,
        receivedSize: `${Math.round(contentLength / 1024)}KB`,
      });
    }

    next();
  };
}

/**
 * Cache headers middleware
 */
export function cacheHeaders(options: {
  maxAge?: number;
  sMaxAge?: number;
  mustRevalidate?: boolean;
  noCache?: boolean;
  noStore?: boolean;
} = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const {
      maxAge = 0,
      sMaxAge,
      mustRevalidate = false,
      noCache = false,
      noStore = false,
    } = options;

    const directives: string[] = [];

    if (noCache) {
      directives.push('no-cache');
    }

    if (noStore) {
      directives.push('no-store');
    }

    if (maxAge > 0) {
      directives.push(`max-age=${maxAge}`);
    }

    if (sMaxAge !== undefined) {
      directives.push(`s-maxage=${sMaxAge}`);
    }

    if (mustRevalidate) {
      directives.push('must-revalidate');
    }

    if (directives.length > 0) {
      res.setHeader('Cache-Control', directives.join(', '));
    }

    next();
  };
}

/**
 * ETag generation middleware
 */
export function etagMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;

  res.send = function (data: any) {
    if (res.statusCode === 200 && data) {
      const crypto = require('crypto');
      const etag = crypto
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');

      res.setHeader('ETag', `"${etag}"`);

      // Check if client has cached version
      if (req.headers['if-none-match'] === `"${etag}"`) {
        res.status(304).end();
        return res;
      }
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Query optimization hints middleware
 */
export function queryOptimizationHints(req: Request, res: Response, next: NextFunction) {
  // Add query optimization helpers to request
  req.query.page = req.query.page ? parseInt(req.query.page as string) : 1;
  req.query.limit = req.query.limit
    ? Math.min(100, parseInt(req.query.limit as string))
    : 10;

  next();
}

/**
 * Response compression filter
 */
export function compressionFilter(req: Request, res: Response): boolean {
  // Don't compress if client doesn't support it
  if (!req.headers['accept-encoding']) {
    return false;
  }

  // Don't compress small responses
  const contentLength = parseInt(res.getHeader('content-length') as string || '0');
  if (contentLength < 1024) {
    return false;
  }

  // Don't compress images, videos, etc.
  const contentType = res.getHeader('content-type') as string;
  if (contentType && /image|video|audio/.test(contentType)) {
    return false;
  }

  return true;
}

/**
 * Database query logging middleware
 */
export function databaseQueryLogging(req: Request, res: Response, next: NextFunction) {
  const queries: Array<{ query: string; duration: number }> = [];

  // Store queries array in response locals
  res.locals.queries = queries;

  // Log queries on response finish
  res.on('finish', () => {
    if (queries.length > 0) {
      const totalDuration = queries.reduce((sum, q) => sum + q.duration, 0);

      logger.debug('Database queries', {
        count: queries.length,
        totalDuration: `${totalDuration}ms`,
        path: req.path,
      });

      // Warn if too many queries (N+1 problem)
      if (queries.length > 10) {
        logger.warn('Potential N+1 query problem detected', {
          path: req.path,
          queryCount: queries.length,
        });
      }
    }
  });

  next();
}

/**
 * API versioning middleware
 */
export function apiVersioning(req: Request, res: Response, next: NextFunction) {
  // Get version from header or query
  const version = req.headers['api-version'] || req.query.v || 'v1';

  // Store version in request
  req.apiVersion = version as string;

  // Add version to response header
  res.setHeader('X-API-Version', version as string);

  next();
}

/**
 * Request ID middleware
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const crypto = require('crypto');
  const id = crypto.randomBytes(16).toString('hex');

  // Store in request and response
  req.id = id;
  res.setHeader('X-Request-ID', id);

  next();
}

/**
 * Metrics collection middleware
 */
interface Metrics {
  requests: number;
  errors: number;
  totalDuration: number;
  avgDuration: number;
  slowRequests: number;
}

const metrics: Map<string, Metrics> = new Map();

export function metricsCollection(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.route?.path || req.path;

    // Get or create metrics for this path
    let pathMetrics = metrics.get(path);
    if (!pathMetrics) {
      pathMetrics = {
        requests: 0,
        errors: 0,
        totalDuration: 0,
        avgDuration: 0,
        slowRequests: 0,
      };
      metrics.set(path, pathMetrics);
    }

    // Update metrics
    pathMetrics.requests++;
    pathMetrics.totalDuration += duration;
    pathMetrics.avgDuration = pathMetrics.totalDuration / pathMetrics.requests;

    if (res.statusCode >= 400) {
      pathMetrics.errors++;
    }

    if (duration > 1000) {
      pathMetrics.slowRequests++;
    }
  });

  next();
}

export function getMetrics(): Map<string, Metrics> {
  return metrics;
}

export function resetMetrics() {
  metrics.clear();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string;
      apiVersion?: string;
    }
  }
}
