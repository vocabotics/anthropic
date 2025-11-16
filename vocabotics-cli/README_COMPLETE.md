# Vocabotics CLI - Complete Workflow

**Full-featured Python CLI for AI-powered software development following the complete Vocabotics workflow**

## Overview

This is a standalone Python command-line tool that implements the **complete Vocabotics workflow** from vision to production-ready code, using the exact same prompts and methodology as the full platform.

### Complete Workflow States

The CLI now supports ALL 16 states of the Vocabotics workflow:

#### Phase 1: Vision & Requirements (0-10%)
- ✅ Vision Input
- ✅ PRD Generation
- ✅ PRD Review

#### Phase 2: Architecture & Design (20-35%)
- ✅ Architecture Design
- ✅ Architecture Review
- ✅ Schema Generation (Prisma)
- ✅ API Specification

#### Phase 3: Implementation (50-65%)
- ✅ Code Generation (React + Express with Vocabotics tags)
- ✅ Code Review
- ✅ Test Generation

#### Phase 4: Testing & Quality (75-85%)
- ✅ Quality Review & ISO Compliance Reports

#### Phase 5: Deployment (90-100%)
- ⚠️ Deployment (not yet implemented in CLI)

## Key Features

✅ **Same AI Prompts** - Uses exact prompts from TypeScript version
✅ **Complete Workflow** - All steps from vision to code generation
✅ **Vocabotics Tags** - Full traceability in generated code
✅ **ISO Compliance** - PRDs following ISO 9001, ISO 12207
✅ **Quality Reports** - Automated quality and compliance analysis
✅ **Cost Tracking** - Detailed logs of all AI calls
✅ **One-Command Workflow** - `run-workflow` executes everything

## Quick Start

```bash
# Install
cd vocabotics-cli
pip install -r requirements.txt
export ANTHROPIC_API_KEY='your-key-here'

# Run complete workflow in ONE command
python3 -m vocabotics.cli run-workflow my-app \
  "A task management app for remote teams with real-time collaboration"

# Or step-by-step
python3 -m vocabotics.cli create my-app
python3 -m vocabotics.cli generate-prd my-app "vision..."
python3 -m vocabotics.cli generate-arch my-app
python3 -m vocabotics.cli generate-schema my-app
python3 -m vocabotics.cli generate-code my-app
python3 -m vocabotics.cli generate-tests my-app
python3 -m vocabotics.cli quality-report my-app
```

## All Commands

### Project Management
```bash
# Create new project
python3 -m vocabotics.cli create <project-name>

# List all projects
python3 -m vocabotics.cli list

# Show project status
python3 -m vocabotics.cli status <project-name>
```

### Step-by-Step Generation
```bash
# 1. Generate PRD (Product Requirements Document)
python3 -m vocabotics.cli generate-prd <project> "vision" \
  --audience "target users" \
  --features "feature1, feature2" \
  --constraints "constraint1"

# 2. Generate Architecture
python3 -m vocabotics.cli generate-arch <project> \
  --frontend "React, TypeScript, TailwindCSS" \
  --backend "Node.js, Express, TypeScript" \
  --database "PostgreSQL, Prisma"

# 3. Generate Database Schema (Prisma)
python3 -m vocabotics.cli generate-schema <project>

# 4. Generate Code (React + Express)
python3 -m vocabotics.cli generate-code <project>
# Or specify type
python3 -m vocabotics.cli generate-code <project> --type frontend
python3 -m vocabotics.cli generate-code <project> --type backend

# 5. Generate Tests
python3 -m vocabotics.cli generate-tests <project>

# 6. Generate Quality Report
python3 -m vocabotics.cli quality-report <project>
```

### Complete Workflow (All Steps)
```bash
# Run everything at once!
python3 -m vocabotics.cli run-workflow <project> "vision" \
  --frontend "React, TypeScript" \
  --backend "Node.js, Express" \
  --database "PostgreSQL"
```

## What Gets Generated

### 1. PRD (Product Requirements Document)
- 15-20 functional requirements
- 10-15 non-functional requirements
- 10-15 user stories
- User personas
- Success metrics
- Risk assessment
- Timeline

**Example:**
```json
{
  "title": "Task Management Platform",
  "functionalRequirements": [
    {
      "id": "REQ-F-001",
      "type": "functional",
      "priority": "critical",
      "description": "Users can create and manage tasks",
      "acceptanceCriteria": ["Can create task", "Can edit task", "Can delete task"]
    }
  ],
  "userStories": [
    {
      "id": "US-001",
      "asA": "team member",
      "iWant": "to create tasks",
      "soThat": "I can track my work",
      "requirementIds": ["REQ-F-001"]
    }
  ]
}
```

### 2. Architecture
- System components
- Data models with relationships
- API endpoints (OpenAPI-style)
- Security architecture
- Scalability plan
- Deployment strategy

### 3. Prisma Schema
- Complete `schema.prisma` file
- All models with types and relations
- Indexes and constraints
- Migration-ready

**Example:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  tasks     Task[]
  createdAt DateTime @default(now())

  @@index([email])
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  status      String
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())

  @@index([userId, status])
}
```

### 4. React Components (with Vocabotics Tags!)
```tsx
{/* vocabotics-id: "COMP-001-TASK-FORM" */}
{/* vocabotics-type: "component" */}
{/* vocabotics-requirements: "REQ-F-001,REQ-F-002" */}

import { useState } from 'react';

export function TaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Create task logic
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full p-2 border rounded"
        aria-label="Task title"
      />
      {/* ... */}
    </form>
  );
}
```

### 5. Express APIs (with Vocabotics Tags!)
```typescript
// vocabotics-id: "API-TASKS-CREATE-001"
// vocabotics-type: "route"
// vocabotics-requirements: "REQ-F-001,REQ-F-003"

import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done'])
});

router.post('/tasks', async (req, res) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: {
        ...data,
        userId: req.user.id
      }
    });
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
});

export default router;
```

### 6. Tests
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskForm } from './TaskForm';

describe('TaskForm', () => {
  it('renders task form correctly', () => {
    render(<TaskForm />);
    expect(screen.getByLabelText('Task title')).toBeInTheDocument();
  });

  it('submits task on form submission', async () => {
    render(<TaskForm />);
    const input = screen.getByLabelText('Task title');
    fireEvent.change(input, { target: { value: 'New task' } });
    // ... test submission
  });
});
```

### 7. Quality Report
```json
{
  "overallScore": 87.5,
  "sections": {
    "prd": {
      "score": 100,
      "metrics": {
        "functionalRequirements": 18,
        "nonFunctionalRequirements": 12,
        "userStories": 15,
        "traceabilityCoverage": 95.2
      }
    },
    "architecture": {
      "score": 85,
      "metrics": {
        "components": 12,
        "dataModels": 6,
        "apiEndpoints": 24,
        "requirementCoverage": 97.3
      }
    }
  },
  "isoCompliance": {
    "ISO_9001": {
      "score": 100,
      "requirements": [
        {"name": "Requirements defined", "passed": true},
        {"name": "Quality objectives set", "passed": true}
      ]
    }
  },
  "traceability": [
    {
      "requirementId": "REQ-F-001",
      "components": ["COMP-001"],
      "apiEndpoints": ["POST /api/tasks"],
      "dataModels": ["Task"],
      "testCases": []
    }
  ]
}
```

## Project Structure

After running the complete workflow:

```
projects/my-app/
├── .vocabotics/
│   ├── config.json              # Project configuration
│   ├── state.json               # Current workflow state
│   └── ai_calls.jsonl           # AI call logs with costs
├── artifacts/
│   ├── prd.json                 # Product Requirements
│   ├── architecture.json        # System Architecture
│   ├── schema.json              # Prisma Schema
│   ├── code.json                # All generated code (metadata)
│   └── tests.json               # Test files (metadata)
├── src/
│   ├── components/              # Generated React components
│   │   ├── TaskForm.tsx
│   │   ├── TaskList.tsx
│   │   └── __tests__/
│   │       ├── TaskForm.test.tsx
│   │       └── TaskList.test.tsx
│   ├── routes/                  # Generated Express routes
│   │   ├── tasks.routes.ts
│   │   └── auth.routes.ts
│   ├── controllers/             # Generated controllers
│   │   ├── tasks.controller.ts
│   │   └── auth.controller.ts
│   └── prisma/
│       └── schema.prisma        # Generated Prisma schema
└── reports/
    └── quality.latest.json      # Quality & compliance report
```

## Cost Estimation

Based on Claude Sonnet 4.5 pricing:

| Step | Estimated Cost | Duration |
|------|---------------|----------|
| PRD Generation | $0.12-0.15 | 30-60s |
| Architecture Generation | $0.21-0.25 | 60-90s |
| Schema Generation | $0.08-0.10 | 30-45s |
| Code Generation (Frontend) | $0.15-0.20 | 60-90s |
| Code Generation (Backend) | $0.15-0.20 | 60-90s |
| Test Generation | $0.10-0.15 | 45-60s |
| **Complete Workflow** | **$0.80-1.05** | **5-7 min** |

All costs are logged in `.vocabotics/ai_calls.jsonl`

## Example: Complete Workflow

```bash
#!/bin/bash

# Set API key
export ANTHROPIC_API_KEY='your-key-here'

# Run complete workflow
python3 -m vocabotics.cli run-workflow task-manager \
  "A collaborative task management platform for remote teams with real-time updates, project boards, time tracking, and team chat" \
  --frontend "React, TypeScript, TailwindCSS, Zustand" \
  --backend "Node.js, Express, TypeScript, Socket.io" \
  --database "PostgreSQL, Prisma, Redis"

# Output:
# 🚀 Running Complete Workflow for: task-manager
#
# Step 1: Creating project...
# ✓ Created project: task-manager
#
# Step 2: Generating PRD...
# 🤖 Calling AI to generate PRD... (this may take 30-60 seconds)
# ✓ PRD generated successfully!
#   Functional Requirements: 18
#   User Stories: 15
#
# Step 3: Generating Architecture...
# 🤖 Calling AI to generate Architecture... (this may take 60-90 seconds)
# ✓ Architecture generated successfully!
#   Components: 12
#   API Endpoints: 24
#
# Step 4: Generating Schema...
# ✓ Schema generated successfully!
#   Models: 6
#
# Step 5: Generating Code...
# 🤖 Generating frontend components... (3 components)
#   ✓ Generated 3 frontend files
# 🤖 Generating backend components... (3 components)
#   ✓ Generated 6 backend files
# ✓ Code generation complete!
#   Files written to: projects/task-manager/src/
#
# Step 6: Generating Tests...
# ✓ Test generation complete!
#   Total test files: 9
#
# Step 7: Generating Quality Report...
# ✓ Quality Report Generated
#   Overall Score: 87.5/100
#   ISO_9001: 100%
#
# ============================================================
# 🎉 WORKFLOW COMPLETE!
# ============================================================
#
# Completed steps: create, prd, architecture, schema, code, tests, quality
```

## Advantages Over Full Platform

### Simpler Setup
- No Docker required
- No database setup
- No Node.js/npm
- Just Python + pip

### Faster Testing
- Instant project creation
- No build steps
- Direct file access
- Lightweight storage

### Perfect for:
- Quick prototyping
- Learning the Vocabotics methodology
- Testing AI prompts
- Generating documentation
- Creating POCs

## Traceability Matrix

The quality report includes a complete traceability matrix:

```
REQ-F-001 (Create tasks)
  ├── User Story: US-001
  ├── Component: COMP-001-TASK-FORM
  ├── API: POST /api/tasks
  ├── Data Model: Task
  └── Test: TaskForm.test.tsx

REQ-F-002 (Edit tasks)
  ├── User Story: US-002
  ├── Component: COMP-002-TASK-EDITOR
  ├── API: PUT /api/tasks/:id
  ├── Data Model: Task
  └── Test: TaskEditor.test.tsx
```

This ensures **100% requirement coverage** and **full traceability** from vision to code!

## Next Steps

After generating everything, you can:

1. **Review the code** in `projects/<name>/src/`
2. **Set up the project**:
   ```bash
   cd projects/my-app
   npm init -y
   npm install react express prisma typescript
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

3. **Customize and extend** the generated code
4. **Deploy to production**

## Differences from Full Platform

| Feature | Full Platform | CLI |
|---------|--------------|-----|
| Storage | PostgreSQL | JSON files |
| Interface | Web UI | Terminal |
| Code Execution | Integrated | Manual setup |
| Deployment | GitHub/Vercel | Manual |
| Real-time Updates | WebSocket | N/A |
| Team Collaboration | Multi-user | Single-user |

## Same Features

✅ Exact same AI prompts
✅ Exact same workflow steps
✅ ISO-compliant documentation
✅ Vocabotics traceability tags
✅ Requirement coverage validation
✅ Quality scoring
✅ Cost tracking

## Documentation

- **README.md** - Original documentation
- **README_COMPLETE.md** - This file (complete workflow)
- **QUICKSTART.md** - 5-minute getting started guide
- **USAGE_EXAMPLES.md** - Detailed examples

## Contributing

This is a lightweight version for testing and learning. For production use, see the full Vocabotics platform.

## License

MIT
