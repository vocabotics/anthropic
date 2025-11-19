# Vocabotics System Flow & Architecture

## Data Flow: Vision → Production

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER INPUT (Vision)                             │
│  "Build user authentication system with 2FA and OAuth integration"       │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              PHASE 1: VISION → PRD (Sonnet 4.5)                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Input: vision, targetAudience, keyFeatures, constraints          │  │
│  │ Output: JSON with:                                               │  │
│  │  - Requirements (REQ-F-001, REQ-F-002, ...)                      │  │
│  │  - User Stories (US-001, US-002, ...)                            │  │
│  │  - Success Metrics, Risks, Timeline                              │  │
│  │  - Personas, Constraints, Dependencies                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│         PHASE 2: PRD → ARCHITECTURE (Sonnet 4.5)                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Input: PRD JSON + Technology Stack                               │  │
│  │ Output: JSON with:                                               │  │
│  │  - Components (COMP-001, COMP-002, ...)                          │  │
│  │  - Data Models (User, Session, ...)                              │  │
│  │  - API Contracts (/api/auth/login, ...)                          │  │
│  │  - Security Architecture, Scalability, Deployment                │  │
│  │  - Compliance Mapping (REQ → Components → APIs → DB)             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │ SCHEMA   │ │   API    │ │  CODE    │
         │GENERATION│ │GENERATION│ │GENERATION│
         └────┬─────┘ └────┬─────┘ └────┬─────┘
              │            │            │
              ▼            ▼            ▼
         Prisma    OpenAPI YAML   React + Express
         Schema    Specs          (with tags!)
                │            │            │
                └────────────┼────────────┘
                             │
┌────────────────────────────┴──────────────────────────────────────────────┐
│        PHASE 3: CODE GENERATION                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ Frontend (React + TypeScript)                                    │    │
│  │  - Components tagged with vocabotics-id                          │    │
│  │  - Example: <Button data-vocabotics-id="btn-login-2fa">         │    │
│  │                                                                  │    │
│  │ Backend (Express + TypeScript)                                   │    │
│  │  - Routes with vocabotics-id comments                            │    │
│  │  - Example: // vocabotics-id: "API-AUTH-LOGIN-2FA"             │    │
│  │                                                                  │    │
│  │ Database (Prisma)                                                │    │
│  │  - Models with vocabotics-requirements comments                  │    │
│  │  - Example: // vocabotics-requirements: REQ-F-001              │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────┐
│        PHASE 4: TAG EXTRACTION & INTEGRATION MAPPING                        │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ Integration Mapping Engine:                                          │ │
│  │                                                                      │ │
│  │ btn-login-2fa (Frontend) ──→ handleLogin2FA() ──→ POST /auth/2fa   │ │
│  │         ↓                                              ↓             │ │
│  │   (React Component)                          (Express Route)        │ │
│  │         ↓                                              ↓             │ │
│  │   location: LoginForm.tsx:45          verify2FA() ──→ sessions     │ │
│  │   type: button                               ↓          table      │ │
│  │                                     (BackendService)  with          │ │
│  │   requirements:                                      vocabotics    │ │
│  │   - REQ-F-001 (User Authentication)                  requirements: │ │
│  │   - REQ-F-005 (2FA Support)                         REQ-F-001,    │ │
│  │                                                      REQ-F-005     │ │
│  │   tests:                                                            │ │
│  │   - tests/auth.test.ts:89 (login 2FA flow)                         │ │
│  │   - tests/e2e/auth.test.ts:112 (visual test)                       │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  Output: integration_map.json                                              │
│  {                                                                         │
│    "btn-login-2fa": {                                                      │
│      "component": "LoginForm.tsx:45",                                      │
│      "handler": "handleLogin2FA",                                          │
│      "api": "POST /api/auth/2fa",                                          │
│      "backend": "services/AuthService.ts:78",                              │
│      "database": "sessions table",                                         │
│      "tests": ["tests/auth.test.ts:89"],                                   │
│      "requirements": ["REQ-F-001", "REQ-F-005"]                            │
│    }                                                                       │
│  }                                                                         │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────┐
│        PHASE 5: TEST GENERATION & EXECUTION                                │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ Unit Tests (Jest) for all functions/methods                       │   │
│  │ Integration Tests for API endpoints                                │   │
│  │ E2E Tests (Puppeteer) for full flows                               │   │
│  │ Visual Tests (Claude Vision) comparing screenshot to design        │   │
│  │                                                                    │   │
│  │ All tests tagged with vocabotics-id for complete traceability     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────┐
│        PHASE 6: QUALITY & COMPLIANCE VALIDATION                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ ISO 9001 Compliance Check                                         │   │
│  │  - Customer focus verification                                    │   │
│  │  - Process approach validation                                    │   │
│  │  - Evidence-based decision making                                 │   │
│  │                                                                    │   │
│  │ ISO 12207 Compliance Check                                        │   │
│  │  - Acquisition process validation                                 │   │
│  │  - Development process verification                               │   │
│  │  - Traceability matrix 100% coverage                              │   │
│  │                                                                    │   │
│  │ WCAG Accessibility Check                                          │   │
│  │ OWASP Security Check                                              │   │
│  │ Code Quality Metrics (95%+ test coverage)                         │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────┐
│        DEPLOYMENT READY                                                    │
│  - All artifacts versioned                                                 │
│  - Complete traceability matrix generated                                   │
│  - Quality score: 95+ / 100                                                 │
│  - ISO compliant documentation auto-generated                               │
│  - Ready for deployment to production                                       │
└────────────────────────────────────────────────────────────────────────────┘
```

## Key Innovation: Vocabotics Tag System

The tag system creates complete traceability:

```
┌────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                             │
│                                                                 │
│  <Button                                                        │
│    data-vocabotics-id="btn-login-2fa"                          │
│    data-vocabotics-type="button"                               │
│    data-vocabotics-requirements="REQ-F-001,REQ-F-005"          │
│    onClick={handleLogin2FA}                                     │
│  >                                                              │
│    Verify 2FA Code                                              │
│  </Button>                                                      │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ Auto-extracted tag
                              │ "btn-login-2fa"
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              INTEGRATION MAPPING ENGINE                         │
│                                                                 │
│  Finds all references to "btn-login-2fa" across codebase:      │
│  ✓ File: components/LoginForm.tsx:45                           │
│  ✓ Handler: handleLogin2FA()                                   │
│  ✓ API Endpoint: POST /api/auth/2fa                            │
│  ✓ Backend Function: AuthService.verify2FA()                   │
│  ✓ Database Query: UPDATE sessions SET verified=true           │
│  ✓ Tests: tests/auth.test.ts:89, tests/e2e/auth.test.ts:112  │
│  ✓ Requirements: REQ-F-001, REQ-F-005                          │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│         TRACEABILITY MATRIX (auto-generated)                    │
│                                                                 │
│ Requirement → User Story → Component → API → Database → Test   │
│ REQ-F-001  → US-001     → LoginForm  → POST → sessions → ✓     │
│ REQ-F-005  → US-002     → LoginForm  → POST → sessions → ✓     │
└────────────────────────────────────────────────────────────────┘
```

## Model Routing Strategy

```
┌──────────────────────────────────┐
│      Task Complexity Assess       │
└────────────┬─────────────────────┘
             │
      ┌──────┴──────┬──────────┐
      │             │          │
      ▼             ▼          ▼
  HIGH      MEDIUM        LOW
  (15+)     (5-15)       (<5)
    │         │            │
    │         │            │
    ▼         │            ▼
SONNET 4.5    │          HAIKU
  ╔═══════════╝          3.5
  ║                        │
  ║   PRD              Tests
  ║   Architecture     Migrations
  ║   Frontend Code    Simple Routes
  ║   Complex Queries  Database
  ║                    Utilities

VISION (All image analysis)
    │
    ├─ UI Validation
    ├─ Screenshot Comparison
    └─ Accessibility Checking
```

## Storage Architecture (File-Based for Python CLI)

```
project_name/
│
├─ .vocabotics/                          # Hidden config directory
│  ├─ config.json                        # Project metadata
│  │  {
│  │    "projectId": "uuid",
│  │    "name": "Auth System",
│  │    "vision": "Build 2FA authentication",
│  │    "currentPhase": "implementation",
│  │    "technologyStack": {...},
│  │    "settings": {...}
│  │  }
│  ├─ state.json                         # Current state machine state
│  │  {
│  │    "currentState": "implementation",
│  │    "history": [...]
│  │  }
│  ├─ ai_calls.jsonl                     # Log of all AI calls
│  │  {"model": "sonnet-4.5", "task": "prd_generation", "tokens": 3200, ...}
│  │  {"model": "sonnet-4.5", "task": "architecture", "tokens": 5100, ...}
│  │
│  └─ cache.json                         # Cache for responses
│     {
│       "prd_v1": {...},
│       "architecture_v1": {...}
│     }
│
├─ artifacts/                            # Generated artifacts
│  ├─ prd.json                          # v1
│  ├─ prd.v2.json                       # v2 (if regenerated)
│  ├─ architecture.json
│  ├─ schema.prisma
│  ├─ api_spec.yaml
│  └─ integration_map.json
│
├─ src/                                  # Generated source code
│  ├─ frontend/
│  │  └─ components/
│  │     └─ LoginForm.tsx                # Tagged with vocabotics-id
│  ├─ backend/
│  │  └─ services/
│  │     └─ AuthService.ts               # Tagged with vocabotics-id
│  └─ tests/
│     └─ auth.test.ts
│
├─ reports/                              # Generated reports
│  ├─ quality_report.json
│  ├─ compliance_report.json
│  ├─ traceability_matrix.json
│  └─ ai_cost_summary.json
│
└─ README.md                             # Auto-generated project docs
```

This architecture allows your Python CLI to:
1. Store state on disk (no database needed)
2. Maintain version history (artifacts.v1, v2, v3)
3. Track all AI calls (for cost analysis)
4. Build complete traceability (integration map)
5. Generate static reports (quality, compliance)
