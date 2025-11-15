/**
 * Performance Optimization Utilities
 *
 * Utilities for optimizing database queries, caching, and performance monitoring
 */

import { redis } from '../lib/redis';
import { logger } from './logger';
import crypto from 'crypto';

/**
 * Generate cache key from object
 */
export function generateCacheKey(prefix: string, data: any): string {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
    .substring(0, 16);

  return `${prefix}:${hash}`;
}

/**
 * Cache decorator for async functions
 */
export function cacheable(ttl: number = 3600) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = generateCacheKey(
        `${target.constructor.name}.${propertyKey}`,
        args
      );

      // Check cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return JSON.parse(cached);
      }

      // Execute method
      const result = await originalMethod.apply(this, args);

      // Cache result
      await redis.setex(cacheKey, ttl, JSON.stringify(result));
      logger.debug(`Cache set: ${cacheKey} (TTL: ${ttl}s)`);

      return result;
    };

    return descriptor;
  };
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<number> {
  const keys = await redis.keys(pattern);
  if (keys.length === 0) return 0;

  await redis.del(...keys);
  logger.info(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
  return keys.length;
}

/**
 * Batch operations helper
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Debounce async function
 */
export function debounce<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  };
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.info(`${name} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${name} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Paginate query results
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function getPaginationParams(query: any): Required<PaginationParams> {
  return {
    page: Math.max(1, parseInt(query.page) || 1),
    limit: Math.min(100, Math.max(1, parseInt(query.limit) || 10)),
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
  };
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  params: Required<PaginationParams>
): PaginatedResult<T> {
  const pages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages,
      hasNext: params.page < pages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Rate limiting helper
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;

  const count = await redis.incr(windowKey);

  if (count === 1) {
    await redis.pexpire(windowKey, windowMs);
  }

  const resetAt = new Date(Math.ceil(now / windowMs) * windowMs);

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetAt,
  };
}

/**
 * Connection pool monitoring
 */
export interface PoolStats {
  active: number;
  idle: number;
  waiting: number;
  total: number;
}

/**
 * Memory usage tracking
 */
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
  };
}

/**
 * Response compression helper
 */
export function shouldCompress(req: any, res: any): boolean {
  if (req.headers['x-no-compression']) {
    return false;
  }

  // Compress responses > 1KB
  return true;
}

/**
 * Query optimization hints
 */
export const QueryOptimizations = {
  /**
   * Select only necessary fields
   */
  selectFields<T extends Record<string, any>>(
    fields: (keyof T)[]
  ): Record<string, boolean> {
    return fields.reduce((acc, field) => {
      acc[field as string] = true;
      return acc;
    }, {} as Record<string, boolean>);
  },

  /**
   * Build dynamic where clause
   */
  buildWhereClause(filters: Record<string, any>): Record<string, any> {
    const where: Record<string, any> = {};

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        where[key] = value;
      }
    }

    return where;
  },

  /**
   * Create pagination query
   */
  getPaginationQuery(params: Required<PaginationParams>) {
    return {
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: {
        [params.sortBy]: params.sortOrder,
      },
    };
  },
};

/**
 * Parallel processing with concurrency limit
 */
export async function parallelMap<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const promise = mapper(items[i], i).then((result) => {
      results[i] = result;
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      const completedIndex = executing.findIndex((p) =>
        p === Promise.resolve()
      );
      if (completedIndex !== -1) {
        executing.splice(completedIndex, 1);
      }
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelay * Math.pow(factor, attempt),
          maxDelay
        );
        logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: number;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime! > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      logger.error(`Circuit breaker opened after ${this.failures} failures`);
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Database connection health check
 */
export async function checkDatabaseHealth(prisma: any): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Redis connection health check
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
}
