# Vocabotics CLI - Quick Start

Get started with the lightweight Python CLI in 5 minutes.

## Installation

```bash
# 1. Install dependencies
cd vocabotics-cli
pip install -r requirements.txt

# 2. Set your Anthropic API key
export ANTHROPIC_API_KEY='your-api-key-here'
```

## First Project

```bash
# Create a project
python3 -m vocabotics.cli create my-first-app

# Generate PRD
python3 -m vocabotics.cli generate-prd my-first-app \
  "A task management app for remote teams with real-time collaboration"

# Generate Architecture
python3 -m vocabotics.cli generate-arch my-first-app

# Check status
python3 -m vocabotics.cli status my-first-app
```

## View Results

```bash
# View PRD (requires jq - install with: sudo apt-get install jq)
cat projects/my-first-app/artifacts/prd.json | jq .

# View requirements
cat projects/my-first-app/artifacts/prd.json | jq '.functionalRequirements[]'

# View architecture components
cat projects/my-first-app/artifacts/architecture.json | jq '.components[]'
```

## All Commands

```bash
# Create project
python3 -m vocabotics.cli create <project-name>

# List projects
python3 -m vocabotics.cli list

# Generate PRD
python3 -m vocabotics.cli generate-prd <project> "vision" \
  --audience "target users" \
  --features "feature1, feature2" \
  --constraints "constraint1, constraint2"

# Generate Architecture
python3 -m vocabotics.cli generate-arch <project> \
  --frontend "React, TypeScript" \
  --backend "Node.js, Express" \
  --database "PostgreSQL, Prisma"

# Show status
python3 -m vocabotics.cli status <project>
```

## Cost Estimate

- PRD Generation: ~$0.12-0.15 (30-60 seconds)
- Architecture Generation: ~$0.21-0.25 (60-90 seconds)
- **Total**: ~$0.35 per project

## Next Steps

- See [README.md](README.md) for full documentation
- See [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) for detailed examples
- Check your generated files in `projects/<project-name>/artifacts/`

## Troubleshooting

### No API key error
```bash
export ANTHROPIC_API_KEY='sk-ant-...'
```

### Project not found
```bash
# Make sure to create first
python3 -m vocabotics.cli create my-project
```

## What's Different from Full Vocabotics?

| Feature | Full Platform | CLI |
|---------|--------------|-----|
| Storage | PostgreSQL | JSON files |
| Interface | Web UI | Terminal |
| Requirements | Docker, Node.js, DB | Just Python |

## Same Features

✅ Exact same AI prompts
✅ Exact same workflow
✅ ISO-compliant PRDs
✅ Full requirement traceability
✅ Cost tracking
