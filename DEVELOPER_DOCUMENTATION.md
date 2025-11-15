# 🔧 Vocabotics Developer Documentation

**Version:** 1.0
**Last Updated:** 2025-11-15
**Audience:** Developers, Contributors, Technical Team

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Codebase Structure](#codebase-structure)
4. [Development Setup](#development-setup)
5. [Backend Development](#backend-development)
6. [Frontend Development](#frontend-development)
7. [Database Management](#database-management)
8. [AI Integration](#ai-integration)
9. [Testing Strategy](#testing-strategy)
10. [Code Generation System](#code-generation-system)
11. [Quality & Compliance](#quality--compliance)
12. [API Reference](#api-reference)
13. [Contributing Guidelines](#contributing-guidelines)
14. [Debugging](#debugging)
15. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          Client Layer                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │   React    │  │  Zustand   │  │  React     │                 │
│  │ Components │  │   Store    │  │  Router    │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS/WSS
┌───────────────────────────┴──────────────────────────────────────┐
│                        API Gateway Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │  Express   │  │  Helmet    │  │    CORS    │                 │
│  │   Routes   │  │  Security  │  │  Middleware│                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────────────┐
│                       Service Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Workflow     │  │   PRD Gen    │  │  Code Gen    │           │
│  │ Orchestrator │  │   Service    │  │   Service    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Quality    │  │ Integration  │  │   Visual     │           │
│  │   Service    │  │  Map Service │  │Test Service  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────────────┐
│                     External Services                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  PostgreSQL  │  │    Redis     │  │   Qdrant     │           │
│  │   (Neon)     │  │  (Upstash)   │  │   Vector DB  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  OpenRouter  │  │    Stripe    │  │   GitHub     │           │
│  │    (AI)      │  │  (Billing)   │  │   (OAuth)    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Dogfooding**: Platform uses the same stack it generates (React + Express + PostgreSQL)
2. **Orchestration > Iteration**: Generate complete artifacts, not fragments
3. **Separation of Concerns**: Clear layers (API → Service → Data)
4. **Fail Fast**: Validate early, fail with clear errors
5. **Observable**: Comprehensive logging and monitoring

---

## Technology Stack

### Backend

```yaml
Runtime: Node.js 20+
Language: TypeScript 5.3+
Framework: Express 4.x
Database: PostgreSQL 16 (via Prisma ORM)
Cache: Redis 7 (ioredis client)
Vector DB: Qdrant
Validation: Zod
Authentication: JWT (jsonwebtoken)
Testing: Jest + Supertest
Queue: BullMQ
```

### Frontend

```yaml
Framework: React 18+
Build Tool: Vite 5.x
Language: TypeScript 5.3+
Router: React Router 6.x
State: Zustand
Styling: Tailwind CSS 3.x
Icons: Lucide React
Testing: Vitest + React Testing Library
```

### Infrastructure

```yaml
Monorepo: Turborepo
Package Manager: pnpm
Containerization: Docker + Docker Compose
CI/CD: GitHub Actions
Hosting: Vercel (frontend) + Railway/Fly.io (backend)
Monitoring: Sentry + Prometheus + Grafana
```

---

## Codebase Structure

```
vocabotics/
├── apps/
│   ├── api/                    # Express backend
│   │   ├── src/
│   │   │   ├── index.ts        # App entry point
│   │   │   ├── routes/         # API routes
│   │   │   ├── services/       # Business logic
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── lib/            # Shared libraries
│   │   │   ├── utils/          # Utility functions
│   │   │   ├── types/          # TypeScript types
│   │   │   └── swagger.ts      # API documentation
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   ├── migrations/     # DB migrations
│   │   │   └── seed.ts         # Seed data
│   │   ├── tests/              # Integration tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── main.tsx        # App entry point
│       │   ├── App.tsx         # Root component
│       │   ├── pages/          # Page components
│       │   ├── components/     # Reusable components
│       │   ├── layouts/        # Layout components
│       │   ├── stores/         # Zustand stores
│       │   ├── lib/            # Shared libraries
│       │   ├── hooks/          # Custom React hooks
│       │   └── types/          # TypeScript types
│       ├── public/             # Static assets
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.js
│
├── packages/                   # Shared packages (future)
│   └── shared-types/           # Shared TypeScript types
│
├── docs/                       # Documentation
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SECURITY_CHECKLIST.md
│   ├── USER_GUIDE.md
│   └── DEVELOPER_DOCUMENTATION.md (this file)
│
├── .github/
│   └── workflows/              # GitHub Actions
│       ├── ci.yml
│       └── deploy.yml
│
├── docker-compose.yml          # Local development
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # pnpm workspace
├── SPRINT_PLAN.md              # Project roadmap
└── README.md
```

---

## Development Setup

### Prerequisites

```bash
# Node.js 20+
node -v

# pnpm 8+
pnpm -v

# Docker + Docker Compose
docker --version
docker-compose --version

# PostgreSQL client (optional)
psql --version
```

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/vocabotics.git
cd vocabotics

# 2. Install dependencies
pnpm install

# 3. Start infrastructure (Postgres, Redis, Qdrant)
docker-compose up -d

# 4. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit .env files with your credentials

# 5. Run database migrations
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate

# 6. Seed development data
pnpm prisma db seed

# 7. Start development servers
cd ../..
pnpm dev
```

**Services will start on:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/api-docs
- Prisma Studio: http://localhost:5555

### Environment Variables

#### Backend (.env)

```bash
# Required
NODE_ENV=development
API_PORT=3001
DATABASE_URL="postgresql://user:pass@localhost:5432/vocabotics"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-key-min-32-chars"
OPENROUTER_API_KEY="sk-or-v1-..."

# Optional
QDRANT_URL="http://localhost:6333"
STRIPE_SECRET_KEY="sk_test_..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
SENTRY_DSN="..."
```

#### Frontend (.env)

```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Backend Development

### Folder Structure

```
apps/api/src/
├── index.ts                    # Express app setup
├── routes/                     # API endpoints
│   ├── auth.routes.ts          # /api/auth/*
│   ├── project.routes.ts       # /api/projects/*
│   ├── workflow.routes.ts      # /api/workflow/*
│   ├── quality.routes.ts       # /api/quality/*
│   └── ...
├── services/                   # Business logic
│   ├── auth.service.ts         # Authentication logic
│   ├── workflow.service.ts     # Workflow orchestration
│   ├── prd-generator.service.ts # PRD generation
│   ├── code-generator.service.ts # Code generation
│   └── ...
├── middleware/
│   ├── auth.middleware.ts      # JWT verification
│   ├── error-handler.ts        # Global error handler
│   ├── rate-limiter.ts         # Rate limiting
│   └── validate.ts             # Input validation
├── lib/
│   ├── prisma.ts               # Prisma client
│   ├── redis.ts                # Redis client
│   ├── openrouter.ts           # OpenRouter client
│   └── ...
├── utils/
│   ├── logger.ts               # Winston logger
│   ├── crypto.ts               # Encryption utilities
│   └── ...
└── types/
    └── express.d.ts            # Express type extensions
```

### Creating a New API Endpoint

**1. Define Route** (`routes/example.routes.ts`)

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { exampleService } from '../services/example.service';
import { z } from 'zod';

const router = Router();

/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Get example data
 *     tags: [Example]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const data = await exampleService.getData(req.user!.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/example:
 *   post:
 *     summary: Create example item
 *     tags: [Example]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
const createSchema = z.object({
  name: z.string().min(1).max(100),
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const result = await exampleService.create(req.user!.id, data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
```

**2. Create Service** (`services/example.service.ts`)

```typescript
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../utils/logger';

export class ExampleService {
  async getData(userId: string) {
    // Check cache first
    const cached = await redis.get(`example:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const data = await prisma.example.findMany({
      where: { userId },
      select: { id: true, name: true, createdAt: true },
    });

    // Cache for 1 hour
    await redis.setex(`example:${userId}`, 3600, JSON.stringify(data));

    logger.info(`Fetched example data for user ${userId}`);
    return data;
  }

  async create(userId: string, input: { name: string }) {
    const item = await prisma.example.create({
      data: {
        name: input.name,
        userId,
      },
    });

    // Invalidate cache
    await redis.del(`example:${userId}`);

    logger.info(`Created example item ${item.id} for user ${userId}`);
    return item;
  }
}

export const exampleService = new ExampleService();
```

**3. Register Route** (`index.ts`)

```typescript
import exampleRoutes from './routes/example.routes';

// ...

app.use('/api/example', exampleRoutes);
```

**4. Add Tests** (`tests/example.test.ts`)

```typescript
import request from 'supertest';
import { app } from '../src/index';

describe('Example API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Get auth token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    authToken = res.body.token;
  });

  it('should get example data', async () => {
    const res = await request(app)
      .get('/api/example')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create example item', async () => {
    const res = await request(app)
      .post('/api/example')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Item' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Item');
  });
});
```

### Error Handling

**Use Custom Error Classes:**

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}
```

**Throw Errors in Services:**

```typescript
import { NotFoundError } from '../utils/errors';

async getProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) {
    throw new NotFoundError('Project');
  }

  return project;
}
```

**Global Error Handler** (already implemented):

```typescript
// middleware/error-handler.ts
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  logger.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
```

---

## Frontend Development

### Folder Structure

```
apps/web/src/
├── main.tsx                    # App entry
├── App.tsx                     # Root component + routes
├── pages/                      # Page components
│   ├── Dashboard.tsx           # /dashboard
│   ├── NewProject.tsx          # /projects/new
│   ├── ProjectWorkflow.tsx     # /projects/:id/workflow
│   ├── Quality.tsx             # /projects/:id/quality
│   └── ...
├── components/                 # Reusable components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   └── ...
├── layouts/
│   ├── DashboardLayout.tsx     # Main app layout
│   └── AuthLayout.tsx          # Login/register layout
├── stores/
│   └── auth.ts                 # Zustand auth store
├── lib/
│   └── api.ts                  # Axios client
├── hooks/
│   ├── useAuth.ts
│   ├── useProjects.ts
│   └── ...
└── types/
    └── index.ts                # TypeScript types
```

### Creating a New Page

**1. Create Page Component** (`pages/Example.tsx`)

```typescript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface ExampleData {
  id: string;
  name: string;
  createdAt: string;
}

export default function Example() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExampleData[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/example');
      setData(response.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (name: string) => {
    try {
      await api.post('/example', { name });
      loadData(); // Refresh
    } catch (error) {
      console.error('Failed to create:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Example Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => (
          <div key={item.id} className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-gray-500">
              {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**2. Add Route** (`App.tsx`)

```typescript
import ExamplePage from './pages/Example';

// Inside Routes:
<Route
  path="/example"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <ExamplePage />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
```

### State Management (Zustand)

**Create Store** (`stores/example.ts`)

```typescript
import { create } from 'zustand';

interface ExampleStore {
  items: Array<{ id: string; name: string }>;
  loading: boolean;
  setItems: (items: Array<{ id: string; name: string }>) => void;
  addItem: (item: { id: string; name: string }) => void;
  setLoading: (loading: boolean) => void;
}

export const useExampleStore = create<ExampleStore>((set) => ({
  items: [],
  loading: false,
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  setLoading: (loading) => set({ loading }),
}));
```

**Use Store in Component:**

```typescript
import { useExampleStore } from '../stores/example';

function Example() {
  const { items, loading, setItems, addItem } = useExampleStore();

  // ...
}
```

### API Client

**Centralized Axios Client** (`lib/api.ts`)

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
});

// Request interceptor (add auth token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Database Management

### Schema Definition

**Prisma Schema** (`apps/api/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  passwordHash  String   @map("password_hash")
  role          Role     @default(USER)
  status        UserStatus @default(ACTIVE)

  projects      Project[]
  apiKeys       ApiKey[]

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("users")
}

enum Role {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

### Migrations

**Create Migration:**

```bash
cd apps/api
pnpm prisma migrate dev --name add_example_model
```

**Apply in Production:**

```bash
pnpm prisma migrate deploy
```

**Reset Database (Development Only):**

```bash
pnpm prisma migrate reset
```

### Querying with Prisma

**Find Many:**

```typescript
const projects = await prisma.project.findMany({
  where: { userId },
  include: { user: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

**Find Unique:**

```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: { artifacts: true },
});
```

**Create:**

```typescript
const project = await prisma.project.create({
  data: {
    name,
    description,
    userId,
    status: 'CREATED',
  },
});
```

**Update:**

```typescript
await prisma.project.update({
  where: { id: projectId },
  data: { status: 'COMPLETED', progress: 100 },
});
```

**Transaction:**

```typescript
await prisma.$transaction(async (tx) => {
  await tx.project.update({
    where: { id: projectId },
    data: { status: 'COMPLETED' },
  });

  await tx.artifact.create({
    data: { projectId, type: 'CODE', content: '...' },
  });
});
```

---

## AI Integration

### OpenRouter Client

**Configuration** (`lib/openrouter.ts`)

```typescript
import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const openrouter = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://vocabotics.com',
    'X-Title': 'Vocabotics',
  },
  timeout: 300000, // 5 minutes
});
```

### Model Selection

**Complexity-Based Routing:**

```typescript
// services/ai-router.service.ts

export function selectModel(complexity: 'low' | 'medium' | 'high') {
  switch (complexity) {
    case 'low':
      return 'anthropic/claude-3-haiku';
    case 'medium':
      return 'anthropic/claude-3.5-sonnet';
    case 'high':
      return 'anthropic/claude-3.5-sonnet';
    default:
      return 'anthropic/claude-3.5-sonnet';
  }
}

export function assessComplexity(input: string): 'low' | 'medium' | 'high' {
  const wordCount = input.split(/\s+/).length;
  const featureCount = (input.match(/feature/gi) || []).length;

  if (wordCount < 50 && featureCount < 3) return 'low';
  if (wordCount < 200 && featureCount < 10) return 'medium';
  return 'high';
}
```

### Making AI Calls

**PRD Generation Example:**

```typescript
export async function generatePRD(vision: VisionInput) {
  const model = selectModel('high');

  const prompt = `
You are a Product Requirements Document (PRD) generator for Vocabotics.

User Vision:
${JSON.stringify(vision, null, 2)}

Generate a comprehensive PRD that includes:
1. Executive Summary
2. Target Audience Analysis
3. Functional Requirements (prioritized)
4. Non-Functional Requirements
5. User Stories with Acceptance Criteria
6. Success Metrics
7. Risk Assessment
8. ISO 9001 & ISO 12207 Compliance

Output as JSON matching this structure:
{
  "title": "...",
  "vision": "...",
  "functionalRequirements": [
    {
      "id": "FR-001",
      "title": "...",
      "description": "...",
      "priority": "high" | "medium" | "low",
      "category": "..."
    }
  ],
  ...
}
`.trim();

  const response = await openrouter.post('/chat/completions', {
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.data.choices[0].message.content;
  const prd = JSON.parse(content);

  return prd;
}
```

### Caching AI Responses

```typescript
// Check cache first
const cacheKey = `prd:${hash(vision)}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// Make AI call
const prd = await generatePRD(vision);

// Cache for 24 hours
await redis.setex(cacheKey, 86400, JSON.stringify(prd));

return prd;
```

---

## Testing Strategy

### Backend Tests (Jest)

**Unit Tests:**

```typescript
// services/example.service.test.ts
import { exampleService } from '../src/services/example.service';
import { prisma } from '../src/lib/prisma';

jest.mock('../src/lib/prisma');

describe('ExampleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create item', async () => {
    const mockItem = { id: '1', name: 'Test', userId: 'user1' };
    (prisma.example.create as jest.Mock).mockResolvedValue(mockItem);

    const result = await exampleService.create('user1', { name: 'Test' });

    expect(result).toEqual(mockItem);
    expect(prisma.example.create).toHaveBeenCalledWith({
      data: { name: 'Test', userId: 'user1' },
    });
  });
});
```

**Integration Tests:**

```typescript
// tests/api/example.test.ts
import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/lib/prisma';

describe('Example API', () => {
  let token: string;

  beforeAll(async () => {
    // Create test user and get token
    const user = await prisma.user.create({
      data: { email: 'test@test.com', name: 'Test', passwordHash: '...' },
    });
    // Get token logic
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'test@test.com' } });
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/example');
    expect(res.status).toBe(401);
  });

  it('should get example data with valid token', async () => {
    const res = await request(app)
      .get('/api/example')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

### Frontend Tests (Vitest)

**Component Tests:**

```typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Run Tests:**

```bash
# Backend
cd apps/api
pnpm test

# Frontend
cd apps/web
pnpm test

# Coverage
pnpm test:coverage
```

---

## Code Generation System

### Architecture

```
Vision Input
    ↓
PRD Generator (Sonnet 4.5)
    ↓
Architecture Generator (Sonnet 4.5)
    ↓
Code Generator (Sonnet 4.5)
    ├─> Frontend Components
    ├─> Backend Services
    ├─> Database Schema
    ├─> API Routes
    └─> Tests
    ↓
Vocabotics Tag Injector
    ↓
Quality Validator
    ↓
Complete Project ZIP
```

### Vocabotics Tags

**Purpose:** Enable complete traceability from UI to database.

**Frontend Tag Example:**

```typescript
// Generated component
export default function TaskBoard() {
  return (
    <div vocabotics-id="vocabotics-cmp-TaskBoard-9a8f" vocabotics-type="component" vocabotics-requirements="FR-003,FR-004">
      <h2>Task Board</h2>
      {/* ... */}
    </div>
  );
}
```

**Backend Tag Example:**

```typescript
// Generated service
export class TaskService {
  /**
   * vocabotics-id: vocabotics-svc-TaskService-7f2e
   * vocabotics-type: service
   * vocabotics-requirements: FR-003,FR-004,FR-005
   */
  async getTasks(userId: string) {
    // ...
  }
}
```

**Database Comment Example:**

```prisma
/// vocabotics-id: vocabotics-tbl-Task-3c1d
/// vocabotics-requirements: FR-003,FR-004
model Task {
  id String @id
  title String
  // ...
}
```

### Tag Extraction

```typescript
// services/integration-map.service.ts

export function extractTags(code: string) {
  const tagRegex = /vocabotics-(id|type|requirements)="([^"]+)"/g;
  const tags: Record<string, string> = {};

  let match;
  while ((match = tagRegex.exec(code)) !== null) {
    tags[match[1]] = match[2];
  }

  return tags;
}

export function buildIntegrationMap(projectFiles: ProjectFile[]) {
  const elements: Element[] = [];
  const relationships: Relationship[] = [];

  for (const file of projectFiles) {
    const tags = extractTags(file.content);
    if (tags.id) {
      elements.push({
        vocaboticsId: tags.id,
        type: tags.type,
        requirements: tags.requirements?.split(',') || [],
        filePath: file.path,
      });
    }

    // Extract relationships (API calls, database queries, etc.)
    const apiCalls = extractApiCalls(file.content);
    for (const call of apiCalls) {
      relationships.push({
        from: tags.id,
        to: call.targetId,
        type: 'calls',
      });
    }
  }

  return { elements, relationships };
}
```

---

## Quality & Compliance

### Quality Metrics Calculation

```typescript
// services/quality.service.ts

export async function calculateQualityMetrics(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { artifacts: true },
  });

  // 1. Test Coverage (40% weight)
  const testCoverage = await getTestCoverage(projectId);

  // 2. Code Quality (30% weight)
  const codeQuality = await getCodeQuality(projectId);

  // 3. Requirement Coverage (20% weight)
  const requirementCoverage = await getRequirementCoverage(projectId);

  // 4. Security (10% weight)
  const securityScore = await getSecurityScore(projectId);

  // Weighted overall score
  const overallScore =
    testCoverage.overall * 0.4 +
    codeQuality.score * 0.3 +
    requirementCoverage.percentage * 0.2 +
    securityScore * 0.1;

  return {
    overallScore,
    testCoverage,
    codeQuality,
    requirementCoverage,
    securityScore,
  };
}
```

### ISO Compliance Validation

```typescript
// services/compliance.service.ts

export async function validateCompliance(projectId: string) {
  const checks = {
    iso9001: await validateISO9001(projectId),
    iso12207: await validateISO12207(projectId),
    wcag: await validateWCAG(projectId),
  };

  return {
    overallCompliant: Object.values(checks).every((c) => c.compliant),
    checks,
    gaps: findGaps(checks),
    recommendations: generateRecommendations(checks),
  };
}
```

---

## API Reference

Complete API documentation available at `/api-docs` (Swagger UI).

**Key Endpoints:**

```
Authentication:
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login
POST   /api/auth/logout        - Logout

Projects:
GET    /api/projects           - List projects
POST   /api/projects           - Create project
GET    /api/projects/:id       - Get project details
DELETE /api/projects/:id       - Delete project

Workflow:
POST   /api/workflow/projects  - Start workflow
GET    /api/workflow/:id       - Get workflow status
POST   /api/workflow/:id/approve - Approve phase

Quality:
GET    /api/quality/:id        - Get quality metrics
POST   /api/quality/:id/calculate - Calculate metrics

Integration Map:
GET    /api/integration-map/:id - Get integration map

Testing:
POST   /api/testing/:id/run    - Run tests
GET    /api/testing/:id/results - Get test results
```

---

## Contributing Guidelines

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/add-example-feature

# 2. Make changes
# ...

# 3. Commit with conventional commits
git commit -m "feat: add example feature"

# 4. Push to remote
git push origin feature/add-example-feature

# 5. Create pull request on GitHub
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semi-colons)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Add/update tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(api): add example endpoint
fix(ui): correct button alignment
docs(readme): update setup instructions
```

### Code Review Checklist

- [ ] Code follows TypeScript/React best practices
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance considered

---

## Debugging

### Backend Debugging

**Enable Debug Logging:**

```bash
# .env
NODE_ENV=development
LOG_LEVEL=debug
```

**View Logs:**

```bash
# Follow logs
tail -f logs/app.log

# Search logs
grep "ERROR" logs/app.log
```

**Debug with VSCode:**

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/apps/api",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Frontend Debugging

**React DevTools:**

Install [React DevTools](https://react.dev/learn/react-developer-tools) browser extension.

**Redux DevTools (for Zustand):**

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useStore = create(
  devtools((set) => ({
    // ...
  }))
);
```

**Console Logging:**

```typescript
// Only in development
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}
```

---

## Performance Optimization

### Backend Optimization

**1. Database Query Optimization:**

```typescript
// Bad: N+1 query
const projects = await prisma.project.findMany();
for (const project of projects) {
  project.user = await prisma.user.findUnique({ where: { id: project.userId } });
}

// Good: Include in query
const projects = await prisma.project.findMany({
  include: { user: true },
});
```

**2. Caching with Redis:**

```typescript
async function getProject(id: string) {
  // Check cache
  const cached = await redis.get(`project:${id}`);
  if (cached) return JSON.parse(cached);

  // Fetch from DB
  const project = await prisma.project.findUnique({ where: { id } });

  // Cache for 1 hour
  await redis.setex(`project:${id}`, 3600, JSON.stringify(project));

  return project;
}
```

**3. Pagination:**

```typescript
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({ skip, take: limit }),
    prisma.project.count(),
  ]);

  res.json({ projects, total, page, pages: Math.ceil(total / limit) });
});
```

### Frontend Optimization

**1. Code Splitting:**

```typescript
// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

**2. Memoization:**

```typescript
import { memo, useMemo } from 'react';

// Memoize component
const TaskCard = memo(({ task }: { task: Task }) => {
  return <div>{task.title}</div>;
});

// Memoize expensive computation
function TaskList({ tasks }: { tasks: Task[] }) {
  const sortedTasks = useMemo(
    () => tasks.sort((a, b) => a.priority - b.priority),
    [tasks]
  );

  return <>{sortedTasks.map((task) => <TaskCard key={task.id} task={task} />)}</>;
}
```

**3. Virtualization (for long lists):**

```typescript
import { FixedSizeList } from 'react-window';

function TaskList({ tasks }: { tasks: Task[] }) {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <TaskCard task={tasks[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={tasks.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

---

## Useful Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm dev:api               # Start backend only
pnpm dev:web               # Start frontend only

# Building
pnpm build                 # Build all
pnpm build:api            # Build backend
pnpm build:web            # Build frontend

# Testing
pnpm test                  # Run all tests
pnpm test:api             # Backend tests
pnpm test:web             # Frontend tests
pnpm test:coverage        # With coverage

# Linting
pnpm lint                  # Lint all
pnpm lint:fix             # Auto-fix issues

# Database
pnpm prisma:generate      # Generate Prisma client
pnpm prisma:migrate       # Run migrations
pnpm prisma:studio        # Open Prisma Studio
pnpm prisma:seed          # Seed database

# Docker
docker-compose up -d      # Start services
docker-compose down       # Stop services
docker-compose logs -f    # View logs
```

---

## Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Express Docs**: https://expressjs.com
- **React Docs**: https://react.dev
- **Zustand**: https://docs.pmnd.rs/zustand
- **Tailwind CSS**: https://tailwindcss.com/docs
- **OpenRouter**: https://openrouter.ai/docs

---

**Developer Documentation Version 1.0**
**Last Updated:** 2025-11-15
**Next Review:** 2026-01-15

For questions or contributions, contact: dev@vocabotics.com
