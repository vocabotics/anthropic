/**
 * Security Enhancement Middleware
 *
 * Implements additional security measures beyond Helmet.js
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Content Security Policy (CSP) middleware
 */
export function contentSecurityPolicy(req: Request, res: Response, next: NextFunction) {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // TODO: Remove unsafe-inline and unsafe-eval in production
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  next();
}

/**
 * Input sanitization middleware
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize string inputs to prevent XSS
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Sanitize query params
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
}

/**
 * SQL injection prevention middleware
 * (Additional layer beyond Prisma ORM)
 */
export function preventSqlInjection(req: Request, res: Response, next: NextFunction) {
  const checkForSqlInjection = (value: string): boolean => {
    const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)|(-{2}|\/\*|\*\/|;)/i;
    return sqlPattern.test(value);
  };

  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkForSqlInjection(obj);
    }

    if (Array.isArray(obj)) {
      return obj.some(checkObject);
    }

    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkObject);
    }

    return false;
  };

  // Check request body
  if (req.body && checkObject(req.body)) {
    logger.warn('Potential SQL injection attempt detected', {
      path: req.path,
      ip: req.ip,
      body: req.body,
    });

    return res.status(400).json({
      error: 'Invalid input detected',
    });
  }

  // Check query params
  if (req.query && checkObject(req.query)) {
    logger.warn('Potential SQL injection attempt detected in query', {
      path: req.path,
      ip: req.ip,
      query: req.query,
    });

    return res.status(400).json({
      error: 'Invalid query parameters',
    });
  }

  next();
}

/**
 * NoSQL injection prevention
 */
export function preventNoSqlInjection(req: Request, res: Response, next: NextFunction) {
  const checkForNoSqlInjection = (obj: any): boolean => {
    if (obj && typeof obj === 'object') {
      // Check for MongoDB operators
      const keys = Object.keys(obj);
      if (keys.some((key) => key.startsWith('$'))) {
        return true;
      }

      // Recursively check nested objects
      return Object.values(obj).some(checkForNoSqlInjection);
    }

    return false;
  };

  if (req.body && checkForNoSqlInjection(req.body)) {
    logger.warn('Potential NoSQL injection attempt detected', {
      path: req.path,
      ip: req.ip,
    });

    return res.status(400).json({
      error: 'Invalid input detected',
    });
  }

  next();
}

/**
 * CSRF protection middleware (for state-changing operations)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Check CSRF token
  const token = req.headers['x-csrf-token'] || req.body._csrf;

  if (!token) {
    logger.warn('CSRF token missing', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    return res.status(403).json({
      error: 'CSRF token missing',
    });
  }

  // TODO: Validate token against session
  // For now, just check that it exists

  next();
}

/**
 * Prevent clickjacking
 */
export function preventClickjacking(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
}

/**
 * Prevent MIME sniffing
 */
export function preventMimeSniffing(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}

/**
 * XSS Protection header
 */
export function xssProtection(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}

/**
 * Referrer Policy
 */
export function referrerPolicy(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

/**
 * Permissions Policy (formerly Feature Policy)
 */
export function permissionsPolicy(req: Request, res: Response, next: NextFunction) {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  next();
}

/**
 * Prevent parameter pollution
 */
export function preventParameterPollution(req: Request, res: Response, next: NextFunction) {
  // Check for duplicate query parameters
  const queryString = req.url.split('?')[1];
  if (queryString) {
    const params = queryString.split('&');
    const seen = new Set<string>();

    for (const param of params) {
      const key = param.split('=')[0];
      if (seen.has(key)) {
        logger.warn('Parameter pollution detected', {
          path: req.path,
          param: key,
          ip: req.ip,
        });

        return res.status(400).json({
          error: 'Duplicate query parameters not allowed',
        });
      }
      seen.add(key);
    }
  }

  next();
}

/**
 * IP whitelist middleware (for admin routes)
 */
export function ipWhitelist(allowedIPs: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.socket.remoteAddress || '';

    if (!allowedIPs.includes(clientIP)) {
      logger.warn('Unauthorized IP access attempt', {
        path: req.path,
        ip: clientIP,
      });

      return res.status(403).json({
        error: 'Access denied',
      });
    }

    next();
  };
}

/**
 * Secure headers bundle
 */
export function secureHeaders(req: Request, res: Response, next: NextFunction) {
  preventClickjacking(req, res, () => {});
  preventMimeSniffing(req, res, () => {});
  xssProtection(req, res, () => {});
  referrerPolicy(req, res, () => {});
  permissionsPolicy(req, res, () => {});
  next();
}

/**
 * Request validation middleware
 */
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  // Check Content-Type for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Content-Type must be application/json',
      });
    }
  }

  next();
}

/**
 * Audit logging middleware
 */
export function auditLog(req: Request, res: Response, next: NextFunction) {
  // Log sensitive operations
  const sensitiveRoutes = ['/admin', '/api/keys', '/api/stripe'];

  if (sensitiveRoutes.some((route) => req.path.startsWith(route))) {
    logger.info('Audit log', {
      timestamp: new Date().toISOString(),
      user: (req as any).user?.id || 'anonymous',
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  next();
}

/**
 * Password strength validator
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Secrets detection in logs
 */
export function sanitizeLogs(obj: any): any {
  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
    'jwt',
  ];

  if (typeof obj === 'string') {
    // Redact potential secrets
    return obj.replace(/\b[A-Za-z0-9]{32,}\b/g, '[REDACTED]');
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeLogs);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogs(value);
      }
    }
    return sanitized;
  }

  return obj;
}
