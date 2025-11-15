# 🚀 Vocabotics Deployment Guide

**Version:** 1.0
**Last Updated:** 2025-11-15
**Target:** Production Deployment

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Domain & SSL Configuration](#domain--ssl-configuration)
8. [CDN Setup](#cdn-setup)
9. [Monitoring & Logging](#monitoring--logging)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Backup & Recovery](#backup--recovery)
12. [Scaling Strategy](#scaling-strategy)
13. [Security Hardening](#security-hardening)
14. [Troubleshooting](#troubleshooting)

---

## Overview

Vocabotics uses a modern, cloud-native architecture optimized for scalability, reliability, and cost-efficiency.

### Architecture Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       ├─> CloudFlare CDN
       │   └─> Caching, DDoS Protection
       │
       ├─> Vercel (Frontend)
       │   └─> React + Vite (Static)
       │
       └─> Railway/Fly.io (Backend)
           ├─> Express API
           ├─> WebSocket Server
           ├─> BullMQ Workers
           └─> Docker Execution Service

┌──────────────────────────────────────┐
│         External Services            │
├──────────────────────────────────────┤
│ • Neon/Supabase (PostgreSQL)        │
│ • Upstash Redis                      │
│ • Qdrant Cloud (Vector DB)           │
│ • CloudFlare R2 (Storage)            │
│ • OpenRouter (AI)                    │
│ • Stripe (Payments)                  │
│ • Sentry (Error Tracking)            │
│ • Prometheus + Grafana (Metrics)     │
└──────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18 + Vite 5 + TypeScript
- **Backend**: Express 4 + TypeScript + Node 20
- **Database**: PostgreSQL 16 (Neon/Supabase)
- **Cache**: Redis 7 (Upstash)
- **Vector DB**: Qdrant Cloud
- **Storage**: CloudFlare R2
- **AI**: OpenRouter (Claude, GPT, etc.)
- **Payments**: Stripe
- **Hosting**: Vercel (Frontend) + Railway/Fly.io (Backend)

---

## Prerequisites

### Required Accounts

1. **GitHub** - Source code repository
2. **Vercel** - Frontend hosting
3. **Railway/Fly.io** - Backend hosting
4. **Neon/Supabase** - PostgreSQL database
5. **Upstash** - Redis cache
6. **Qdrant Cloud** - Vector database
7. **CloudFlare** - CDN + R2 storage
8. **Stripe** - Payment processing
9. **OpenRouter** - AI API access
10. **Sentry** (optional) - Error tracking
11. **GitHub Actions** - CI/CD

### Required Tools

```bash
# Node.js 20+
node -v  # v20.x.x

# pnpm (package manager)
pnpm -v  # 8.x.x

# Git
git --version

# Docker (for local development)
docker --version

# PostgreSQL client (for migrations)
psql --version
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/vocabotics.git
cd vocabotics
pnpm install
```

### 2. Environment Variables

Create production environment files:

#### Backend (`.env.production`)

```bash
# === NODE ENVIRONMENT ===
NODE_ENV=production
API_PORT=3001

# === DATABASE ===
# Neon/Supabase PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host.neon.tech/vocabotics?sslmode=require"

# === REDIS ===
# Upstash Redis connection
REDIS_URL="rediss://:password@redis.upstash.io:6379"

# === VECTOR DATABASE ===
# Qdrant Cloud
QDRANT_URL="https://your-cluster.qdrant.io"
QDRANT_API_KEY="your-qdrant-api-key"

# === AI SERVICES ===
# OpenRouter
OPENROUTER_API_KEY="sk-or-v1-..."

# Anthropic (optional, for direct access)
ANTHROPIC_API_KEY="sk-ant-..."

# === AUTHENTICATION ===
# JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# === STRIPE ===
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# === GITHUB ===
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"
GITHUB_REDIRECT_URI="https://api.vocabotics.com/api/github/callback"

# === STORAGE ===
# CloudFlare R2
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="vocabotics-storage"
R2_ACCOUNT_ID="your-cloudflare-account-id"

# === DOCKER ===
# Docker daemon connection (for code execution)
DOCKER_HOST="unix:///var/run/docker.sock"
DOCKER_CERT_PATH=""
DOCKER_TLS_VERIFY=""

# === CORS ===
CORS_ORIGIN="https://vocabotics.com,https://www.vocabotics.com"

# === MONITORING ===
# Sentry (optional)
SENTRY_DSN="https://...@sentry.io/..."

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (`.env.production`)

```bash
# === API ENDPOINTS ===
VITE_API_URL=https://api.vocabotics.com
VITE_WS_URL=wss://api.vocabotics.com

# === STRIPE ===
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# === ENVIRONMENT ===
VITE_APP_ENV=production
```

### 3. Secrets Management

**CRITICAL**: Never commit `.env` files to Git!

#### Railway/Fly.io Secrets

```bash
# Railway
railway variables set JWT_SECRET="..."
railway variables set DATABASE_URL="..."

# Fly.io
fly secrets set JWT_SECRET="..."
fly secrets set DATABASE_URL="..."
```

#### Vercel Secrets

```bash
vercel env add VITE_API_URL production
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
```

---

## Database Setup

### 1. Create Production Database

#### Using Neon

```bash
# Create project on neon.tech
# Copy connection string

# Example connection string:
# postgresql://user:pass@ep-cool-darkness-123456.us-east-2.aws.neon.tech/vocabotics?sslmode=require
```

#### Using Supabase

```bash
# Create project on supabase.com
# Navigate to Settings > Database
# Copy connection string (direct connection)
```

### 2. Run Migrations

```bash
# From apps/api directory
cd apps/api

# Set DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run Prisma migrations
pnpm prisma migrate deploy

# Verify schema
pnpm prisma db pull
```

### 3. Seed Production Data

```bash
# Create initial admin user
pnpm prisma db seed

# Or manually via SQL:
psql $DATABASE_URL -c "
INSERT INTO users (id, email, name, password_hash, role, status) VALUES
('uuid-v4-here', 'admin@vocabotics.com', 'Admin', '\$2b\$10\$hashed...', 'admin', 'active');
"
```

### 4. Configure Backups

#### Neon Backups (Automatic)

- Point-in-time recovery (7-30 days retention)
- Automatic daily snapshots
- No configuration needed

#### Supabase Backups

- Daily backups enabled by default
- Can trigger manual backup via UI

#### Manual Backup Script

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="vocabotics-backup-$DATE.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to S3/R2
aws s3 cp $BACKUP_FILE.gz s3://vocabotics-backups/

echo "Backup complete: $BACKUP_FILE.gz"
```

---

## Backend Deployment

### Option 1: Railway

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

#### 2. Create New Project

```bash
railway init
railway link
```

#### 3. Configure Build

Create `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/api && pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "cd apps/api && pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 4. Deploy

```bash
# Set environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="postgresql://..."
# ... (set all environment variables)

# Deploy
railway up

# Check logs
railway logs
```

#### 5. Configure Domain

```bash
# Get Railway domain
railway domain

# Add custom domain
railway domain add api.vocabotics.com
```

### Option 2: Fly.io

#### 1. Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

#### 2. Initialize Fly App

```bash
fly launch --name vocabotics-api
```

#### 3. Configure `fly.toml`

```toml
app = "vocabotics-api"
primary_region = "ewr"  # Newark

[build]
  builder = "paketobuildpacks/builder:base"
  buildpacks = ["gcr.io/paketo-buildpacks/nodejs"]

[env]
  NODE_ENV = "production"
  API_PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "5s"

[[services.http_checks]]
  interval = "10s"
  timeout = "2s"
  grace_period = "5s"
  method = "GET"
  path = "/health"
```

#### 4. Deploy

```bash
# Set secrets
fly secrets set JWT_SECRET="..."
fly secrets set DATABASE_URL="..."

# Deploy
fly deploy

# Check status
fly status
fly logs
```

---

## Frontend Deployment

### Vercel Deployment

#### 1. Install Vercel CLI

```bash
pnpm add -g vercel
vercel login
```

#### 2. Configure `vercel.json`

```json
{
  "version": 2,
  "buildCommand": "cd apps/web && pnpm build",
  "outputDirectory": "apps/web/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

#### 3. Deploy

```bash
# Production deployment
vercel --prod

# Set environment variables
vercel env add VITE_API_URL
# Enter: https://api.vocabotics.com

vercel env add VITE_WS_URL
# Enter: wss://api.vocabotics.com

vercel env add VITE_STRIPE_PUBLISHABLE_KEY
# Enter: pk_live_...
```

#### 4. Configure Domain

```bash
# Add custom domain
vercel domains add vocabotics.com
vercel domains add www.vocabotics.com

# Configure DNS (see next section)
```

---

## Domain & SSL Configuration

### 1. DNS Configuration

Point your domain to Vercel and Railway/Fly.io:

#### CloudFlare DNS Records

```
A     @             76.76.21.21              (Vercel)
CNAME www           cname.vercel-dns.com     (Vercel)
CNAME api           vocabotics-api.fly.dev   (Fly.io)
```

#### Alternative: Direct CNAME

```
CNAME @             vocabotics.vercel.app
CNAME www           vocabotics.vercel.app
CNAME api           vocabotics-api.fly.dev
```

### 2. SSL Certificates

#### Vercel (Automatic)

- SSL certificates automatically provisioned via Let's Encrypt
- Automatic renewal
- No configuration needed

#### Fly.io (Automatic)

```bash
# Add certificate
fly certs create api.vocabotics.com

# Check status
fly certs show api.vocabotics.com
```

#### Railway (Automatic)

- SSL automatically provisioned for custom domains
- No configuration needed

### 3. CloudFlare Configuration

#### Enable Full SSL/TLS

1. Go to CloudFlare Dashboard > SSL/TLS
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

#### Enable HSTS

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## CDN Setup

### CloudFlare CDN

#### 1. Enable Caching

```
# Caching Rules
- Cache Level: Standard
- Browser Cache TTL: 4 hours
- Edge Cache TTL: 2 hours
```

#### 2. Page Rules

```
# Static Assets
https://vocabotics.com/assets/*
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year
- Browser Cache TTL: 1 year

# API (No Cache)
https://api.vocabotics.com/*
- Cache Level: Bypass
```

#### 3. Performance Optimizations

- **Auto Minify**: HTML, CSS, JavaScript
- **Brotli Compression**: Enabled
- **HTTP/2**: Enabled
- **HTTP/3 (QUIC)**: Enabled
- **Early Hints**: Enabled

### CloudFlare R2 (Object Storage)

#### 1. Create Bucket

```bash
# Install Wrangler CLI
pnpm add -g wrangler

# Login
wrangler login

# Create bucket
wrangler r2 bucket create vocabotics-storage

# Set CORS
wrangler r2 bucket cors update vocabotics-storage --cors-config cors.json
```

#### `cors.json`

```json
[
  {
    "AllowedOrigins": ["https://vocabotics.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Monitoring & Logging

### 1. Sentry (Error Tracking)

#### Backend Setup

```typescript
// apps/api/src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

#### Frontend Setup

```typescript
// apps/web/src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### 2. Prometheus + Grafana

#### Install Prometheus Client

```bash
cd apps/api
pnpm add prom-client
```

#### Expose Metrics Endpoint

```typescript
// apps/api/src/routes/metrics.ts
import { Request, Response } from 'express';
import { register } from 'prom-client';

export async function metricsHandler(req: Request, res: Response) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
```

#### Grafana Dashboard

- Import dashboard ID: `14282` (Node.js Application Dashboard)
- Configure Prometheus datasource
- Set up alerts for high error rates, slow responses

### 3. Log Aggregation

#### Railway/Fly.io Logs

```bash
# Railway
railway logs --tail

# Fly.io
fly logs
```

#### CloudWatch (optional)

```typescript
// Winston CloudWatch transport
import WinstonCloudWatch from 'winston-cloudwatch';

logger.add(new WinstonCloudWatch({
  logGroupName: 'vocabotics-api',
  logStreamName: process.env.NODE_ENV,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: 'us-east-1',
}));
```

---

## CI/CD Pipeline

### GitHub Actions

#### `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Run linter
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./apps/web
```

---

## Backup & Recovery

### Database Backups

#### Automated Daily Backups

```bash
# Cron job (daily at 2 AM UTC)
0 2 * * * /usr/local/bin/backup-db.sh

# backup-db.sh
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump $DATABASE_URL | gzip > /backups/vocabotics-$DATE.sql.gz
aws s3 cp /backups/vocabotics-$DATE.sql.gz s3://vocabotics-backups/
find /backups -name "*.sql.gz" -mtime +30 -delete  # Keep 30 days
```

### Recovery Procedure

```bash
# Download backup
aws s3 cp s3://vocabotics-backups/vocabotics-20250115.sql.gz .

# Restore
gunzip vocabotics-20250115.sql.gz
psql $DATABASE_URL < vocabotics-20250115.sql

# Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

---

## Scaling Strategy

### Horizontal Scaling

#### Railway

```bash
# Scale instances
railway scale --replicas 3
```

#### Fly.io

```toml
# fly.toml
[scaling]
  min_machines = 2
  max_machines = 10
```

### Vertical Scaling

```bash
# Fly.io - Increase resources
fly scale vm shared-cpu-2x --memory 2048

# Railway - Upgrade plan
# Via Railway dashboard
```

### Database Scaling

- **Read Replicas**: Add Neon read replicas for query distribution
- **Connection Pooling**: Use PgBouncer (included in Neon/Supabase)
- **Caching**: Redis for frequently accessed data

### Redis Scaling

- Upstash Redis automatically scales
- Consider Redis Cluster for > 1M requests/day

---

## Security Hardening

### 1. Environment Security

- ✅ All secrets in environment variables (never in code)
- ✅ Use secret management (Railway/Fly.io secrets)
- ✅ Rotate JWT secrets quarterly
- ✅ Use strong passwords (32+ characters)

### 2. Network Security

- ✅ HTTPS only (redirect HTTP to HTTPS)
- ✅ HSTS enabled
- ✅ CloudFlare DDoS protection
- ✅ Rate limiting (100 requests / 15 min)
- ✅ CORS restricted to vocabotics.com

### 3. Database Security

- ✅ SSL/TLS connections required
- ✅ Strong passwords (generated, not manual)
- ✅ Row-Level Security (RLS) enabled
- ✅ No public access (only from backend IPs)

### 4. Application Security

- ✅ Helmet.js for security headers
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS prevention (React auto-escaping + CSP)
- ✅ CSRF protection
- ✅ Password hashing (bcrypt, 10 rounds)

### 5. Dependency Security

```bash
# Audit dependencies
pnpm audit

# Fix vulnerabilities
pnpm audit --fix

# Update dependencies
pnpm update

# Use Snyk for continuous monitoring
snyk test
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```
Error: P1001: Can't reach database server
```

**Solution:**
```bash
# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check SSL mode (Neon requires sslmode=require)
```

#### 2. Redis Connection Errors

```
Error: Redis connection timeout
```

**Solution:**
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping

# Check Upstash dashboard for status
```

#### 3. Deployment Failures

```
Error: Build failed
```

**Solution:**
```bash
# Check logs
railway logs
fly logs

# Verify build command
pnpm build

# Check Node version
node -v  # Should be 20.x
```

#### 4. CORS Errors

```
Access to fetch has been blocked by CORS policy
```

**Solution:**
```typescript
// Verify CORS configuration
app.use(cors({
  origin: ['https://vocabotics.com', 'https://www.vocabotics.com'],
  credentials: true,
}));
```

### Health Checks

```bash
# API health
curl https://api.vocabotics.com/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-11-15T12:00:00.000Z",
#   "uptime": 123456,
#   "database": "connected",
#   "redis": "connected"
# }

# Frontend health
curl https://vocabotics.com

# Expected: 200 OK
```

---

## Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] SSL certificates active
- [ ] Custom domains configured
- [ ] CDN caching working
- [ ] Monitoring dashboards setup
- [ ] Error tracking active (Sentry)
- [ ] Backups configured and tested
- [ ] CI/CD pipeline working
- [ ] Rate limiting tested
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor error rates in Sentry
- Check API response times
- Review failed jobs in BullMQ

**Weekly:**
- Review database performance
- Check disk space usage
- Update dependencies (patch versions)

**Monthly:**
- Security audit
- Performance optimization review
- Cost optimization review
- Backup restoration test

**Quarterly:**
- Rotate JWT secrets
- Update major dependencies
- Disaster recovery drill
- Capacity planning review

---

## Contact & Resources

- **Documentation**: https://docs.vocabotics.com
- **Status Page**: https://status.vocabotics.com
- **Support**: support@vocabotics.com
- **Security**: security@vocabotics.com

---

**Deployment Guide Version 1.0**
**Last Updated:** 2025-11-15
**Next Review:** 2025-12-15
