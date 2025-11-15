# 📘 Vocabotics User Guide

**Version:** 1.0
**Last Updated:** 2025-11-15
**Audience:** End Users

---

## Welcome to Vocabotics! 🚀

Vocabotics is an AI-powered software development platform that transforms your vision into production-ready applications. Unlike traditional development approaches that require constant iteration, Vocabotics uses **orchestration** to generate complete, high-quality code in a single pass.

### What Makes Vocabotics Different?

- **Orchestration > Iteration**: Generate complete applications, not fragments
- **ISO Compliance**: Built-in ISO 9001, ISO 12207, and WCAG 2.1 compliance
- **Full Traceability**: Every UI element linked to backend logic and database operations
- **Production-Ready**: Generated code includes tests, documentation, and deployment configs
- **Quality Assurance**: Automated testing, visual validation, and compliance checks

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Your First Project](#creating-your-first-project)
3. [Understanding the Workflow](#understanding-the-workflow)
4. [Reviewing the PRD](#reviewing-the-prd)
5. [Reviewing Architecture](#reviewing-architecture)
6. [Monitoring Implementation](#monitoring-implementation)
7. [Quality Dashboard](#quality-dashboard)
8. [Testing Dashboard](#testing-dashboard)
9. [Integration Map](#integration-map)
10. [Managing Projects](#managing-projects)
11. [Account Settings](#account-settings)
12. [Subscription & Billing](#subscription--billing)
13. [Best Practices](#best-practices)
14. [FAQ](#faq)
15. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating an Account

1. Navigate to [https://vocabotics.com](https://vocabotics.com)
2. Click **Sign Up**
3. Enter your email, name, and password
4. Verify your email address
5. Complete your profile

### Choosing a Plan

Vocabotics offers three subscription tiers:

| Plan | Projects | AI Calls/Month | Price |
|------|----------|----------------|-------|
| **Starter** | 3 | 1,000 | $29/mo |
| **Professional** | 10 | 5,000 | $99/mo |
| **Enterprise** | Unlimited | 20,000 | $299/mo |

**Tip:** Start with the Starter plan to explore the platform. You can upgrade anytime.

### Dashboard Overview

After logging in, you'll see your **Dashboard** with:

- **Project List**: All your projects with status indicators
- **Recent Activity**: Latest workflow events
- **Usage Metrics**: AI calls used this month
- **Quick Actions**: Create project, view documentation

---

## Creating Your First Project

### Step 1: Start a New Project

1. Click **New Project** from the dashboard
2. You'll enter a 4-step wizard:
   - Vision
   - Features
   - Tech Stack
   - Review

### Step 2: Define Your Vision

**Project Vision** is the heart of Vocabotics. Be clear and detailed.

**Example - Good Vision:**

```
Name: TaskMaster Pro

Description: A modern task management application for remote teams.
Users can create projects, assign tasks, track progress with Kanban
boards, and receive real-time notifications. The app should support
team collaboration, file attachments, comments, and time tracking.

Target Audience: Remote teams of 5-50 people, project managers, and
freelancers who need to coordinate work across time zones.
```

**Example - Too Vague (Avoid):**

```
Name: App

Description: Make an app for tasks

Target Audience: People
```

**Tips for a Great Vision:**
- Be specific about functionality
- Mention target users clearly
- Include key workflows (e.g., "Users should be able to...")
- Specify collaboration needs
- Mention any integrations (Slack, Google Drive, etc.)

### Step 3: Add Key Features

List 5-15 key features your application must have.

**Example Features for TaskMaster Pro:**

1. User authentication with email/password and Google OAuth
2. Create and manage multiple projects
3. Kanban board with drag-and-drop task management
4. Task assignment to team members
5. Real-time notifications for task updates
6. File attachments on tasks (images, PDFs, documents)
7. Comment threads on tasks
8. Time tracking per task
9. Dashboard with progress metrics
10. Mobile-responsive design

**Tips:**
- Start with core features (auth, main workflow)
- Add collaboration features (comments, sharing)
- Include reporting/analytics if needed
- Don't forget mobile responsiveness

### Step 4: Choose Tech Stack

Vocabotics supports multiple technology stacks:

**Frontend Options:**
- React (Recommended - modern, component-based)
- Vue (Alternative - progressive framework)

**Backend Options:**
- Express (Recommended - flexible, widely used)
- Fastify (Alternative - performance-focused)

**Database Options:**
- PostgreSQL (Recommended - robust, feature-rich)
- MySQL (Alternative - traditional, reliable)

**Default Recommendation:** React + Express + PostgreSQL

**Note:** Vocabotics itself uses React + Express + PostgreSQL (dogfooding principle).

### Step 5: Review & Create

Review all your inputs:
- Project vision
- Key features
- Tech stack choices

Click **Create Project** to start the AI orchestration process.

---

## Understanding the Workflow

Once you create a project, Vocabotics follows a **4-phase workflow**:

### Phase 1: Requirements (PRD Generation)

**Duration:** 2-5 minutes

Vocabotics uses Claude Sonnet 4.5 to transform your vision into a comprehensive **Product Requirements Document (PRD)** including:

- Executive summary
- Target audience analysis
- Functional requirements (prioritized)
- Non-functional requirements (performance, security, scalability)
- User stories with acceptance criteria
- Success metrics
- Risk assessment
- ISO 9001 and ISO 12207 compliance

**What You'll See:**
- Real-time progress: "Generating PRD..."
- Event log showing AI reasoning
- Completion notification

**Next Step:** Review PRD (see [Reviewing the PRD](#reviewing-the-prd))

### Phase 2: Architecture Design

**Duration:** 3-7 minutes

Vocabotics designs the complete system architecture:

- Architecture style (e.g., MVC, microservices)
- Component breakdown with responsibilities
- Database schema (Prisma models)
- API specification (OpenAPI 3.0)
- Security architecture
- Scalability strategies
- Deployment architecture

**What You'll See:**
- "Designing architecture..."
- Component discovery
- Database schema generation
- API endpoint generation

**Next Step:** Review Architecture (see [Reviewing Architecture](#reviewing-architecture))

### Phase 3: Code Generation

**Duration:** 5-15 minutes (depending on complexity)

Vocabotics generates complete, production-ready code:

**Frontend:**
- React components with TypeScript
- Routing (React Router)
- State management (Zustand)
- API integration
- Responsive layouts (Tailwind CSS)
- **Vocabotics tags** for traceability

**Backend:**
- Express API routes
- Controllers and services
- Prisma database queries
- Authentication & authorization
- Input validation (Zod)
- Error handling

**Tests:**
- Unit tests (Jest/Vitest)
- Integration tests
- Test coverage >95%

**Configuration:**
- package.json with dependencies
- TypeScript configuration
- ESLint and Prettier
- Docker configuration
- GitHub Actions CI/CD
- README and documentation

**What You'll See:**
- "Generating frontend components..."
- "Generating backend services..."
- "Generating tests..."
- File creation progress

### Phase 4: Testing & Validation

**Duration:** 3-10 minutes

Vocabotics validates the generated code:

- Run unit tests
- Run integration tests
- Execute visual regression tests (Puppeteer)
- Calculate code quality metrics
- Generate traceability matrix
- Validate ISO compliance

**What You'll See:**
- "Running tests..."
- Test results (passed/failed)
- Coverage metrics
- Quality score

**Final Step:** Project marked as **Completed** ✅

---

## Reviewing the PRD

After Phase 1 completes, review your Product Requirements Document.

### Accessing the PRD

1. Click **Review PRD** button in the workflow
2. Or navigate to **Projects > [Your Project] > PRD**

### PRD Sections

**1. Vision & Overview**
- Product vision statement
- Executive summary
- Project scope

**2. Target Audience**
- Primary audience
- Secondary audience
- User personas

**3. Functional Requirements**
Each requirement includes:
- ID (e.g., FR-001)
- Title
- Description
- Priority (High/Medium/Low)
- Category (Authentication, Core Functionality, etc.)

**Example:**
```
FR-001: User Authentication
Priority: High
Category: Authentication
Description: Users must be able to register with email/password
and sign in securely. Support password reset via email.
```

**4. Non-Functional Requirements**
- Performance (response times, throughput)
- Security (encryption, authentication)
- Scalability (concurrent users)
- Reliability (uptime, error rates)
- Compliance (GDPR, WCAG 2.1)

**5. User Stories**
Each story includes:
- As a [user type]
- I want to [action]
- So that [benefit]
- Acceptance criteria

**Example:**
```
As a project manager
I want to create tasks and assign them to team members
So that work is clearly distributed and tracked

Acceptance Criteria:
✓ Can create task with title, description, due date
✓ Can assign task to one or more team members
✓ Assigned users receive notifications
✓ Task appears in assignee's task list
```

**6. Success Metrics**
- User adoption targets
- Performance benchmarks
- Quality thresholds

**7. Risks & Mitigations**
- Identified risks
- Probability and impact
- Mitigation strategies

**8. Compliance Standards**
- ISO 9001:2015
- ISO/IEC 12207
- WCAG 2.1 Level AA

### Approving the PRD

1. Read through all sections carefully
2. Verify requirements match your vision
3. Check that all key features are included
4. Click **Approve & Continue** to proceed to Architecture

**Can I Request Changes?**
Currently, PRD approval is final. Future versions will support iterative refinement. For now:
- Review carefully before approving
- Ensure your initial vision was comprehensive
- Contact support if critical requirements are missing

---

## Reviewing Architecture

After approving the PRD, review the system architecture.

### Accessing Architecture

1. Click **Review Architecture** in workflow
2. Or navigate to **Projects > [Your Project] > Architecture**

### Architecture Sections

**1. Overview**
- Architecture style (e.g., "Layered MVC Architecture")
- Design principles (SOLID, DRY, KISS)
- High-level structure

**2. Technology Stack**
- Frontend framework and libraries
- Backend framework and middleware
- Database and ORM
- Caching solution
- Authentication method

**3. Components**

Each component includes:
- Name
- Responsibilities
- Dependencies
- API endpoints (for backend)

**Example Frontend Component:**
```
TaskBoard Component
Responsibilities:
- Display tasks in Kanban columns
- Handle drag-and-drop task movement
- Update task status on drop
- Fetch tasks from API

Dependencies:
- React DnD library
- Task API service
- Zustand task store
```

**Example Backend Component:**
```
Task Service
Responsibilities:
- Create, read, update, delete tasks
- Validate task data
- Handle task assignments
- Send notifications on updates

Dependencies:
- Prisma ORM
- Notification service
- Validation schemas (Zod)
```

**4. Data Models**

Complete database schema with:
- Model name
- Fields (name, type, required, description)
- Relationships (one-to-many, many-to-many)

**Example:**
```
Task Model
Fields:
- id: UUID (required) - Unique identifier
- title: String (required) - Task title
- description: Text (optional) - Detailed description
- status: Enum (required) - pending/in-progress/completed
- priority: Enum (required) - low/medium/high
- dueDate: DateTime (optional) - Due date
- assignedToId: UUID (optional) - Assigned user ID
- projectId: UUID (required) - Parent project ID
- createdAt: DateTime (required) - Creation timestamp
- updatedAt: DateTime (required) - Last update timestamp

Relationships:
- assignedTo → User (many-to-one)
- project → Project (many-to-one)
- comments → Comment[] (one-to-many)
```

**5. Security**
- Authentication strategy (JWT, OAuth)
- Authorization model (RBAC)
- Data protection (encryption, sanitization)
- Vulnerability mitigation (XSS, SQL injection, CSRF)

**6. Scalability**
- Horizontal scaling strategy
- Vertical scaling options
- Caching layer (Redis)
- Load balancing

**7. Deployment**
- Recommended hosting (Vercel, Railway, etc.)
- CI/CD pipeline (GitHub Actions)
- Monitoring and logging

### Approving Architecture

1. Review component breakdown
2. Verify data models match requirements
3. Check security measures
4. Click **Approve & Continue** to start code generation

---

## Monitoring Implementation

Track code generation and testing in real-time.

### Workflow Page

Navigate to **Projects > [Your Project] > Workflow**

**Real-Time Updates:**
- Current phase indicator
- Progress percentage
- Live event log
- Artifact generation status

**Event Log** shows:
```
[10:23:45] Starting code generation...
[10:24:12] Generated frontend component: TaskBoard.tsx
[10:24:15] Generated frontend component: TaskCard.tsx
[10:24:18] Generated backend service: task.service.ts
[10:24:22] Generated API route: task.routes.ts
[10:24:45] Generated database migration: 001_create_tasks.sql
[10:25:10] Running tests...
[10:25:45] Unit tests: 45/45 passed ✓
[10:26:00] Integration tests: 12/12 passed ✓
[10:26:30] Code generation complete!
```

**Artifacts Generated:**

Each artifact has a **Download** button:

- **PRD** (JSON) - Product Requirements Document
- **Architecture** (JSON) - System architecture
- **Schema** (Prisma) - Database schema
- **API Spec** (OpenAPI 3.0) - API documentation
- **Code** (ZIP) - Complete codebase
- **Tests** (included in code ZIP)

**Approval Workflow:**

For each phase:
1. ✅ **Approved** - Moved to next phase
2. ⏳ **Pending** - Awaiting your review
3. 🔄 **In Progress** - AI is working

---

## Quality Dashboard

Monitor code quality, test coverage, and compliance.

### Accessing Quality Metrics

Navigate to **Projects > [Your Project] > Quality**

### Overall Quality Score

**Weighted Score (0-100):**
- Test Coverage: 40%
- Code Quality: 30%
- Requirement Coverage: 20%
- Security: 10%

**Score Interpretation:**
- **90-100**: Excellent (green)
- **80-89**: Good (green)
- **60-79**: Acceptable (yellow)
- **<60**: Needs Improvement (red)

### Test Coverage

**Metrics Tracked:**
- **Lines**: Percentage of code lines covered by tests
- **Statements**: Percentage of statements executed
- **Functions**: Percentage of functions tested
- **Branches**: Percentage of code branches tested

**Example:**
```
Line Coverage: 96.5%
Statement Coverage: 95.2%
Function Coverage: 98.1%
Branch Coverage: 92.3%
```

**Goal:** All metrics >95%

### Code Quality

**Metrics:**
- Total files generated
- Total lines of code
- **Vocabotics Tag Coverage**: % of components with traceability tags

**Example:**
```
Files: 87
Lines of Code: 12,456
Vocabotics Tag Coverage: 100%
```

**Vocabotics Tags** enable complete traceability from UI to database.

### Requirement Coverage

**Metrics:**
- Total requirements (from PRD)
- Implemented requirements
- Tested requirements
- Coverage percentage

**Example:**
```
Total Requirements: 32
Implemented: 32 (100%)
Tested: 31 (96.9%)
Missing Tests: FR-018 (Email notifications)
```

### Security Metrics

- Security vulnerabilities found
- Compliance with OWASP Top 10
- Encryption standards met

### Actions

**Calculate Quality**
Click to re-calculate metrics after code changes.

**Download Report**
Export quality report as PDF or JSON.

---

## Testing Dashboard

View test execution results and visual regression tests.

### Accessing Testing

Navigate to **Projects > [Your Project] > Testing**

### Test Execution Results

**Test Types:**
1. **Unit Tests** - Individual function/component tests
2. **Integration Tests** - Multi-component interaction tests
3. **End-to-End Tests** - Complete user journey tests
4. **Visual Tests** - Screenshot regression tests

**For Each Test Run:**
- Status (Passed/Failed/Running)
- Total tests
- Passed tests (green count)
- Failed tests (red count)
- Duration
- Coverage metrics

**Example:**
```
Unit Tests
Status: Passed ✓
Total: 45 | Passed: 45 | Failed: 0
Duration: 3.2s
Coverage: Lines 96.5% | Statements 95.2%
```

### Failed Tests

If tests fail, see:
- Test name
- Error message
- Stack trace (expandable)
- Duration

**Example:**
```
✗ TaskService.createTask should validate required fields

Error: Expected validation error for missing title

Stack Trace:
  at TaskService.createTask (task.service.ts:45)
  at test/task.service.test.ts:23

Duration: 15ms
```

### Visual Regression Tests

**Screenshot Comparison:**
- **Baseline**: Original screenshot
- **Current**: Latest screenshot
- **Diff**: Highlighted differences

**For Each Visual Test:**
- Element tested (e.g., "TaskBoard - Desktop 1920x1080")
- Viewport size
- Status (Passed/Failed/New)
- Mismatch percentage (if failed)
- Screenshots (click to view)

**Viewing Comparisons:**
Click on any visual test to see:
- Side-by-side baseline vs. current
- Diff image highlighting changes
- Mismatch percentage

**Actions:**

**Run All Tests**
Re-execute all test suites.

**Run Specific Test Type**
Run only unit, integration, e2e, or visual tests.

---

## Integration Map

Visualize complete traceability from frontend to backend to database.

### Accessing Integration Map

Navigate to **Projects > [Your Project] > Integration Map**

### Understanding the Map

**Elements** are categorized by layer:
- 🔵 **Frontend** (React components)
- 🟢 **Backend** (API routes, services)
- 🟣 **Database** (Tables, queries)

**Relationships** show:
- **Calls**: Frontend → Backend API
- **Queries**: Backend → Database
- **Renders**: Component hierarchy
- **Tests**: Test → Code

### Using the Map

**Search:**
Type element name or Vocabotics ID to find specific elements.

**Filter by Layer:**
- Show only Frontend
- Show only Backend
- Show only Database
- Show all layers

**Element Details:**

Click any element to see:
- Vocabotics ID (e.g., `vocabotics-cmp-TaskBoard-9a8f`)
- Element name
- Type (Component, Service, Table, etc.)
- File path
- Linked requirements (from PRD)

**Related Elements:**

**Outgoing Relationships:**
Elements this component interacts with.

**Example:**
```
TaskBoard Component calls:
→ GET /api/tasks (Backend API)
→ PATCH /api/tasks/:id (Backend API)

TaskBoard Component renders:
→ TaskCard Component
→ LoadingSpinner Component
```

**Incoming Relationships:**
Elements that interact with this component.

**Example:**
```
GET /api/tasks is called by:
← TaskBoard Component
← TaskList Component

GET /api/tasks queries:
→ Task table (Database)
```

### Coverage Summary

**Overall Integration Coverage:**
- Total elements: 256
- Mapped elements: 256 (100%)
- Unmapped elements: 0

### Why Integration Map Matters

**Benefits:**
1. **Impact Analysis**: See what breaks when you change code
2. **Requirement Tracing**: Verify all requirements are implemented
3. **Debugging**: Track data flow from UI click to database
4. **Documentation**: Visual system documentation
5. **Compliance**: ISO 12207 traceability requirement

---

## Managing Projects

### Project List

View all projects from the **Dashboard** or **Projects** page.

**Each Project Shows:**
- Project name
- Current status
- Progress percentage
- Last updated time
- Quick actions (View, Delete)

**Project Statuses:**
- 🔵 **Created** - Project initialized
- 🟡 **PRD Generation** - Generating requirements
- 🟢 **PRD Review** - Awaiting your PRD approval
- 🟡 **Architecture Generation** - Designing system
- 🟢 **Architecture Review** - Awaiting architecture approval
- 🟡 **Code Generation** - Generating code
- 🟡 **Testing** - Running tests
- ✅ **Completed** - Ready to download
- ❌ **Failed** - Error occurred

### Downloading Your Code

1. Navigate to project **Workflow** page
2. Click **Download** next to "Code" artifact
3. Extract ZIP file
4. Follow README.md for setup instructions

**What's Included:**
```
your-project/
├── frontend/          # React application
│   ├── src/
│   ├── package.json
│   └── README.md
├── backend/           # Express API
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── README.md
├── .github/
│   └── workflows/     # CI/CD pipelines
├── docker-compose.yml
└── README.md          # Setup instructions
```

### Deleting Projects

**Warning:** Deletion is permanent and cannot be undone.

1. Go to **Projects**
2. Click **Delete** on the project
3. Confirm deletion
4. Project and all artifacts are removed

**Tip:** Download code before deleting if you want to keep it.

---

## Account Settings

### Profile Settings

Navigate to **Settings** from the sidebar.

**Update:**
- Name
- Email
- Password

**Danger Zone:**
- Delete account (permanent)

### API Keys (BYOK - Bring Your Own Key)

Use your own OpenRouter or Anthropic API keys.

**Benefits:**
- No AI call limits
- Direct billing from OpenRouter/Anthropic
- Full control over AI costs

**Adding an API Key:**

1. Go to **Settings > API Keys**
2. Click **Add Key**
3. Choose provider:
   - OpenRouter (supports multiple models)
   - Anthropic (Claude models only)
4. Paste your API key
5. Click **Save**

**Security:**
- Keys encrypted with AES-256
- Never stored in plaintext
- Never exposed in logs

**Using Your Key:**

When creating a project, select:
- "Use my API key" (BYOK)
- "Use Vocabotics credits" (default)

### Notifications

**Email Notifications:**
- Project completion
- Test failures
- System updates

**Webhook Notifications:**
Add webhook URL to receive events via HTTP POST.

---

## Subscription & Billing

### Viewing Subscription

Navigate to **Settings > Billing**

**Current Plan Shows:**
- Plan name (Starter/Professional/Enterprise)
- AI calls used this month
- AI calls remaining
- Renewal date

### Upgrading/Downgrading

**To Upgrade:**
1. Go to **Settings > Billing**
2. Click **Upgrade Plan**
3. Select new plan
4. Enter payment details
5. Confirm upgrade

**Upgrade Timing:**
- Takes effect immediately
- Pro-rated billing

**To Downgrade:**
1. Click **Change Plan**
2. Select lower tier
3. Confirm downgrade
4. Takes effect at next billing cycle

### Payment Methods

**Supported:**
- Credit/Debit cards (Visa, Mastercard, Amex)
- ACH bank transfer (Enterprise only)

**Managing Payment:**
1. Go to **Settings > Billing**
2. Click **Update Payment Method**
3. Enter new card details
4. Click **Save**

### Billing Portal

Access Stripe Customer Portal for:
- View invoices
- Download receipts
- Update billing info
- Cancel subscription

Click **Manage Billing** in Settings.

### Canceling Subscription

1. Go to **Settings > Billing**
2. Click **Cancel Subscription**
3. Confirm cancellation
4. Access continues until end of billing period

**After Cancellation:**
- Existing projects remain accessible
- Cannot create new projects
- AI call quota frozen

---

## Best Practices

### Writing Effective Visions

**DO:**
- ✅ Be specific about functionality
- ✅ Include user workflows ("Users should be able to...")
- ✅ Mention target audience clearly
- ✅ List integration requirements
- ✅ Specify data requirements (what data is stored)

**DON'T:**
- ❌ Use vague descriptions ("Make it cool")
- ❌ List only tech stack ("Use React and Node")
- ❌ Forget authentication/authorization
- ❌ Assume AI knows your domain

### Feature Prioritization

**Start with Core Features:**
1. Authentication (if needed)
2. Main workflow (core functionality)
3. Data management (CRUD)
4. User interface (key pages)

**Then Add:**
5. Collaboration features
6. Notifications
7. Reporting/analytics
8. Integrations

### Reviewing PRDs

**Check:**
- ✅ All key features are included as requirements
- ✅ User stories match your workflows
- ✅ Non-functional requirements are realistic
- ✅ Target audience is correct

### Reviewing Architecture

**Verify:**
- ✅ Data models match your domain
- ✅ Component breakdown is logical
- ✅ Security measures are appropriate
- ✅ Tech stack matches your choice

### Code Review

**Before Deployment:**
1. Download generated code
2. Review critical files (auth, payments)
3. Check environment variables
4. Verify database migrations
5. Test locally with Docker Compose

---

## FAQ

### General Questions

**Q: How long does project generation take?**
A: Typically 15-30 minutes for a complete project, depending on complexity.

**Q: Can I edit the generated code?**
A: Yes! Download the code and modify it as needed. It's yours to keep.

**Q: What if I don't like the generated code?**
A: You can create a new project with a refined vision. Future versions will support iterative refinement.

**Q: Can I deploy generated code to production?**
A: Yes! Code is production-ready with tests, security, and deployment configs.

### Technical Questions

**Q: What AI models does Vocabotics use?**
A: Primarily Claude Sonnet 4.5 via OpenRouter. Visual testing uses Claude Vision.

**Q: Can I use my own AI API key?**
A: Yes! Add your OpenRouter or Anthropic key in Settings > API Keys.

**Q: What databases are supported?**
A: PostgreSQL (recommended) and MySQL.

**Q: Can I integrate with existing code?**
A: Generated code is standalone. Integration with existing codebases requires manual work.

**Q: Does Vocabotics generate mobile apps?**
A: Currently only web applications. Mobile app support coming soon.

### Billing Questions

**Q: What counts as an "AI call"?**
A: Each interaction with the AI (PRD generation, architecture, code generation, etc.) counts as one call. A typical project uses 10-15 calls.

**Q: Can I get a refund?**
A: 30-day money-back guarantee if you're not satisfied.

**Q: Do unused AI calls roll over?**
A: No, AI calls reset monthly.

**Q: Can I purchase additional AI calls?**
A: Yes! $10 per 100 calls. Or use BYOK for unlimited calls.

---

## Troubleshooting

### Login Issues

**Can't log in:**
1. Verify email and password
2. Check for typos
3. Try password reset
4. Clear browser cache and cookies

**Forgot password:**
1. Click "Forgot Password" on login
2. Enter email
3. Check inbox for reset link
4. Follow link to create new password

### Project Creation Issues

**Project stuck on "Creating...":**
1. Refresh the page
2. Check AI call quota (Settings > Billing)
3. Wait 5 minutes (high load)
4. Contact support if still stuck

**"Insufficient AI calls":**
- Upgrade plan or wait for monthly reset
- Add BYOK (Bring Your Own Key)

### Code Download Issues

**Can't download code:**
1. Check that project status is "Completed"
2. Try a different browser
3. Disable browser extensions
4. Check internet connection

**ZIP file won't extract:**
1. Verify complete download (check file size)
2. Try a different extraction tool
3. Re-download if corrupted

### Quality/Testing Issues

**Tests showing as failed:**
1. Review failed test details
2. This might indicate edge cases to consider
3. Download code and fix manually
4. Contact support for analysis

**Low quality score:**
1. Review which metrics are low
2. Check requirement coverage
3. Re-generate project with clearer vision

### Support

**Need Help?**
- 📧 Email: support@vocabotics.com
- 💬 Live Chat: vocabotics.com (bottom right)
- 📖 Documentation: docs.vocabotics.com
- 🐛 Bug Reports: GitHub Issues

**Response Times:**
- Starter: 48 hours
- Professional: 24 hours
- Enterprise: 4 hours + dedicated support

---

## What's Next?

### After Your First Project

1. **Deploy to Production**
   - Follow DEPLOYMENT_GUIDE.md
   - Use Vercel (frontend) + Railway (backend)
   - Set up domain and SSL

2. **Customize Your Code**
   - Add company branding
   - Implement business logic
   - Add integrations

3. **Create More Projects**
   - Iterate on your vision
   - Try different tech stacks
   - Build complementary apps

### Learning Resources

- **Tutorial Videos**: youtube.com/vocabotics
- **Blog**: blog.vocabotics.com
- **Community**: community.vocabotics.com

### Roadmap

**Coming Soon:**
- Mobile app generation (React Native)
- Iterative refinement (chat with AI)
- Multi-language support
- AI model selection (GPT-4, Gemini)
- Team collaboration features

---

## Conclusion

You're now ready to transform your ideas into production-ready applications with Vocabotics!

**Remember:**
- Start with a clear, detailed vision
- Review PRD and Architecture carefully
- Download and test your code
- Deploy with confidence

**Happy Building!** 🚀

---

**User Guide Version 1.0**
**Last Updated:** 2025-11-15
**Feedback:** feedback@vocabotics.com
