# Key Source File Locations

## Generator Services (Prompts & Logic)
- **PRD Generator**: `/home/user/anthropic/apps/api/src/services/generators/prd-generator.service.ts`
- **Architecture Generator**: `/home/user/anthropic/apps/api/src/services/generators/architecture-generator.service.ts`
- **Schema Generator**: `/home/user/anthropic/apps/api/src/services/generators/schema-generator.service.ts`
- **API Generator**: `/home/user/anthropic/apps/api/src/services/generators/api-generator.service.ts`
- **Code Generator**: `/home/user/anthropic/apps/api/src/services/generators/code-generator.service.ts`
- **Project Generator**: `/home/user/anthropic/apps/api/src/services/generators/project-generator.service.ts`

## Core Services
- **AI Service** (OpenRouter integration & prompt routing): `/home/user/anthropic/apps/api/src/services/ai.service.ts`
- **Workflow Service** (orchestration & state management): `/home/user/anthropic/apps/api/src/services/workflow.service.ts`
- **GitHub Service** (GitHub integration): `/home/user/anthropic/apps/api/src/services/github.service.ts`
- **Key Manager** (BYOK support): `/home/user/anthropic/apps/api/src/services/key-manager.service.ts`

## State Machine & Configuration
- **State Machine**: `/home/user/anthropic/apps/api/src/lib/state-machine.ts`
- **OpenRouter Client**: `/home/user/anthropic/apps/api/src/lib/openrouter.ts`
- **Prisma Client**: `/home/user/anthropic/apps/api/src/lib/prisma.ts`
- **Redis Client**: `/home/user/anthropic/apps/api/src/lib/redis.ts`

## Routes (API Endpoints)
- **Project Routes**: `/home/user/anthropic/apps/api/src/routes/project.routes.ts`
- **Workflow Routes**: `/home/user/anthropic/apps/api/src/routes/workflow.routes.ts`
- **Generation Routes**: (routes for PRD, architecture, code generation)
- **Quality Routes**: `/home/user/anthropic/apps/api/src/routes/quality.routes.ts`
- **Compliance Routes**: `/home/user/anthropic/apps/api/src/routes/compliance.routes.ts`
- **Traceability Routes**: `/home/user/anthropic/apps/api/src/routes/traceability.routes.ts`
- **Integration Map Routes**: `/home/user/anthropic/apps/api/src/routes/integration-map.routes.ts`

## Documentation
- **PRD**: `/home/user/anthropic/PRD.md` (comprehensive product vision)
- **Architecture**: `/home/user/anthropic/ARCHITECTURE.md` (technical design)
- **Database Schema**: `/home/user/anthropic/schema.sql` (PostgreSQL schema)
- **API Specification**: `/home/user/anthropic/api-spec.yaml` (OpenAPI/Swagger)
- **User Guide**: `/home/user/anthropic/USER_GUIDE.md`
- **Developer Documentation**: `/home/user/anthropic/DEVELOPER_DOCUMENTATION.md`
- **Deployment Guide**: `/home/user/anthropic/DEPLOYMENT_GUIDE.md`
- **Frontend Design**: `/home/user/anthropic/FRONTEND_DESIGN.md`

## Configuration Files
- **Docker Compose**: `/home/user/anthropic/docker-compose.yml`
- **Environment Example**: `/home/user/anthropic/.env.example`
- **Package.json**: `/home/user/anthropic/package.json` (monorepo root)
- **Turbo Config**: `/home/user/anthropic/turbo.json` (turborepo configuration)
- **Prisma Schema**: `/home/user/anthropic/apps/api/prisma/schema.prisma`

## Frontend (React/TypeScript)
- **Web App**: `/home/user/anthropic/apps/web/` (React + Vite application)
- **API Base**: `/home/user/anthropic/apps/api/src/index.ts` (Express server)

## Analysis Document
- **Codebase Analysis**: `/home/user/anthropic/CODEBASE_ANALYSIS.md` (the comprehensive analysis you just received)

