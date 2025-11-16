# Vocabotics CLI

**Lightweight Python CLI for AI-powered software development**

A simplified, command-line version of the Vocabotics platform that follows the same PRD → Architecture → Design workflow, but stores everything in folders on disk instead of using databases and frontends.

## Features

- **Same Prompts**: Uses the exact same AI prompts as the full Vocabotics platform
- **File-Based Storage**: All data stored as JSON files - no database required
- **State Machine Workflow**: Follows the same 13-state workflow (Vision → PRD → Architecture → etc.)
- **ISO Compliance**: Generates PRDs following ISO 9001, ISO 12207 standards
- **Requirement Traceability**: Full validation and coverage analysis
- **Cost Tracking**: Logs all AI calls with token usage and costs

## Installation

### Prerequisites

- Python 3.8+
- Anthropic API key

### Setup

1. Clone or download this directory:
```bash
cd vocabotics-cli
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Install the CLI:
```bash
pip install -e .
```

4. Set your Anthropic API key:
```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

Add this to your `~/.bashrc` or `~/.zshrc` to persist it.

## Quick Start

### 1. Create a Project

```bash
vocabotics create my-saas-app
```

This creates the following structure:
```
projects/my-saas-app/
├── .vocabotics/
│   ├── config.json          # Project configuration
│   ├── state.json           # Current workflow state
│   └── ai_calls.jsonl       # AI call logs with costs
├── artifacts/
│   ├── prd.json             # Product Requirements Document
│   └── architecture.json    # Architecture Document
├── src/                      # (Future: generated code)
└── reports/                  # (Future: quality reports)
```

### 2. Generate PRD from Vision

```bash
vocabotics generate-prd my-saas-app "A project management tool for remote teams with real-time collaboration, task tracking, and video integration"
```

Optional parameters:
```bash
vocabotics generate-prd my-saas-app "Product vision..." \
  --audience "Remote teams, project managers, developers" \
  --features "Real-time chat, Kanban boards, Time tracking" \
  --constraints "Must work offline, GDPR compliant"
```

This will:
- Call Claude to generate a comprehensive PRD
- Include 15-20 functional requirements
- Include 10-15 non-functional requirements
- Include 10-15 user stories
- Create user personas
- Save to `projects/my-saas-app/artifacts/prd.json`
- Cost: ~$0.10-0.20

### 3. Generate Architecture from PRD

```bash
vocabotics generate-arch my-saas-app
```

Optional: specify tech stack:
```bash
vocabotics generate-arch my-saas-app \
  --frontend "React,TypeScript,TailwindCSS" \
  --backend "Node.js,Express,TypeScript" \
  --database "PostgreSQL,Prisma"
```

This will:
- Load the PRD
- Call Claude to generate software architecture
- Map all requirements to components
- Define data models and API contracts
- Validate requirement coverage
- Save to `projects/my-saas-app/artifacts/architecture.json`
- Cost: ~$0.15-0.30

### 4. View Project Status

```bash
vocabotics status my-saas-app
```

### 5. List All Projects

```bash
vocabotics list
```

## Project States

The CLI follows the same state machine as the full platform:

### Phase 1: Vision & Requirements (0-10%)
- `vision_input` → `prd_generation` → `prd_review`

### Phase 2: Architecture & Design (20-35%)
- `architecture_design` → `architecture_review` → `schema_generation` → `api_specification`

### Phase 3: Implementation (50-65%)
- `code_generation` → `code_review` → `test_generation`

### Phase 4: Testing & Quality (75-85%)
- `integration_testing` → `visual_testing` → `quality_review`

### Phase 5: Deployment (90-100%)
- `deployment_prep` → `deployment` → `deployed`

## File Structure

### Project Config (`.vocabotics/config.json`)
```json
{
  "name": "my-saas-app",
  "created_at": "2025-01-15T10:30:00",
  "version": "1.0.0"
}
```

### State (`.vocabotics/state.json`)
```json
{
  "project_id": "my-saas-app",
  "current_state": "prd_review",
  "metadata": {},
  "history": [
    {
      "state": "prd_generation",
      "timestamp": "2025-01-15T10:31:00",
      "triggered_by": "cli"
    }
  ]
}
```

### AI Call Log (`.vocabotics/ai_calls.jsonl`)
```jsonl
{"content": "...", "model": "claude-sonnet-4-5", "usage": {"input_tokens": 1200, "output_tokens": 8500, "total_tokens": 9700}, "duration_ms": 45000, "cost_usd": 0.1425, "timestamp": "2025-01-15T10:31:45", "task_type": "prd_generation"}
```

## Workflow Example

```bash
# 1. Create project
vocabotics create task-manager

# 2. Generate PRD
vocabotics generate-prd task-manager \
  "A collaborative task management platform for remote teams"

# 3. Review PRD (open in editor or jq)
cat projects/task-manager/artifacts/prd.json | jq '.functionalRequirements[] | {id, description}'

# 4. Generate architecture
vocabotics generate-arch task-manager

# 5. Review architecture
cat projects/task-manager/artifacts/architecture.json | jq '.components[] | {id, name, type}'

# 6. Check status
vocabotics status task-manager

# 7. View all projects
vocabotics list
```

## Viewing Generated Artifacts

### Using jq (recommended)

```bash
# View PRD requirements
cat projects/my-app/artifacts/prd.json | jq '.functionalRequirements'

# View user stories
cat projects/my-app/artifacts/prd.json | jq '.userStories'

# View architecture components
cat projects/my-app/artifacts/architecture.json | jq '.components'

# View data models
cat projects/my-app/artifacts/architecture.json | jq '.dataModels'
```

### Using Python

```python
import json

with open('projects/my-app/artifacts/prd.json') as f:
    prd = json.load(f)

print(f"Title: {prd['title']}")
print(f"Requirements: {len(prd['functionalRequirements'])}")

for req in prd['functionalRequirements']:
    print(f"  {req['id']}: {req['description']}")
```

## Cost Estimation

Based on Claude Sonnet 4.5 pricing:

| Task | Input Tokens | Output Tokens | Estimated Cost |
|------|--------------|---------------|----------------|
| PRD Generation | ~1,500 | ~8,000 | $0.12-0.15 |
| Architecture Generation | ~10,000 | ~12,000 | $0.21-0.25 |
| **Total (Vision → Architecture)** | | | **~$0.35** |

All costs are logged in `.vocabotics/ai_calls.jsonl` for tracking.

## Differences from Full Platform

| Feature | Full Platform | CLI Version |
|---------|--------------|-------------|
| Storage | PostgreSQL | JSON files |
| Interface | Web UI | Command line |
| State | Database | JSON file |
| AI Calls | Logged to DB | Logged to JSONL |
| Code Gen | Full React/Express | Not yet implemented |
| Deployment | GitHub integration | Not yet implemented |
| Auth | JWT, OAuth | N/A (local only) |

## What's the Same?

✅ Exact same AI prompts
✅ Exact same state machine workflow
✅ Exact same validation logic
✅ ISO-compliant PRD generation
✅ Requirement traceability
✅ Cost tracking
✅ JSON schemas

## Extending the CLI

The CLI is designed to be extended. Future additions:

- Code generation (React components, Express APIs)
- Schema generation (Prisma)
- Test generation
- GitHub integration
- Quality reports (ISO compliance scores)

## Troubleshooting

### "ANTHROPIC_API_KEY environment variable not set"

```bash
export ANTHROPIC_API_KEY='sk-ant-...'
```

### "Project 'xyz' not found"

Make sure you created the project first:
```bash
vocabotics create xyz
```

### JSON parsing errors

The AI occasionally generates invalid JSON. The CLI will show the error. You can:
1. Retry the generation
2. Manually fix the JSON in the artifacts folder

### State machine errors

If the workflow gets stuck, you can manually edit `.vocabotics/state.json` to change the current state.

## Development

```bash
# Install in development mode
pip install -e .

# Run without installing
python -m vocabotics.cli create test-project

# Run tests (when added)
pytest
```

## Architecture

```
vocabotics/
├── __init__.py
├── cli.py                    # Main CLI interface
├── state_machine.py          # State machine (13 states)
├── ai_client.py              # Anthropic API wrapper
├── generators/
│   ├── prd_generator.py      # PRD generation with exact prompts
│   ├── architecture_generator.py  # Architecture generation
│   └── validators.py         # Traceability validation
└── storage/
    └── file_storage.py       # File-based persistence
```

## License

MIT

## Contributing

This is a lightweight testing version. For the full platform, see the main Vocabotics repository.
