# 🚀 Vocabotics

The AI-Driven Development Orchestration Platform

**Status**: 🏗️ In Development (Sprint 0 - Foundation)

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Git

### 1. Clone and Install

```bash
git clone <repository-url>
cd anthropic
cp .env.example .env
# Edit .env with your API keys
pnpm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, Qdrant
docker-compose up -d

# Wait for services to be healthy
docker-compose ps
```

### 3. Initialize Database

```bash
# Push Prisma schema to database
pnpm db:push

# (Optional) Open Prisma Studio to view database
pnpm db:studio
```

### 4. Start Development

```bash
# Start all apps in development mode
pnpm dev
```

Services will be available at:
- **API**: http://localhost:3001
- **Web App**: http://localhost:3000
- **Admin Portal**: http://localhost:3002
- **Database UI**: http://localhost:8080 (Adminer)

---

## Project Structure

```
vocabotics/
├── apps/
│   ├── api/          # Backend API (Fastify + TypeScript)
│   ├── web/          # Main web application (Next.js 14)
│   └── admin/        # Admin portal (Next.js 14)
├── packages/
│   ├── ai-client/    # OpenRouter integration + BYOK
│   ├── database/     # Prisma schema + utilities
│   ├── ui/           # Shared UI components
│   └── config/       # Shared TypeScript configs
├── docs/
│   ├── PRD.md                  # Product Requirements
│   ├── ARCHITECTURE.md         # Technical Architecture
│   ├── FRONTEND_DESIGN.md      # UI/UX Designs
│   ├── SPRINT_PLAN.md          # Implementation Roadmap
│   ├── schema.sql              # Database Schema
│   └── api-spec.yaml           # API Specification
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in specific app
cd apps/api && pnpm test
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Format all code
pnpm format
```

### Database Management

```bash
# Push schema changes
pnpm db:push

# Generate Prisma client
cd apps/api && pnpm prisma generate

# Create migration
cd apps/api && pnpm prisma migrate dev

# Reset database (⚠️  destructive)
cd apps/api && pnpm prisma migrate reset
```

---

## Environment Variables

See `.env.example` for all required environment variables.

### Required for Development

```bash
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
OPENROUTER_API_KEY="your-key"
JWT_SECRET="your-secret"
ENCRYPTION_KEY="your-encryption-key"
```

### Generating Encryption Key

```bash
# Generate a secure 32-byte hex key for BYOK encryption
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Architecture Highlights

### Orchestration-First Design

Vocabotics replaces thousands of iterative AI calls with comprehensive, orchestrated generation:

- **1 call** → Complete PRD
- **1 call** → Full system architecture
- **1 call** → Database schema
- **1 call** → Complete frontend with tags
- **8 calls** → Entire auth system (vs 200+ iterative)

### Key Technologies

- **AI**: OpenRouter (Claude Sonnet 4.5, Haiku, Vision)
- **Backend**: Fastify + TypeScript + Prisma
- **Frontend**: Next.js 14 + Zustand + Tailwind
- **Database**: PostgreSQL 16 + Redis + Qdrant
- **Payments**: Stripe
- **Testing**: Puppeteer + Claude Vision

### Unique Features

1. **Complete FE → BE → DB Traceability** - Integration Map
2. **AI Vision Testing** - Puppeteer + Claude Vision
3. **ISO Compliance Built-in** - ISO 9001 & 12207
4. **BYOK Support** - Bring Your Own Key
5. **Dopamine-Engineered UX** - Flow state by design

---

## Documentation

- [📋 Product Requirements (PRD.md)](./PRD.md)
- [🏗️ Technical Architecture (ARCHITECTURE.md)](./ARCHITECTURE.md)
- [🎨 Frontend Design (FRONTEND_DESIGN.md)](./FRONTEND_DESIGN.md)
- [🎯 Sprint Plan (SPRINT_PLAN.md)](./SPRINT_PLAN.md)
- [🗄️ Database Schema (schema.sql)](./schema.sql)
- [🔌 API Specification (api-spec.yaml)](./api-spec.yaml)

---

## Current Sprint

**Sprint 0: Foundation** (Weeks 1-2)

- [x] Monorepo structure
- [x] Docker Compose setup
- [x] Environment configuration
- [ ] Database initialization
- [ ] Backend API setup
- [ ] Authentication system
- [ ] OpenRouter integration
- [ ] BYOK key manager
- [ ] Frontend setup

---

## Contributing

This is a revolutionary platform. Every contribution matters.

### Development Process

1. Create feature branch from `main`
2. Make changes following KISS principles
3. Write tests (>95% coverage target)
4. Submit PR with clear description
5. Ensure CI passes

### Code Style

- **TypeScript** everywhere
- **Functional** over imperative
- **Simple** over clever
- **Tested** over trusted

---

## Support

- 📧 Email: dev@vocabotics.com
- 📚 Docs: https://docs.vocabotics.com
- 💬 Discord: https://discord.gg/vocabotics

---

## License

Proprietary - © 2025 Vocabotics

---

**The revolution is being built. Join us.** 🚀

*"If we can orchestrate software (the most complex creation), we can orchestrate anything."*
