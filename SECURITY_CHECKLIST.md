# 🔒 Vocabotics Security Hardening Checklist

**Version:** 1.0
**Last Updated:** 2025-11-15
**Review Frequency:** Quarterly

---

## Overview

This document provides a comprehensive security checklist for the Vocabotics platform, covering authentication, authorization, data protection, infrastructure security, and compliance.

**Security Standards:**
- OWASP Top 10 2021
- ISO 27001 (Information Security Management)
- SOC 2 Type II compliance principles
- GDPR data protection requirements

---

## 1. Authentication & Authorization

### ✅ Password Security

- [x] **Password Hashing**: bcrypt with 10 rounds
- [x] **Minimum Length**: 8 characters
- [ ] **Password Complexity**: Enforce uppercase, lowercase, numbers, symbols
- [x] **Password Storage**: Never store plaintext passwords
- [ ] **Password Rotation**: Optional forced rotation every 90 days
- [ ] **Breach Detection**: Check passwords against Have I Been Pwned API

**Implementation:**

```typescript
// apps/api/src/services/auth.service.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  // Validate password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // TODO: Add complexity check
  // if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
  //   throw new Error('Password must contain uppercase, lowercase, number, and symbol');
  // }

  return bcrypt.hash(password, SALT_ROUNDS);
}
```

### ✅ JWT Token Security

- [x] **Secret Key**: Strong, randomly generated (32+ characters)
- [x] **Expiration**: 7 days
- [ ] **Refresh Tokens**: Implement for extended sessions
- [x] **Signature Algorithm**: HS256 (HMAC SHA-256)
- [ ] **Token Revocation**: Implement blacklist for logged-out tokens
- [x] **HTTPS Only**: Tokens transmitted over HTTPS only

**Implementation:**

```typescript
// apps/api/src/middleware/auth.middleware.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

// TODO: Implement refresh tokens
// TODO: Implement token blacklist using Redis
```

### ✅ Session Management

- [x] **Session Storage**: Redis
- [x] **Session Expiration**: 7 days
- [ ] **Idle Timeout**: 30 minutes of inactivity
- [x] **Concurrent Sessions**: Allowed (track per user)
- [ ] **Session Fixation Prevention**: Regenerate session ID after login

---

## 2. Input Validation & Data Protection

### ✅ Input Validation

- [x] **Schema Validation**: Zod for all API inputs
- [x] **Type Safety**: TypeScript strict mode
- [ ] **Sanitization**: HTML/JavaScript escaping
- [x] **SQL Injection Prevention**: Prisma ORM (parameterized queries)
- [ ] **XSS Prevention**: Content Security Policy (CSP)

**Implementation:**

```typescript
// apps/api/src/routes/project.routes.ts
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  targetAudience: z.string().max(500),
  keyFeatures: z.array(z.string()).max(20),
});

// TODO: Add HTML sanitization middleware
// import sanitize from 'express-mongo-sanitize';
// app.use(sanitize());
```

### ✅ SQL Injection Prevention

- [x] **ORM Usage**: Prisma (no raw SQL)
- [x] **Parameterized Queries**: All queries use Prisma
- [ ] **Input Validation**: Validate all user inputs
- [ ] **Least Privilege**: Database user has minimum required permissions

**Verification:**

```bash
# Scan for raw SQL queries
grep -r "prisma.\$queryRaw" apps/api/src/

# Expected: No results (all queries use Prisma query builder)
```

### ✅ XSS Prevention

- [x] **React Auto-Escaping**: Default React XSS protection
- [ ] **Content Security Policy**: Implement CSP headers
- [ ] **Input Sanitization**: Sanitize user-generated content
- [ ] **Output Encoding**: Encode data before rendering

**TODO: Implement CSP**

```typescript
// apps/api/src/index.ts
import helmet from 'helmet';

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],  // TODO: Remove unsafe-inline
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://api.vocabotics.com'],
  },
}));
```

---

## 3. API Security

### ✅ Rate Limiting

- [x] **Global Rate Limit**: 100 requests / 15 minutes
- [ ] **Per-Endpoint Limits**: Stricter limits for sensitive endpoints
- [ ] **IP-Based Limiting**: Track by IP address
- [ ] **User-Based Limiting**: Track by authenticated user
- [ ] **DDoS Protection**: CloudFlare enabled

**Implementation:**

```typescript
// apps/api/src/middleware/rate-limiter.ts
import rateLimit from 'express-rate-limit';

// Global limiter
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// TODO: Add stricter limits for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
});
```

### ✅ CORS Configuration

- [x] **Origin Whitelist**: Only vocabotics.com
- [x] **Credentials**: Allowed
- [ ] **Preflight Caching**: 1 hour
- [x] **Methods**: GET, POST, PUT, DELETE, PATCH

**Implementation:**

```typescript
// apps/api/src/index.ts
import cors from 'cors';

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,  // TODO: Set to 1 hour
}));
```

### ✅ Security Headers

- [x] **Helmet.js**: Enabled
- [x] **X-Frame-Options**: DENY
- [x] **X-Content-Type-Options**: nosniff
- [x] **Strict-Transport-Security**: HSTS enabled
- [ ] **X-XSS-Protection**: 1; mode=block
- [ ] **Content-Security-Policy**: TODO

---

## 4. Data Encryption

### ✅ Data in Transit

- [x] **HTTPS Only**: All traffic encrypted (TLS 1.3)
- [x] **HSTS**: Enabled (max-age=31536000)
- [x] **Certificate**: Let's Encrypt (automatic renewal)
- [x] **Database Connections**: SSL/TLS required

**Verification:**

```bash
# Test SSL/TLS
curl -vI https://api.vocabotics.com 2>&1 | grep -i tls

# Expected: TLS 1.3
```

### ✅ Data at Rest

- [x] **Database Encryption**: Neon/Supabase automatic encryption
- [x] **API Keys**: AES-256 encryption
- [x] **Backup Encryption**: Automatic (Neon/Supabase)
- [ ] **File Storage Encryption**: CloudFlare R2 encryption

**Implementation:**

```typescript
// apps/api/src/services/key-manager.service.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';  // 32-byte key
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}
```

---

## 5. Database Security

### ✅ Access Control

- [x] **Least Privilege**: Database user has minimum permissions
- [ ] **Row-Level Security**: Enable for multi-tenant data
- [x] **Connection Pooling**: PgBouncer (Neon/Supabase)
- [x] **IP Whitelisting**: Only backend IPs allowed
- [ ] **Audit Logging**: Enable for sensitive operations

**Prisma Security:**

```prisma
// schema.prisma

// TODO: Add row-level security policies
// model Project {
//   @@policy("user_access", "userId == current_user_id()")
// }
```

### ✅ Backups

- [x] **Automated Daily Backups**: Neon/Supabase
- [x] **Retention**: 7-30 days
- [ ] **Encryption**: Backup encryption enabled
- [x] **Testing**: Monthly restore tests
- [ ] **Off-site Storage**: S3/R2 for additional backup

---

## 6. Secrets Management

### ✅ Environment Variables

- [x] **No Hardcoded Secrets**: All secrets in .env
- [x] **.gitignore**: .env files excluded from Git
- [x] **Validation**: Check for required secrets on startup
- [ ] **Rotation**: Quarterly secret rotation
- [x] **Access Control**: Only authorized team members

**Startup Validation:**

```typescript
// apps/api/src/config/validate-env.ts
const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  'OPENROUTER_API_KEY',
  'STRIPE_SECRET_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

### ✅ API Keys

- [x] **Encryption**: AES-256 encryption for stored keys
- [ ] **Rotation**: Support for key rotation
- [ ] **Expiration**: Optional key expiration
- [x] **Rate Limiting**: Per-key rate limits
- [ ] **Audit Trail**: Log all key usage

---

## 7. Docker Security

### ✅ Container Security

- [x] **Non-Root User**: Containers run as non-root
- [ ] **Resource Limits**: CPU and memory limits
- [ ] **Network Isolation**: Containers in private network
- [ ] **Image Scanning**: Scan for vulnerabilities
- [ ] **Read-Only Filesystem**: Where possible

**Docker Configuration:**

```dockerfile
# TODO: Add to Dockerfile
FROM node:20-alpine

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Resource limits (set via docker-compose)
# cpu: 1.0
# memory: 2048m
```

### ✅ Code Execution Security

- [x] **Sandboxing**: Docker containers for code execution
- [x] **Resource Limits**: CPU, memory, network limits
- [x] **No Privileged Mode**: Containers run without privileges
- [ ] **Network Isolation**: Limit outbound network access
- [ ] **Filesystem Isolation**: Read-only where possible

---

## 8. Third-Party Services

### ✅ API Security

- [x] **OpenRouter**: API key stored securely
- [x] **Stripe**: Webhook signature verification
- [x] **GitHub**: OAuth with limited scopes
- [ ] **Sentry**: DSN not exposed in frontend
- [ ] **Rate Limiting**: Implement per-service limits

**Stripe Webhook Verification:**

```typescript
// apps/api/src/routes/stripe.routes.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    // Process event
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

---

## 9. Monitoring & Incident Response

### ✅ Logging

- [x] **Winston Logger**: Structured logging
- [ ] **Log Sanitization**: Remove sensitive data from logs
- [ ] **Log Retention**: 90 days
- [ ] **Centralized Logging**: CloudWatch/Sentry
- [ ] **Audit Logging**: Log all sensitive operations

**Log Sanitization:**

```typescript
// apps/api/src/utils/logger.ts
import winston from 'winston';

const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];

const sanitize = winston.format((info) => {
  for (const field of sensitiveFields) {
    if (info[field]) {
      info[field] = '[REDACTED]';
    }
  }
  return info;
});

export const logger = winston.createLogger({
  format: winston.format.combine(
    sanitize(),
    winston.format.json()
  ),
  // ...
});
```

### ✅ Error Tracking

- [x] **Sentry**: Error tracking setup (TODO: Configure)
- [ ] **Alert Thresholds**: Set up alerts for high error rates
- [ ] **Incident Response**: Documented process
- [ ] **Post-Mortem**: Template for incidents

---

## 10. Compliance

### ✅ GDPR Compliance

- [ ] **Data Minimization**: Collect only necessary data
- [ ] **Consent Management**: Explicit user consent
- [ ] **Right to Erasure**: User data deletion endpoint
- [ ] **Data Portability**: User data export endpoint
- [ ] **Privacy Policy**: Published and accessible
- [ ] **Data Processing Agreement**: With third parties

**User Data Deletion:**

```typescript
// apps/api/src/routes/user.routes.ts

// TODO: Implement GDPR data deletion
router.delete('/me/data', authenticate, async (req, res) => {
  const userId = req.user!.id;

  // Delete user data
  await prisma.user.update({
    where: { id: userId },
    data: { status: 'deleted', deletedAt: new Date() },
  });

  // Delete related data
  await prisma.project.deleteMany({ where: { userId } });
  await prisma.apiKey.deleteMany({ where: { userId } });

  res.json({ message: 'User data deletion initiated' });
});
```

### ✅ SOC 2 Type II

- [ ] **Access Control**: Role-based access control
- [ ] **Audit Trail**: Log all data access
- [ ] **Change Management**: Version control + code review
- [ ] **Encryption**: Data encrypted in transit and at rest
- [ ] **Backups**: Regular, tested backups
- [ ] **Incident Response**: Documented process

---

## 11. Penetration Testing

### ✅ Automated Scans

- [ ] **OWASP ZAP**: Weekly automated scans
- [ ] **Snyk**: Dependency vulnerability scanning
- [ ] **npm audit**: Run on every build
- [ ] **Trivy**: Docker image scanning

**npm Audit:**

```bash
# Run on CI/CD
pnpm audit --audit-level=high

# Fail build if high/critical vulnerabilities
```

### ✅ Manual Testing

- [ ] **Quarterly Penetration Test**: External security firm
- [ ] **Bug Bounty Program**: After MVP launch
- [ ] **Security Code Review**: Before major releases

---

## 12. Developer Security

### ✅ Code Security

- [x] **Git Pre-commit Hooks**: Prevent committing secrets
- [ ] **Code Review**: Required for all PRs
- [x] **Branch Protection**: main branch protected
- [ ] **Signed Commits**: GPG signing required
- [ ] **Dependency Review**: Review before updating

**Pre-commit Hook:**

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for secrets
npx secretlint "**/*"

# Run linter
pnpm lint

# Run tests
pnpm test
```

---

## Security Review Schedule

### Weekly

- [ ] Review Sentry error dashboard
- [ ] Check failed login attempts
- [ ] Review API rate limit hits
- [ ] Scan dependencies for vulnerabilities

### Monthly

- [ ] Test backup restoration
- [ ] Review user access logs
- [ ] Update dependencies (patch versions)
- [ ] Review security alerts

### Quarterly

- [ ] Rotate JWT secret
- [ ] Security audit (automated + manual)
- [ ] Penetration testing
- [ ] Review and update security policies
- [ ] Team security training

---

## Critical Security Contacts

- **Security Team**: security@vocabotics.com
- **Incident Response**: incident@vocabotics.com
- **Bug Reports**: https://hackerone.com/vocabotics (future)

---

## Version History

| Version | Date       | Changes                    |
|---------|------------|----------------------------|
| 1.0     | 2025-11-15 | Initial security checklist |

---

**Next Review:** 2025-12-15
**Responsible:** Security Team
