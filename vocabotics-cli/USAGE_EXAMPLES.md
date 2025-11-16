# Vocabotics CLI - Usage Examples

## Running the CLI

Since we're in development, you can run the CLI in two ways:

### Method 1: Using Python module (recommended)
```bash
cd vocabotics-cli
python3 -m vocabotics.cli <command>
```

### Method 2: Using wrapper script
```bash
cd vocabotics-cli
./vocabotics-cli.sh <command>
```

## Example 1: Simple Task Manager App

```bash
# Set your API key
export ANTHROPIC_API_KEY='your-key-here'

# Navigate to CLI directory
cd vocabotics-cli

# Create project
python3 -m vocabotics.cli create task-manager

# Generate PRD
python3 -m vocabotics.cli generate-prd task-manager \
  "A simple task management application for individuals and small teams. Users can create tasks, set deadlines, organize into projects, and track progress."

# Review the PRD (requires jq)
cat projects/task-manager/artifacts/prd.json | jq '.functionalRequirements[] | {id, description}' | head -20

# Generate Architecture
python3 -m vocabotics.cli generate-arch task-manager

# Check status
python3 -m vocabotics.cli status task-manager

# List all projects
python3 -m vocabotics.cli list
```

## Example 2: E-Commerce Platform with Custom Stack

```bash
# Create project
python3 -m vocabotics.cli create ecommerce-platform

# Generate PRD with detailed parameters
python3 -m vocabotics.cli generate-prd ecommerce-platform \
  "An e-commerce platform for selling handmade goods with integrated payments, inventory management, and seller dashboards" \
  --audience "Artisans, crafters, small business owners, shoppers" \
  --features "Product catalog, Shopping cart, Payment processing, Order management, Seller dashboard, Review system" \
  --constraints "PCI DSS compliance required, Mobile-first design, Budget of $50k"

# Generate Architecture with custom tech stack
python3 -m vocabotics.cli generate-arch ecommerce-platform \
  --frontend "Next.js,React,TypeScript,TailwindCSS,Stripe Elements" \
  --backend "Node.js,NestJS,TypeScript,Stripe API" \
  --database "PostgreSQL,Prisma,Redis"

# View generated components
cat projects/ecommerce-platform/artifacts/architecture.json | jq '.components[] | {id, name, type}'

# View data models
cat projects/ecommerce-platform/artifacts/architecture.json | jq '.dataModels[] | {name, fields: .fields | length}'
```

## Example 3: SaaS Platform with Compliance Requirements

```bash
# Create project
python3 -m vocabotics.cli create saas-crm

# Generate PRD with compliance standards
python3 -m vocabotics.cli generate-prd saas-crm \
  "A customer relationship management (CRM) system for B2B sales teams with lead tracking, email integration, and analytics" \
  --audience "Sales teams, Sales managers, Marketing teams" \
  --features "Lead management, Pipeline visualization, Email tracking, Reporting, Team collaboration" \
  --constraints "SOC 2 compliance, GDPR compliance, 99.9% uptime SLA, Multi-tenant architecture"

# Generate Architecture
python3 -m vocabotics.cli generate-arch saas-crm \
  --frontend "React,TypeScript,Recharts,React Query" \
  --backend "Node.js,Express,TypeScript,Bull Queue" \
  --database "PostgreSQL,Prisma,Redis,Elasticsearch"

# View API endpoints
cat projects/saas-crm/artifacts/architecture.json | jq '.apiContracts.endpoints[] | {path, method, summary}' | head -30

# Check requirement coverage
cat projects/saas-crm/artifacts/architecture.json | jq '.complianceMapping[] | {requirementId, components, dataModels}' | head -20
```

## Example 4: Reviewing Generated Artifacts

### View PRD Summary
```bash
PROJECT="task-manager"

echo "=== PRD Summary ==="
cat projects/$PROJECT/artifacts/prd.json | jq '{
  title,
  version,
  functionalReqs: (.functionalRequirements | length),
  nonFunctionalReqs: (.nonFunctionalRequirements | length),
  userStories: (.userStories | length),
  personas: (.targetAudience.personas | length)
}'
```

### View All Requirements
```bash
PROJECT="task-manager"

echo "=== Functional Requirements ==="
cat projects/$PROJECT/artifacts/prd.json | jq '.functionalRequirements[] | "\(.id): \(.description)"'

echo -e "\n=== Non-Functional Requirements ==="
cat projects/$PROJECT/artifacts/prd.json | jq '.nonFunctionalRequirements[] | "\(.id) [\(.category)]: \(.description)"'
```

### View User Stories
```bash
PROJECT="task-manager"

cat projects/$PROJECT/artifacts/prd.json | jq '.userStories[] | {
  id,
  story: "As a \(.asA), I want \(.iWant), so that \(.soThat)",
  requirements: .requirementIds
}'
```

### View Architecture Components
```bash
PROJECT="task-manager"

echo "=== Components ==="
cat projects/$PROJECT/artifacts/architecture.json | jq '.components[] | {
  id,
  name,
  type,
  technologies,
  apiCount: (.apis | length)
}'
```

### View Data Models
```bash
PROJECT="task-manager"

cat projects/$PROJECT/artifacts/architecture.json | jq '.dataModels[] | {
  name,
  fieldCount: (.fields | length),
  relationships: (.relationships | map(.type))
}'
```

### View API Contracts
```bash
PROJECT="task-manager"

cat projects/$PROJECT/artifacts/architecture.json | jq '.apiContracts.endpoints[] | {
  endpoint: "\(.method) \(.path)",
  summary,
  requirements: .requirementIds
}'
```

## Example 5: Cost Tracking

### View AI Call History
```bash
PROJECT="task-manager"

echo "=== AI Call History ==="
cat projects/$PROJECT/.vocabotics/ai_calls.jsonl | jq '{
  task: .task_type,
  model,
  tokens: .usage.total_tokens,
  cost: .cost_usd,
  duration: (.duration_ms / 1000)
}'
```

### Calculate Total Cost
```bash
PROJECT="task-manager"

echo "Total Cost:"
cat projects/$PROJECT/.vocabotics/ai_calls.jsonl | jq -s 'map(.cost_usd) | add'

echo "Total Tokens:"
cat projects/$PROJECT/.vocabotics/ai_calls.jsonl | jq -s 'map(.usage.total_tokens) | add'
```

## Example 6: Comparing Multiple Projects

```bash
# List all projects with stats
for project in projects/*/; do
  name=$(basename "$project")
  echo "=== $name ==="
  python3 -m vocabotics.cli status "$name"
  echo ""
done
```

## Tips and Tricks

### 1. Pretty Print JSON
```bash
# Install jq for better JSON viewing
sudo apt-get install jq  # Ubuntu/Debian
brew install jq          # macOS

# Use jq to explore
cat projects/my-app/artifacts/prd.json | jq .
```

### 2. Save API Key in Shell Profile
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export ANTHROPIC_API_KEY="your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### 3. Create Alias for Convenience
```bash
# Add to ~/.bashrc or ~/.zshrc
alias vb='python3 -m vocabotics.cli'

# Then use:
vb create my-app
vb generate-prd my-app "vision"
vb status my-app
```

### 4. Backup Projects
```bash
# Backup all projects
tar -czf vocabotics-backup-$(date +%Y%m%d).tar.gz projects/

# Restore
tar -xzf vocabotics-backup-20250115.tar.gz
```

### 5. Export to Other Formats

```bash
# Convert PRD to Markdown
cat projects/my-app/artifacts/prd.json | jq -r '
  "# \(.title)\n\n",
  "## Functional Requirements\n\n",
  (.functionalRequirements[] | "- **\(.id)**: \(.description)\n")
' > prd.md

# Export requirements to CSV
cat projects/my-app/artifacts/prd.json | jq -r '
  ["ID", "Type", "Priority", "Description"],
  (.functionalRequirements[] | [.id, .type, .priority, .description]),
  (.nonFunctionalRequirements[] | [.id, .type, .priority, .description])
  | @csv
' > requirements.csv
```

## Troubleshooting

### Error: "Project 'xyz' not found"
```bash
# Make sure project exists
python3 -m vocabotics.cli list

# Create if missing
python3 -m vocabotics.cli create xyz
```

### Error: "ANTHROPIC_API_KEY environment variable not set"
```bash
# Set temporarily
export ANTHROPIC_API_KEY='your-key'

# Or pass inline
ANTHROPIC_API_KEY='your-key' python3 -m vocabotics.cli generate-prd ...
```

### JSON Parsing Errors
Sometimes the AI generates malformed JSON. You can:

1. Retry the generation
2. Manually fix the JSON file
3. Check the raw content in ai_calls.jsonl

### State Machine Issues
If workflow gets stuck:

```bash
# View current state
cat projects/my-app/.vocabotics/state.json | jq .current_state

# Manually edit state if needed
# Edit projects/my-app/.vocabotics/state.json
```

## Next Steps

After generating PRD and Architecture, you can:

1. **Export to Documentation**: Convert JSON to Markdown/PDF
2. **Import to Project Tools**: Use the structured data in Jira, Linear, etc.
3. **Generate Code**: Extend the CLI to generate actual code files
4. **CI/CD Integration**: Use in automated workflows
5. **Team Review**: Share the JSON files for review and approval

## Full Workflow Example

```bash
#!/bin/bash
# Complete workflow script

PROJECT="my-saas-app"
VISION="A project management tool for remote teams"

# Set API key
export ANTHROPIC_API_KEY='your-key-here'

# Create project
python3 -m vocabotics.cli create "$PROJECT"

# Generate PRD
python3 -m vocabotics.cli generate-prd "$PROJECT" "$VISION" \
  --audience "Remote teams, project managers" \
  --features "Task tracking, Team collaboration, Time tracking" \
  --constraints "GDPR compliant, Mobile responsive"

# Show PRD summary
echo "=== PRD Generated ==="
cat "projects/$PROJECT/artifacts/prd.json" | jq '{
  title,
  requirements: (.functionalRequirements | length),
  stories: (.userStories | length)
}'

# Generate Architecture
python3 -m vocabotics.cli generate-arch "$PROJECT" \
  --frontend "React,TypeScript,TailwindCSS" \
  --backend "Node.js,Express,TypeScript" \
  --database "PostgreSQL,Prisma"

# Show Architecture summary
echo "=== Architecture Generated ==="
cat "projects/$PROJECT/artifacts/architecture.json" | jq '{
  components: (.components | length),
  dataModels: (.dataModels | length),
  apiEndpoints: (.apiContracts.endpoints | length)
}'

# Show total cost
echo "=== Total Cost ==="
cat "projects/$PROJECT/.vocabotics/ai_calls.jsonl" | jq -s 'map(.cost_usd) | add'

echo "✓ Complete! Check projects/$PROJECT/ for all artifacts"
```
