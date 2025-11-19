# Vocabotics Codebase Exploration - Complete Summary

This document provides a comprehensive overview of the Vocabotics codebase exploration and serves as your reference for building a Python CLI version.

## Quick Navigation

1. **CODEBASE_ANALYSIS.md** (24KB) - Complete technical breakdown
   - Application purpose and philosophy
   - Workflow phases and state machine
   - Prompt structure and content
   - Database schema and API routes
   - All generator services explained

2. **SYSTEM_FLOW.md** (22KB) - Visual architecture and data flow
   - Vision → Production workflow with diagrams
   - Vocabotics tag system explained
   - AI model routing strategy
   - File-based storage structure for Python CLI

3. **FILE_LOCATIONS.md** - Quick reference to source files
   - Generator services locations
   - Core services and routes
   - Configuration and documentation files

## The Big Picture

### What Vocabotics Does

Vocabotics is an **AI Orchestration Platform** that transforms software development by replacing iterative AI assistance with comprehensive generation:

**Traditional Approach (200+ calls):**
- Ask for login form
- Ask for API endpoint
- Ask for database schema
- Ask for tests
- ... repeat dozens of times

**Vocabotics Approach (8 calls):**
- Submit vision → PRD, Architecture, Schema, Code, Tests, Mapping, Quality Check, Deployment ✓

### The Core Innovation: Vocabotics Tags

Every UI element gets a unique identifier that enables complete system traceability:

```jsx
<Button data-vocabotics-id="btn-login-2fa">Login</Button>
                      ↓
Maps to: handler → API endpoint → backend function → database operation → tests
```

This creates a bidirectional knowledge graph: change the frontend, instantly know all affected backend, database, and tests.

## For Your Python CLI Version

### What to Preserve

1. **State Machine**: ProjectState enum with transitions (VISION → PRD → ARCHITECTURE → ... → DEPLOYED)
2. **Generator Services**: One service per artifact type (PRD, Architecture, Schema, Code, Tests)
3. **Prompt Templates**: System + user message pattern with JSON output schemas
4. **Tag Injection**: Embed vocabotics-id in generated code
5. **Integration Mapping**: Extract tags and map frontend → backend → database
6. **Quality Validation**: ISO 9001/12207 compliance checking
7. **Cost Tracking**: Log all AI calls with model, tokens, cost

### What Changes

1. **No Database**: Use JSON files instead (artifacts/, .vocabotics/, reports/)
2. **No Real-time UI**: CLI with progress indicators and summary output
3. **Simpler File Structure**: Nested JSON files instead of PostgreSQL tables
4. **Lightweight Dependencies**: Python + Claude API + minimal extras
5. **Synchronous Flow**: Single-threaded operations instead of async/websockets

### Recommended Python Architecture

```
vocabotics_cli/
├─ src/
│  ├─ core/
│  │  ├─ state_machine.py        # ProjectState and transitions
│  │  ├─ project.py              # Project wrapper class
│  │  └─ config.py               # Configuration management
│  ├─ ai/
│  │  ├─ client.py               # Claude API client wrapper
│  │  ├─ prompts.py              # All prompt templates
│  │  └─ model_router.py          # Model selection logic (Sonnet vs Haiku vs Vision)
│  ├─ generators/
│  │  ├─ prd_generator.py        # PRD generation
│  │  ├─ architecture_generator.py
│  │  ├─ schema_generator.py
│  │  ├─ api_generator.py
│  │  ├─ code_generator.py
│  │  └─ test_generator.py
│  ├─ mapping/
│  │  ├─ tag_extractor.py        # Extract vocabotics-id from code
│  │  └─ integration_mapper.py    # Build element → API → DB mapping
│  ├─ validation/
│  │  ├─ quality_validator.py     # ISO compliance checking
│  │  └─ traceability_validator.py
│  ├─ storage/
│  │  └─ file_manager.py          # Handle project directory structure
│  └─ cli/
│     └─ main.py                  # CLI entry point (click or argparse)
├─ tests/
├─ examples/
└─ README.md
```

## Workflow Summary

### Complete Development Cycle (6 Phases)

```
Phase 1: REQUIREMENTS
  Input: Human vision ("Build authentication system")
  Output: JSON PRD with 15-20 functional requirements, user stories, success metrics
  Model: Sonnet 4.5
  Time: ~1 min

Phase 2: DESIGN
  Input: PRD + technology stack
  Output: Complete architecture with components, data models, API specs
  Model: Sonnet 4.5
  Time: ~1.5 min

Phase 3: IMPLEMENTATION
  Inputs split between:
  - Schema Generation (Prisma schema from data models)
  - Code Generation (React + Express with vocabotics-id tags)
  - Test Generation (Jest/Vitest with 95%+ coverage target)
  Models: Sonnet 4.5 (complex), Haiku (tests)
  Time: ~2-3 min total

Phase 4: INTEGRATION MAPPING
  Input: Generated code (with tags)
  Output: Complete traceability matrix
  Logic: Extract tags, find references, build dependency graph
  Time: ~30 sec (deterministic, no AI)

Phase 5: QUALITY VALIDATION
  Checks:
  - ISO 9001 compliance
  - ISO 12207 compliance
  - Requirement coverage (100%)
  - Test coverage (95%+)
  Output: Compliance report, traceability matrix
  Time: ~1 min

Phase 6: DEPLOYMENT READINESS
  All artifacts versioned and ready
  Quality score: 95+/100
  Documentation auto-generated
```

## Key Metrics to Track

For each project, log:

```json
{
  "projectId": "uuid",
  "name": "Authentication System",
  "phases": {
    "prd_generation": {
      "model": "sonnet-4.5",
      "tokens_in": 2100,
      "tokens_out": 3200,
      "cost_usd": 0.145,
      "duration_sec": 45,
      "timestamp": "2025-11-16T01:24:00Z"
    },
    "architecture_generation": {...},
    ...
  },
  "totals": {
    "ai_calls": 6,
    "total_tokens": 18500,
    "total_cost_usd": 0.89,
    "total_duration_sec": 245,
    "requirements_generated": 18,
    "components_generated": 8,
    "api_endpoints": 12,
    "test_files": 6
  },
  "quality": {
    "iso9001_compliance": 98.5,
    "iso12207_compliance": 97.2,
    "requirement_coverage": 100.0,
    "test_coverage": 96.3,
    "overall_score": 98.0
  },
  "artifacts": {
    "prd": {"version": 1, "size": "45KB", "requirements": 18},
    "architecture": {"version": 1, "size": "78KB", "components": 8},
    "schema": {"version": 1, "size": "12KB", "models": 6},
    "code_frontend": {"version": 1, "size": "125KB", "files": 23},
    "code_backend": {"version": 1, "size": "145KB", "files": 18},
    "tests": {"version": 1, "size": "185KB", "test_files": 6},
    "integration_map": {"version": 1, "size": "65KB", "elements": 156},
    "quality_report": {"version": 1, "size": "34KB"}
  }
}
```

## CLI Example Usage

```bash
# Initialize a new project
vocabotics init "Authentication System" \
  --vision "Build a secure user authentication system with 2FA and OAuth" \
  --target-audience "Enterprise SaaS companies" \
  --features "Login, Signup, 2FA, OAuth with GitHub" \
  --tech-stack "react,express,postgresql"

# View project status
vocabotics status

# Generate PRD (with approval prompt)
vocabotics generate prd
# Review and approve in editor or via --auto-approve

# Generate architecture
vocabotics generate architecture

# Generate complete implementation (code + tests)
vocabotics generate code --target-coverage 95

# Build integration mapping
vocabotics map generate

# Run quality validation
vocabotics validate quality

# View reports
vocabotics report quality
vocabotics report traceability
vocabotics report cost

# Show project summary
vocabotics summary
```

## Data Storage Examples

### Project Config (.vocabotics/config.json)
```json
{
  "projectId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Authentication System",
  "vision": "Build a secure...",
  "created": "2025-11-16T01:24:00Z",
  "currentPhase": "architecture_review",
  "technologyStack": {
    "frontend": ["react", "typescript", "tailwind"],
    "backend": ["express", "typescript", "prisma"],
    "database": ["postgresql"],
    "infrastructure": ["docker"]
  },
  "settings": {
    "autoGenerateTests": true,
    "targetTestCoverage": 95,
    "enforceISO9001": true,
    "enforceISO12207": true
  }
}
```

### State Log (.vocabotics/state.json)
```json
{
  "currentState": "architecture_review",
  "history": [
    {"state": "vision_input", "timestamp": "2025-11-16T01:24:00Z", "triggeredBy": "user"},
    {"state": "prd_generation", "timestamp": "2025-11-16T01:24:05Z", "triggeredBy": "auto"},
    {"state": "prd_review", "timestamp": "2025-11-16T01:24:50Z", "triggeredBy": "auto"},
    {"state": "architecture_generation", "timestamp": "2025-11-16T01:25:00Z", "triggeredBy": "user_approve"},
    {"state": "architecture_review", "timestamp": "2025-11-16T01:26:30Z", "triggeredBy": "auto"}
  ]
}
```

### AI Calls Log (.vocabotics/ai_calls.jsonl)
```json
{"timestamp": "2025-11-16T01:24:05Z", "phase": "prd_generation", "model": "sonnet-4.5", "tokens_in": 2100, "tokens_out": 3200, "cost": 0.145, "duration_ms": 45000}
{"timestamp": "2025-11-16T01:25:00Z", "phase": "architecture_generation", "model": "sonnet-4.5", "tokens_in": 4500, "tokens_out": 5100, "cost": 0.289, "duration_ms": 90000}
```

## Critical Success Factors for Python CLI

1. **Preserve Tag System**: Without vocabotics-id tags, you lose traceability
2. **Maintain Prompt Quality**: The system prompts are carefully engineered - preserve exact wording
3. **JSON Output Validation**: Every AI response must parse as valid JSON with required fields
4. **State Machine Rigor**: Never skip states - the workflow order matters
5. **File Versioning**: Keep artifact versions (prd.json, prd.v2.json) for history
6. **Cost Tracking**: Log every AI call - helps optimize over time

## Next Steps

1. Study the generator services in detail:
   - `/apps/api/src/services/generators/prd-generator.service.ts` (best entry point)
   - `/apps/api/src/services/ai.service.ts` (for prompt structure)

2. Understand the state machine:
   - `/apps/api/src/lib/state-machine.ts` (all 13 states and transitions)

3. Review the database schema:
   - `/schema.sql` (focus on: projects, artifacts, integration_elements, ai_calls)

4. Design your file structure:
   - Start with `.vocabotics/config.json` and `.vocabotics/state.json`
   - Then artifacts/prd.json, artifacts/architecture.json, etc.

5. Implement incrementally:
   - Start with PRD generation
   - Then architecture
   - Then integration mapping
   - Then quality validation

## Documents Created

All analysis documents have been saved to the repository:

- **CODEBASE_ANALYSIS.md** - Complete technical deep dive
- **SYSTEM_FLOW.md** - Visual diagrams and architecture
- **FILE_LOCATIONS.md** - Quick file reference
- **EXPLORATION_SUMMARY.md** - This document

These are your definitive reference for building the Python CLI version!
