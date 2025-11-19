# Vocabotics Codebase Analysis

## 1. WHAT IS THE MAIN APPLICATION DOING?

### Core Concept: AI-Orchestrated Development Platform
Vocabotics is a revolutionary development orchestration platform that replaces **iterative AI assistance** with **comprehensive AI orchestration**. Instead of hundreds of small back-and-forth calls with AI, it generates complete systems in a few focused calls.

### Key Philosophy
- **Orchestration vs Iteration**: Generate complete PRD in 1 call (not 100), entire architecture in 1 call, full frontend in 1 call
- **KISS Principle**: Keep everything simple, no over-engineering
- **Dogfooding**: Platform uses the same stack it generates (React, TypeScript, Express, PostgreSQL)
- **ISO Compliance**: Built-in quality standards (ISO 9001, ISO 12207)
- **Complete Traceability**: Every UI element mapped to API, database, and tests

### The Problem It Solves
Traditional AI tools iterate:
```
Dev: "Add login"
AI: "Here's a component"
Dev: "Now add the API"
AI: "Here's a route"
... repeat 200+ times
```

Vocabotics orchestrates:
```
Dev: "Build authentication system"
AI: (generates complete system in 8 calls)
- PRD, Architecture, Schema, Frontend, Backend, Tests, Mapping, Deployment config
```

---

## 2. THE PRD > DESIGN WORKFLOW

### Complete Orchestration Flow (13 States)

```
VISION INPUT
    ↓
PRD GENERATION (Sonnet 4.5)
    ↓ (AI Complete)
PRD REVIEW (Human approves)
    ↓ (User Approve)
ARCHITECTURE DESIGN (Sonnet 4.5)
    ↓ (AI Complete)
ARCHITECTURE REVIEW (Human approves)
    ↓ (User Approve)
SCHEMA GENERATION (Sonnet 4.5 → Prisma Schema)
    ↓ (AI Complete)
API SPECIFICATION (Sonnet 4.5)
    ↓ (AI Complete)
CODE GENERATION (Frontend + Backend)
    ├─ Frontend Code (React, TypeScript with Vocabotics Tags)
    ├─ Backend Code (Express modules)
    └─ Tests
    ↓ (AI Complete)
CODE REVIEW (Human reviews)
    ↓ (User Approve)
TEST GENERATION & EXECUTION
    ├─ Unit Tests (Jest/Vitest)
    ├─ Integration Tests
    ├─ E2E Tests (Puppeteer)
    └─ Visual Tests (Claude Vision)
    ↓ (Test Pass)
INTEGRATION MAPPING (Build FE→API→DB mapping)
    ↓ (AI Complete)
QUALITY VALIDATION
    ├─ ISO 9001 Compliance Check
    ├─ ISO 12207 Compliance Check
    ├─ Traceability Matrix
    └─ Code Quality Metrics
    ↓ (Validation Pass)
DEPLOYMENT READY
    ↓ (Deployment Success)
DEPLOYED
```

### State Machine Details

**ProjectState Enum:**
- `VISION_INPUT` → `PRD_GENERATION` → `PRD_REVIEW` (Phase 1: Requirements)
- `ARCHITECTURE_DESIGN` → `ARCHITECTURE_REVIEW` → `SCHEMA_GENERATION` → `API_SPECIFICATION` (Phase 2: Design)
- `CODE_GENERATION` → `CODE_REVIEW` → `TEST_GENERATION` (Phase 3: Implementation)
- `INTEGRATION_TESTING` → `VISUAL_TESTING` → `QUALITY_REVIEW` (Phase 4: Testing)
- `DEPLOYMENT_PREP` → `DEPLOYMENT` → `DEPLOYED` (Phase 5: Deployment)

**Transition Triggers:**
- `USER_SUBMIT`, `USER_APPROVE`, `USER_REJECT`, `USER_PAUSE`, `USER_RESUME`
- `AI_COMPLETE`, `AI_ERROR`, `TEST_PASS`, `TEST_FAIL`
- `VALIDATION_PASS`, `VALIDATION_FAIL`
- `DEPLOYMENT_SUCCESS`, `DEPLOYMENT_FAILURE`

---

## 3. WHERE ARE PROMPTS STORED & WHAT DO THEY CONTAIN?

### Prompt Storage Location

Prompts are **NOT in external files** - they're **embedded in TypeScript service files**:

**Location:** `/apps/api/src/services/ai.service.ts` and `/apps/api/src/services/generators/`

### Generator Services & Their Prompts

#### A. PRD Generator (`prd-generator.service.ts`)

**System Prompt Content:**
- Identifies as "expert product manager and technical architect"
- Requirements: ISO 9001:2015, ISO 12207, ISO/IEC 25010 compliant
- Must be: Complete, Consistent, Traceable, Testable, Prioritized

**User Prompt Structure:**
```
Vision: [User's product vision]
Target Audience: [Optional]
Key Features: [List]
Constraints: [List]
Industry Standards: [List]
```

**Output Format (JSON):**
```json
{
  "title": "string",
  "version": "string",
  "vision": "string",
  "executiveSummary": "string",
  "targetAudience": {
    "primary": ["..."],
    "secondary": ["..."],
    "personas": [{"name": "...", "role": "...", "goals": [...], "painPoints": [...]}]
  },
  "functionalRequirements": [
    {"id": "REQ-F-001", "type": "functional", "priority": "critical|high|medium|low", "description": "...", "acceptanceCriteria": [...]}
  ],
  "nonFunctionalRequirements": [
    {"id": "REQ-NF-001", "type": "non-functional", "category": "performance|security|scalability|usability|reliability", "description": "..."}
  ],
  "userStories": [
    {"id": "US-001", "asA": "...", "iWant": "...", "soThat": "...", "requirementIds": ["REQ-F-001"], "acceptanceCriteria": [...], "estimatedEffort": "..."}
  ],
  "successMetrics": [{"metric": "...", "target": "...", "measurement": "..."}],
  "constraints": {"technical": [...], "business": [...], "regulatory": [...]},
  "dependencies": {"internal": [...], "external": [...], "thirdParty": [...]},
  "risks": [{"risk": "...", "severity": "critical|high|medium|low", "mitigation": "..."}],
  "timeline": [{"phase": "...", "duration": "...", "deliverables": [...]}],
  "complianceStandards": ["ISO 9001:2015", "ISO 12207", "GDPR", ...]
}
```

**Requirements Generated:**
- 15-20 functional requirements (REQ-F-001, REQ-F-002, ...)
- 10-15 non-functional requirements (REQ-NF-001, ...)
- 10-15 user stories (US-001, US-002, ...)
- Complete persona profiles
- Success metrics with measurable targets
- Risk assessment with mitigation strategies

#### B. Architecture Generator (`architecture-generator.service.ts`)

**System Prompt Content:**
- Identifies as "expert software architect"
- Knowledge areas: Microservices, RESTful APIs, Database design, Cloud infrastructure, Security, Scalability, ISO 12207
- Requirements:
  1. Maps every requirement from PRD to specific components
  2. Defines clear component boundaries
  3. Specifies complete data models with relationships
  4. Documents all API endpoints
  5. Addresses security, scalability, deployment
  6. Maintains full traceability to requirements

**User Prompt Structure:**
```
PRD: [Full PRD JSON]
Technology Stack: [Frontend, Backend, Database, Infrastructure, ThirdParty]

Requirements:
1. Create components for ALL functional requirements
2. Design data models that support all user stories
3. Define API endpoints for every user-facing feature
4. Include security measures for all data protection requirements
5. Address scalability for performance requirements
6. Map every requirement ID to its implementing components
```

**Output Format (JSON):**
```json
{
  "title": "string",
  "version": "string",
  "overview": {
    "summary": "string",
    "architectureStyle": "layered|microservices|event-driven",
    "designPrinciples": ["..."],
    "qualityAttributes": ["performance", "security", "scalability"]
  },
  "technologyStack": {
    "frontend": ["react", "typescript", "vite"],
    "backend": ["express", "typescript", "prisma"],
    "database": ["postgresql"],
    "infrastructure": ["docker", "github-actions"],
    "thirdParty": ["openrouter", "stripe"]
  },
  "components": [
    {
      "id": "COMP-001",
      "name": "User Authentication Service",
      "type": "backend|frontend|database|service|infrastructure",
      "description": "string",
      "responsibilities": ["..."],
      "technologies": ["..."],
      "dependencies": ["COMP-002"],
      "apis": [
        {
          "endpoint": "/api/auth/login",
          "method": "POST",
          "description": "...",
          "requirementIds": ["REQ-F-001"]
        }
      ]
    }
  ],
  "dataModels": [
    {
      "name": "User",
      "description": "string",
      "fields": [
        {"name": "id", "type": "uuid", "required": true, "unique": true, "indexed": true, "description": "..."}
      ],
      "relationships": [
        {"type": "oneToMany|oneToOne|manyToMany", "model": "Project", "description": "..."}
      ],
      "requirementIds": ["REQ-F-001", "REQ-F-002"]
    }
  ],
  "apiContracts": {
    "basePath": "/api",
    "version": "v1",
    "authentication": "JWT Bearer Token",
    "endpoints": [
      {
        "path": "/users/:id",
        "method": "GET",
        "summary": "Get user by ID",
        "requirementIds": ["REQ-F-001"],
        "request": {...},
        "response": [{"statusCode": 200, "schema": {...}}]
      }
    ]
  },
  "integrations": [
    {
      "name": "OpenRouter API",
      "type": "external_api|third_party_service|database|message_queue",
      "description": "...",
      "authentication": "API Key",
      "endpoints": ["https://api.openrouter.ai"],
      "requirementIds": ["REQ-NF-001"]
    }
  ],
  "security": {
    "authentication": {"mechanism": "JWT", "description": "..."},
    "authorization": {"mechanism": "Role-based", "roles": ["admin", "user", "viewer"]},
    "dataProtection": {"encryption": ["AES-256", "TLS 1.3"], "compliance": ["GDPR", "CCPA"]},
    "threats": [{"threat": "SQL Injection", "mitigation": "Parameterized queries"}]
  },
  "scalability": {
    "horizontal": {"supported": true, "description": "..."},
    "vertical": {"supported": true, "description": "..."},
    "caching": {"strategy": "Multi-layer", "layers": ["Browser", "CDN", "Redis", "Database"]},
    "loadBalancing": {"strategy": "Round-robin", "description": "..."}
  },
  "deployment": {
    "strategy": "Blue-green deployment",
    "environments": [
      {"name": "dev", "description": "...", "infrastructure": ["Docker Compose"]},
      {"name": "production", "description": "...", "infrastructure": ["Kubernetes", "AWS"]}
    ],
    "cicd": {"platform": "GitHub Actions", "stages": ["test", "build", "deploy"]},
    "monitoring": {"tools": ["Prometheus", "Grafana"], "metrics": ["response_time", "error_rate"]}
  },
  "complianceMapping": [
    {"requirementId": "REQ-F-001", "components": ["COMP-001"], "dataModels": ["User"], "apis": ["/api/auth/login"]}
  ]
}
```

#### C. Schema Generator (`schema-generator.service.ts`)

**System Prompt Content:**
- Identifies as "expert database architect specializing in Prisma ORM"
- Generates production-ready Prisma schemas
- Requirements: Indexes for performance, proper relationships, appropriate field types, Vocabotics traceability comments, cascading delete handling

**Output Format (Prisma):**
```prisma
// vocabotics-requirements: REQ-F-001, REQ-F-002
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  projects      Project[]

  @@index([email])
  @@map("users")
}
```

#### D. Code Generator (`ai.service.ts`)

**System Prompt Content:**
- "Expert software engineer"
- Generates production-ready code with error handling, type safety, documentation
- **IMPORTANT**: Add Vocabotics traceability tags to code

**Vocabotics Tags Added to Code:**
- React: `{/* vocabotics-id: "USER-AUTH-LOGIN-001" vocabotics-type: "component" vocabotics-requirements: "REQ-F-001,REQ-F-002" */}`
- Backend: `// vocabotics-id: "API-AUTH-LOGIN-001" vocabotics-type: "route" vocabotics-requirements: "REQ-F-001"`

#### E. Test Generator

**System Prompt Content:**
- "Expert in test-driven development"
- Uses appropriate frameworks:
  - Frontend: Vitest and React Testing Library
  - Backend: Jest and Supertest
- Targets 95%+ code coverage
- Includes unit tests, integration tests, edge cases, error handling, mock data

#### F. Image Analysis (Vision)

**System Prompt Content:**
- For analyzing screenshots
- Validates UI correctness against design specifications
- Checks layout, colors, typography, accessibility, responsiveness

### Prompt Configuration

**Model Selection:**
- `SONNET_4_5`: Complex tasks (PRD, Architecture, Frontend generation)
- `HAIKU_3_5`: Simpler tasks (Tests, database migrations)
- `SONNET_4_5_VISION`: Image analysis and visual testing

**Temperature & Tokens:**
- Architecture/PRD: `temperature: 0.7`, `max_tokens: 12000-16000`
- Code: `temperature: 0.3` (lower = more consistent)
- Tests: `temperature: 0.3`, `max_tokens: 8000`

---

## 4. OVERALL ARCHITECTURE (DATABASES, FRONTEND, BACKEND)

### Technology Stack

**Backend:**
- Node.js 20+ with TypeScript
- Express framework (lightweight, not Fastify in current version)
- Prisma ORM for database
- PostgreSQL 16+ as primary database
- Redis for caching, sessions, job queue
- OpenRouter API for Claude models (Sonnet, Haiku, Vision)
- JWT for authentication
- bcrypt for password hashing
- Docker for containerization
- GitHub integration via Octokit
- Stripe for payments
- Winston for logging

**Frontend:**
- React 18+
- TypeScript
- Vite for fast builds
- React Router for navigation
- Zustand for state management
- Tailwind CSS for styling
- React Query for server state
- Axios for HTTP requests
- Lucide React for icons

**Databases:**
- **PostgreSQL**: Main transactional database (users, projects, artifacts, integration elements, etc.)
- **Redis**: Caching, session storage, job queues, AI response caching
- **Vector DB** (Optional): For semantic search/RAG (Pinecone/Weaviate mentioned but not fully implemented)

### API Architecture (Express + TypeScript)

**Route Organization:**
```
/api/
├─ /auth - Authentication & authorization
├─ /projects - Project CRUD and workflow
├─ /workflows - State transitions
├─ /artifacts - PRD, Architecture, Code artifacts
├─ /generation - Generate PRD, Architecture, Code
├─ /tests - Test execution and results
├─ /quality - Quality metrics and compliance
├─ /integration-map - Element mapping and traceability
├─ /compliance - ISO compliance checking
├─ /traceability - Traceability matrix
├─ /visual-testing - Vision-based testing
├─ /github - GitHub integration
├─ /stripe - Payment handling
├─ /keys - API key management (BYOK)
├─ /execute - Docker execution
└─ /health - Health check
```

**WebSocket Events (Real-time Updates):**
- `project:subscribe` / `unsubscribe`
- `workflow:phase-changed`
- `generation:started` / `progress` / `completed`
- `test:started` / `result` / `completed`
- `quality:updated`

### Database Schema (PostgreSQL)

**Core Tables:**

1. **users**
   - id (UUID)
   - email (VARCHAR, UNIQUE)
   - password_hash, name, avatar_url
   - role (user|admin|enterprise)
   - email_verified, created_at, updated_at, last_login_at
   - metadata (JSONB)

2. **projects**
   - id (UUID)
   - owner_id (FK to users)
   - name, description, vision
   - status (active|archived|deleted)
   - current_phase (workflow state)
   - technology_stack (JSONB)
   - total_ai_calls, total_ai_cost_usd, total_lines_generated
   - settings (JSONB: autoGenerateTests, enforceISO9001, targetTestCoverage)

3. **artifacts** (PRD, Architecture, Code, etc.)
   - id (UUID)
   - project_id (FK)
   - type (prd|architecture|database_schema|api_specification|frontend_code|backend_code|test_suite|integration_map|quality_report|deployment_config)
   - version, name, description
   - content (JSONB - the actual artifact data)
   - generated_by (sonnet-4.5|haiku|vision|human)
   - generation_prompt (TEXT)
   - status (draft|review|approved|deprecated)
   - approved_by, approved_at

4. **integration_elements** (Vocabotics mapping)
   - id (UUID)
   - project_id (FK)
   - vocabotics_id (VARCHAR - e.g., "btn-login-submit")
   - element_type (button|input|form|link|component|page|modal)
   - file_path, line_number, column_number
   - action_type (api_call|navigation|state_update)
   - action_handler
   - api_endpoint
   - database_operations (JSONB)
   - test_references (JSONB)
   - requirement_ids (JSONB)

5. **test_results**
   - id (UUID)
   - project_id (FK)
   - type (unit|integration|e2e|visual)
   - test_file, test_name
   - passed, duration_ms
   - error_message
   - screenshot_url

6. **quality_metrics**
   - id (UUID)
   - project_id (FK)
   - metric_type
   - score (DECIMAL)
   - details (JSONB)

7. **ai_calls** (Analytics & cost tracking)
   - id (UUID)
   - project_id (FK)
   - user_id (FK)
   - model (sonnet-4.5|haiku|vision)
   - task_type
   - prompt_tokens, completion_tokens, total_tokens
   - cost_usd (DECIMAL)
   - duration_ms
   - cached (BOOLEAN)

8. **project_members** (Team collaboration)
   - id (UUID)
   - project_id (FK)
   - user_id (FK)
   - role (owner|editor|viewer)
   - joined_at

### Frontend Structure

**React Component Architecture:**
- Page components for each major view
- Service/hook layer for API communication
- Zustand stores for global state
- Tailwind CSS for styling

**Key Features:**
- Project dashboard with workflow visualization
- Real-time progress updates via WebSocket
- Artifact viewing and version history
- Integration map visualization
- Quality metrics dashboard
- Test results viewer

---

## 5. KEY COMPONENTS & FEATURES

### Generation Services

1. **PRDGeneratorService**
   - Takes human vision input
   - Generates comprehensive ISO-compliant PRD
   - Outputs JSON with requirements, user stories, success metrics, risks, timeline
   - Validates requirement traceability

2. **ArchitectureGeneratorService**
   - Takes PRD + technology stack
   - Generates complete architecture document
   - Specifies components, data models, API contracts
   - Maps requirements to components
   - Validates requirement coverage

3. **SchemaGeneratorService**
   - Takes architecture data models
   - Generates Prisma schema (production-ready)
   - Generates SQL migrations
   - Validates schema against data models

4. **APIGeneratorService**
   - Takes architecture
   - Generates OpenAPI specifications
   - Complete endpoint documentation
   - Request/response schemas

5. **CodeGeneratorService**
   - Takes architecture + specifications
   - Generates React components with Vocabotics tags
   - Generates Express routes/middleware
   - Generates Prisma schema
   - Adds complete type safety

6. **TestGeneratorService**
   - Takes component code
   - Generates Jest/Vitest test suites
   - Targets 95%+ coverage
   - Includes unit, integration tests

### Core Services

1. **AIService**
   - Interfaces with OpenRouter API
   - Routes to appropriate Claude model (Sonnet, Haiku, Vision)
   - Handles BYOK (Bring Your Own Key) support
   - Records AI call metrics
   - Manages AI response caching

2. **WorkflowService**
   - Orchestrates the entire project lifecycle
   - Transitions between project states
   - Emits real-time events via WebSocket
   - Manages phase progression
   - Coordinates between generators

3. **StateMaturityachine (Project Orchestration)**
   - 13+ project states
   - Transition rules between states
   - Guard conditions for invalid transitions
   - Action handlers for side effects

4. **IntegrationMappingEngine** (Core Innovation)
   - Extracts Vocabotics tags from code
   - Maps frontend elements → API endpoints → Database operations
   - Builds dependency graph
   - Generates traceability matrix
   - Performs impact analysis for changes

5. **TestingEngine**
   - Runs unit, integration, E2E tests
   - Uses Puppeteer for browser automation
   - Uses Claude Vision for visual validation
   - Generates visual regression reports
   - Validates accessibility (WCAG)

6. **QualitySystem**
   - Validates ISO 9001 compliance
   - Validates ISO 12207 compliance
   - Checks WCAG accessibility
   - Checks OWASP security
   - Generates compliance reports
   - Builds traceability matrix

7. **GitHubService**
   - Creates repositories
   - Makes commits
   - Creates branches
   - Submits pull requests
   - Integrates with GitHub Actions

8. **KeyManagerService**
   - Manages user API keys (BYOK)
   - Encrypts/decrypts sensitive keys
   - Enforces key rotation

### Key Features

**1. Vocabotics Tag System**
- Unique identifier for every UI element
- Format: `data-vocabotics-id="btn-login-submit"`
- Enables complete traceability throughout system
- Links frontend → API → backend → database → tests

**2. Complete Traceability Matrix**
```
Requirement ID → User Story → Component → API Endpoint → Database Operation → Test
REQ-F-001    → US-001    → LoginForm   → POST /auth/login → UPDATE users → auth.test.ts
```

**3. Real-time Orchestration Dashboard**
- Visual progress indicators
- Phase-by-phase workflow visualization
- AI call tracking and cost display
- Artifact versioning

**4. Multi-Model AI Routing**
- Claude Sonnet 4.5 for complex tasks (architecture, PRD, frontend)
- Claude Haiku 3.5 for simpler tasks (tests, migrations)
- Claude Vision for UI validation
- Intelligent caching of responses

**5. ISO Compliance Engine**
- Automatic ISO 9001 compliance checking
- Automatic ISO 12207 compliance checking
- Traceability validation
- Documentation auto-generation

**6. Vision-Based Testing**
- Puppeteer captures UI screenshots
- Claude Vision analyzes layout, colors, typography
- WCAG accessibility checking
- Visual regression testing

**7. Integrated Git Workflow**
- Auto-creates GitHub repos for projects
- Auto-commits generated code
- Integrates with GitHub Actions for CI/CD
- Tracks changes via commits

**8. BYOK (Bring Your Own Key) Support**
- Users can provide their own OpenRouter API keys
- Keys encrypted at rest
- Falls back to platform keys if not provided

**9. Cost Tracking & Analytics**
- Every AI call logged with model, tokens, cost
- Per-project cost breakdown
- Monthly usage tracking
- Cost optimization recommendations

**10. Job Queue System**
- Uses BullMQ for async task execution
- Long-running generation tasks don't block API
- Retry logic for failed tasks
- Job progress tracking

---

## Summary: Creating Your Python CLI Version

To create a lightweight Python CLI that follows the same workflow using **folders instead of databases**:

### Key Architectural Principles to Preserve
1. **State Machine**: Implement ProjectState and transitions
2. **Generator Services**: One service per artifact type (PRD, Architecture, Schema, etc.)
3. **Vocabotics Tagging**: Inject tags into generated code
4. **Integration Mapping**: Map frontend elements to APIs and databases
5. **Quality Validation**: ISO compliance checking
6. **Prompt Structure**: Use system + user message pattern with JSON output

### File-Based Storage Structure
```
projects/
├─ project_name/
│  ├─ .vocabotics/
│  │  ├─ config.json (project metadata, current phase, settings)
│  │  ├─ state.json (current state machine state)
│  │  ├─ ai_calls.jsonl (log of all AI calls)
│  │  └─ cache.db (SQLite for artifact versioning)
│  ├─ artifacts/
│  │  ├─ prd.json (v1, v2, v3...)
│  │  ├─ architecture.json
│  │  ├─ schema.prisma
│  │  ├─ api_spec.yaml
│  │  └─ integration_map.json
│  ├─ src/ (generated code)
│  │  ├─ frontend/
│  │  ├─ backend/
│  │  └─ tests/
│  └─ reports/
│     ├─ quality_report.json
│     ├─ compliance_report.json
│     └─ traceability_matrix.json
```

### Core Python Modules to Implement
1. `core/state_machine.py` - Project state transitions
2. `generators/prd_generator.py` - PRD generation
3. `generators/architecture_generator.py` - Architecture generation
4. `generators/schema_generator.py` - Database schema
5. `generators/code_generator.py` - Frontend/Backend code
6. `generators/test_generator.py` - Test generation
7. `mapping/integration_map.py` - Build traceability map
8. `validation/quality_system.py` - ISO compliance
9. `cli/main.py` - CLI entry point

This preserves all the power of Vocabotics while being lightweight and self-contained!
