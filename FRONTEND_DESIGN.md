# 🎨 Vocabotics Frontend Design
## UI/UX Specifications & Component Architecture

**Version:** 1.0
**Date:** 2025-11-14
**Platform:** Web (Desktop), with Mobile & VR future support

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Component Architecture](#component-architecture)
3. [Page Designs](#page-designs)
4. [Design System](#design-system)
5. [Animations & Interactions](#animations--interactions)
6. [Responsive Design](#responsive-design)
7. [Accessibility](#accessibility)

---

## Design Philosophy

### Core Principles

**1. Dopamine-Inducing**
Every interaction should feel rewarding. Progress is celebrated, completions are satisfying, and the interface responds with personality.

**2. Beautiful Simplicity (KISS)**
- Clean, minimal interfaces
- Progressive disclosure: show what's needed, hide complexity
- One primary action per screen
- Natural language over technical jargon

**3. Real-time Feedback**
- No mysterious loading spinners
- Show exactly what's happening
- Animated progress that feels alive
- Instant response to user actions

**4. Enchanting Experience**
- Smooth 60fps animations
- Thoughtful micro-interactions
- Visual hierarchy that guides the eye
- Delightful surprises (achievements, celebrations)

---

## Component Architecture

### Application Structure

```
App
├── AuthShell (unauthenticated)
│   ├── LoginPage
│   ├── RegisterPage
│   └── ForgotPasswordPage
│
└── AppShell (authenticated)
    ├── Sidebar
    ├── TopBar
    └── Routes
        ├── Dashboard
        ├── ProjectWorkspace
        │   ├── VisionInput
        │   ├── PRDReview
        │   ├── ArchitectureViewer
        │   ├── ImplementationMonitor
        │   ├── TestingDashboard
        │   └── DeploymentPanel
        ├── IntegrationMapViewer
        ├── QualityDashboard
        └── Settings
```

### Component Hierarchy

```typescript
// Core Layout Components
<AppShell>
  <Sidebar />
  <MainContent>
    <TopBar />
    <PageContent />
  </MainContent>
</AppShell>

// Project Workspace
<ProjectWorkspace projectId={id}>
  <PhaseIndicator currentPhase={phase} />
  <ContentArea>
    {/* Dynamic based on phase */}
  </ContentArea>
  <ActionBar />
</ProjectWorkspace>

// Visualization Components
<SystemMap>
  <ArchitectureGraph />
  <ElementDetails />
  <DependencyFlow />
</SystemMap>

<IntegrationMap>
  <ElementExplorer />
  <TraceabilityView />
  <ImpactAnalyzer />
</IntegrationMap>

// Progress & Feedback
<GenerationProgress>
  <AIModelIndicator />
  <ProgressAnimation />
  <EstimatedTime />
  <LiveLog />
</GenerationProgress>
```

---

## Page Designs

### 1. Dashboard (Home)

**Purpose**: Overview of all projects and quick actions

```
┌─────────────────────────────────────────────────────────────────┐
│  [Vocabotics Logo]                    [User Menu] [Notifications]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Welcome back, Alex! 👋                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                   │
│  🚀 Quick Actions                                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  + New Project│  │  📋 Templates │  │  💡 Examples  │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                   │
│  📊 Your Projects                          [Filter ▼] [Search 🔍]│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ E-commerce Platform                        [In Progress] ⚡  │ │
│  │ ▓▓▓▓▓▓▓▓▓░░░░░░░░░ 65%                                     │ │
│  │ Current: Implementation • Quality: 94% • Tests: 97%         │ │
│  │ [Continue →]                                                 │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ SaaS Dashboard                              [Testing] 🧪     │ │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░ 85%                                      │ │
│  │ Current: Testing • Quality: 98% • Tests: 100%              │ │
│  │ [Continue →]                                                 │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Mobile App Backend                         [Ready] ✓         │ │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%                                     │ │
│  │ Quality: 96% • All tests passing • Ready to deploy         │ │
│  │ [Deploy →]                                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  📈 Stats This Month                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ 3 Projects  │ │ 47 AI Calls │ │ $12.34 Cost │              │
│  │ Created     │ │ (vs 1,200   │ │ (96% saved) │              │
│  │             │ │  iterative) │ │             │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Project cards with real-time progress
- Visual quality indicators
- Quick actions prominently displayed
- AI efficiency stats (savings vs iterative tools)

### 2. Project Workspace - Vision Input

**Purpose**: Capture user's vision for the project

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard         E-commerce Platform                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 1: Share Your Vision 💡                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                   │
│  Tell us what you want to build. Be as detailed or as high-     │
│  level as you like - our AI will handle the rest.               │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📝 Your Vision                                             │  │
│  │                                                            │  │
│  │ I want to build a modern e-commerce platform with:        │  │
│  │ - AI-powered product recommendations                      │  │
│  │ - Real-time inventory management                          │  │
│  │ - Multi-vendor marketplace support                        │  │
│  │ - Stripe payment integration                              │  │
│  │ - Mobile-first responsive design                          │  │
│  │ - Admin dashboard for vendors                             │  │
│  │                                                            │  │
│  │                                                            │  │
│  │ [🎤 Voice Input]                             [AI Suggest ✨]│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  🎯 Optional: Add Context (expand for more)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Target Users: □ B2C  □ B2B  □ Both                        │  │
│  │ Scale: □ MVP  □ Production  □ Enterprise                  │  │
│  │ Timeline: □ Weeks  ☑ Months  □ Long-term                  │  │
│  │ Compliance: ☑ GDPR  ☑ WCAG  □ HIPAA                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  📎 References (optional)                                        │
│  + Add similar apps, design inspiration, or documentation        │
│                                                                   │
│                                                                   │
│                                      [Cancel] [Generate PRD → ]  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Large text area for vision
- Voice input option
- AI suggestions for clarity
- Optional context fields (progressive disclosure)
- Clear next action

### 3. PRD Review

**Purpose**: Review and approve AI-generated PRD

```
┌─────────────────────────────────────────────────────────────────┐
│ E-commerce Platform        Phase: PRD Review         [AI: 1 call]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ✨ PRD Generated! (12 seconds)                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                   │
│  ┌─────────────────┬─────────────────────────────────────────┐  │
│  │ 📑 Sections     │ # E-commerce Platform PRD               │  │
│  │                 │                                         │  │
│  │ ☑ Executive     │ ## Executive Summary                    │  │
│  │   Summary       │ A modern, AI-powered multi-vendor       │  │
│  │                 │ e-commerce platform with real-time      │  │
│  │ ☑ Requirements  │ inventory and Stripe integration.       │  │
│  │   (24)          │                                         │  │
│  │                 │ ## Functional Requirements              │  │
│  │ ☑ User Stories  │                                         │  │
│  │   (18)          │ ### REQ-USER-001: User Registration    │  │
│  │                 │ Users can create accounts with email/   │  │
│  │ ☑ Technical     │ social login. Supports OAuth.           │  │
│  │   Constraints   │ Priority: Critical                      │  │
│  │                 │ Acceptance: User receives verification  │  │
│  │ ☑ Success       │ email within 30 seconds...              │  │
│  │   Metrics       │                                         │  │
│  │                 │ ### REQ-PROD-001: Product Catalog       │  │
│  │ [Download PDF]  │ System displays products with images... │  │
│  └─────────────────┴─────────────────────────────────────────┘  │
│                                                                   │
│  💡 AI Insights                                                  │
│  • 24 functional requirements identified                         │
│  • 8 non-functional requirements (performance, security, etc.)   │
│  • Estimated complexity: Medium-High                             │
│  • Recommended stack: React, Node.js, PostgreSQL                 │
│                                                                   │
│  ✍️ Edit & Refine                                                │
│  [💬 Add requirement] [✏️ Edit inline] [🗑️ Remove section]       │
│                                                                   │
│                        [Regenerate] [Approve & Continue → ]     │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Split view: navigation + content
- AI insights panel
- Inline editing capability
- Quick stats (requirements count)
- Download option

### 4. Implementation Monitor (Real-time)

**Purpose**: Watch AI generate code in real-time

```
┌─────────────────────────────────────────────────────────────────┐
│ E-commerce Platform    Phase: Implementation    [AI: 12 calls]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🎯 Implementation in Progress...                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  System Architecture                                     │    │
│  │                                                          │    │
│  │      ┌──────┐         ┌──────┐        ┌──────┐         │    │
│  │      │ Auth │◄────────│ API  │───────►│  DB  │         │    │
│  │      └──┬───┘         └───┬──┘        └───┬──┘         │    │
│  │         │                 │               │            │    │
│  │         ▼                 ▼               ▼            │    │
│  │    ✅ Complete       ⚡ Building     🕐 Queued        │    │
│  │                                                          │    │
│  │      Frontend          Backend       Database          │    │
│  │    ▓▓▓▓▓▓▓ 100%    ▓▓▓▓░░░ 60%    ░░░░░░░ 0%       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  📦 Current: Backend Module Generation                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ⚙️  Generating ProductService.ts with Haiku...          │    │
│  │                                                          │    │
│  │ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 65%                               │    │
│  │                                                          │    │
│  │ Estimated time remaining: 18 seconds                    │    │
│  │                                                          │    │
│  │ 📝 Live Updates:                                         │    │
│  │  ✅ Created product model with TypeScript interfaces    │    │
│  │  ✅ Generated CRUD operations for products              │    │
│  │  ⚡ Adding validation with Zod schemas...               │    │
│  │  🕐 Generating tests...                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ✅ Completed Modules                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ AuthService.ts         Generated with Sonnet 4.5  [View]│    │
│  │ UserController.ts      Generated with Haiku       [View]│    │
│  │ DatabaseSchema.sql     Generated with Sonnet 4.5  [View]│    │
│  │ Frontend Components    Generated with Sonnet 4.5  [View]│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  📊 Progress: 8/15 modules complete • 156 tags injected          │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Animated architecture visualization
- Real-time progress bars
- Live log of what AI is doing
- Completed modules list
- Model indicator (Sonnet/Haiku/Vision)

### 5. Integration Map Viewer

**Purpose**: Explore complete system traceability

```
┌─────────────────────────────────────────────────────────────────┐
│ Integration Map                              [Search 🔍] [Export]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🗺️  System Traceability                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                   │
│  ┌──────────────────┬──────────────────────────────────────┐    │
│  │ Frontend         │ Selected: btn-login-submit            │    │
│  │                  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │    │
│  │ 🔘 Buttons (23)  │                                       │    │
│  │  ├─ Login (5)    │ 📍 Location                           │    │
│  │  │  └─ Submit ◄──┼─ File: LoginForm.tsx:42               │    │
│  │  ├─ Product (8)  │  Component: LoginForm                 │    │
│  │  └─ Checkout (10)│  Handler: handleLoginSubmit()         │    │
│  │                  │                                       │    │
│  │ 📝 Forms (12)    │ 🔌 API Connection                     │    │
│  │ 🔗 Links (31)    │  POST /api/auth/login                 │    │
│  │ 📄 Pages (8)     │  Handler: authController.login()      │    │
│  │                  │  File: controllers/auth.ts:67         │    │
│  │ [View All 156]   │                                       │    │
│  │                  │ 💾 Database Operations                │    │
│  │                  │  ┌──────────────────────────────────┐ │    │
│  │                  │  │ SELECT * FROM users               │ │    │
│  │                  │  │ WHERE email = $1                  │ │    │
│  │                  │  │                                   │ │    │
│  │                  │  │ UPDATE users                      │ │    │
│  │                  │  │ SET last_login = NOW()            │ │    │
│  │                  │  │ WHERE id = $2                     │ │    │
│  │                  │  └──────────────────────────────────┘ │    │
│  │                  │                                       │    │
│  │                  │ 🧪 Tests                              │    │
│  │                  │  ✅ tests/e2e/login.spec.ts:12        │    │
│  │                  │  ✅ tests/integration/auth.spec.ts:45 │    │
│  │                  │  ✅ tests/unit/authService.spec.ts:23 │    │
│  │                  │                                       │    │
│  │                  │ 📋 Requirements                       │    │
│  │                  │  REQ-AUTH-001: User Login             │    │
│  │                  │  REQ-SEC-003: Password Security       │    │
│  │                  │                                       │    │
│  │                  │ [🔍 Impact Analysis] [📊 Visualize]  │    │
│  └──────────────────┴──────────────────────────────────────┘    │
│                                                                   │
│  💡 Try: "What happens if I change the users.email column?"      │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Tree view of all frontend elements
- Detailed traceability panel
- Direct links to code
- Impact analysis button
- Natural language query

### 6. Testing Dashboard

**Purpose**: View comprehensive test results with visual validation

```
┌─────────────────────────────────────────────────────────────────┐
│ Testing Dashboard              Last run: 2 minutes ago  [Run ▶] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🧪 Test Results                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                   │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐         │
│  │ ✅ 234 Passed │ │ ❌ 2 Failed   │ │ ⏭️  0 Skipped │         │
│  │               │ │               │ │               │         │
│  │  98% Success  │ │  Duration:    │ │  Coverage:    │         │
│  │               │ │  2m 14s       │ │  97.3%        │         │
│  └───────────────┘ └───────────────┘ └───────────────┘         │
│                                                                   │
│  📊 By Type                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Unit          ▓▓▓▓▓▓▓▓▓▓ 156/156 ✅        100%        │    │
│  │ Integration   ▓▓▓▓▓▓▓▓▓▓  45/45  ✅        100%        │    │
│  │ E2E           ▓▓▓▓▓▓▓▓▓░  31/33  ⚠️         94%        │    │
│  │ Visual        ▓▓▓▓▓▓▓▓▓▓  24/24  ✅        100%        │    │
│  │ Accessibility ▓▓▓▓▓▓▓▓▓▓  18/18  ✅        100%        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ❌ Failed Tests                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ tests/e2e/checkout.spec.ts:67                            │    │
│  │ ❌ Payment processing with Stripe                        │    │
│  │                                                          │    │
│  │ Error: Timeout waiting for payment confirmation         │    │
│  │ Expected payment to complete within 5000ms               │    │
│  │                                                          │    │
│  │ [View Stack Trace] [Re-run] [Fix with AI]               │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ tests/e2e/product-search.spec.ts:34                      │    │
│  │ ❌ Search results update instantly                       │    │
│  │                                                          │    │
│  │ AssertionError: Expected search to complete < 300ms      │    │
│  │ Actual: 487ms                                            │    │
│  │                                                          │    │
│  │ [View Stack Trace] [Re-run] [Fix with AI]               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  📸 Visual Test Results (Claude Vision)                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Login Page                          ✅ Passed             │    │
│  │ ┌──────────┐  ┌──────────┐  ┌──────────┐               │    │
│  │ │ Expected │  │ Actual   │  │ No Diff  │               │    │
│  │ │ [image]  │  │ [image]  │  │ Match!   │               │    │
│  │ └──────────┘  └──────────┘  └──────────┘               │    │
│  │                                                          │    │
│  │ Accessibility: ✅ WCAG AAA compliant                     │    │
│  │ Layout: ✅ Matches design                                │    │
│  │ Typography: ✅ Correct fonts and sizes                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Overview stats cards
- Test type breakdown with progress bars
- Failed tests with actionable buttons
- Visual test results with side-by-side comparison
- AI Vision accessibility validation

### 7. Quality Dashboard

**Purpose**: ISO compliance and quality metrics

```
┌─────────────────────────────────────────────────────────────────┐
│ Quality & Compliance                       Last updated: Now     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📊 Overall Quality Score                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │                    ⭐ 96/100                             │    │
│  │                                                          │    │
│  │              Excellent Quality                           │    │
│  │                                                          │    │
│  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ✅ Compliance Status                                            │
│  ┌────────────────┬────────────────────────────────────────┐    │
│  │ ISO 9001       │ ✅ Compliant (98/100)                   │    │
│  │ ISO 12207      │ ✅ Compliant (96/100)                   │    │
│  │ WCAG 2.1 AAA   │ ✅ Compliant (100/100)                  │    │
│  │ OWASP Top 10   │ ✅ No vulnerabilities                   │    │
│  └────────────────┴────────────────────────────────────────┘    │
│                                                                   │
│  📈 Detailed Metrics                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Test Coverage        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░  97.3%         │    │
│  │ Code Quality         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  98.1%         │    │
│  │ Documentation        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  89.5%         │    │
│  │ Security             ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%          │    │
│  │ Performance          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░  94.2%         │    │
│  │ Maintainability      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░  95.7%         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  🎯 Traceability Matrix                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 24/24 Requirements have implementations           ✅     │    │
│  │ 24/24 Requirements have tests                     ✅     │    │
│  │ 24/24 Requirements traced to design               ✅     │    │
│  │                                                          │    │
│  │ 100% Complete Traceability                              │    │
│  │                                                          │    │
│  │ [View Traceability Matrix →]                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ⚠️  Recommendations (2)                                         │
│  • Increase documentation coverage to meet 95% threshold         │
│  • Add performance benchmarks for product search API             │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Large quality score display
- Compliance checkmarks
- Detailed metric bars
- Traceability completeness
- Actionable recommendations

---

## Design System

### Color Palette

```typescript
const colors = {
  // Brand
  primary: '#6366F1',      // Indigo - Main actions
  secondary: '#8B5CF6',    // Purple - Secondary actions

  // Status
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Amber
  error: '#EF4444',        // Red
  info: '#3B82F6',         // Blue

  // Neutrals
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Backgrounds
  background: '#FFFFFF',
  backgroundAlt: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
};
```

### Typography

```typescript
const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },

  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### Spacing

```typescript
const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};
```

### Border Radius

```typescript
const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  base: '0.5rem',  // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  full: '9999px',
};
```

### Shadows

```typescript
const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};
```

---

## Animations & Interactions

### Micro-interactions

```typescript
// Button press
const buttonPress = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

// Success checkmark
const successCheckmark = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
  transition: {
    type: 'spring',
    stiffness: 200,
    damping: 15,
  },
};

// Progress bar fill
const progressBarFill = {
  initial: { width: 0 },
  animate: { width: '100%' },
  transition: {
    duration: 1.5,
    ease: 'easeInOut',
  },
};

// Card hover
const cardHover = {
  y: -4,
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  transition: { duration: 0.2 },
};
```

### Page Transitions

```typescript
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};
```

### Loading States

```typescript
// Skeleton loading
const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Spinner
const spinnerRotate = {
  animate: {
    rotate: 360,
  },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};
```

### Celebration Animations

```typescript
// Confetti burst (when sprint completes)
const confettiBurst = () => {
  // Particle system animation
  // Multiple colored particles burst from center
  // Fade out after 2 seconds
};

// Achievement unlock
const achievementUnlock = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.2, 1],
    opacity: [0, 1, 1],
  },
  transition: {
    duration: 0.5,
    times: [0, 0.6, 1],
  },
};
```

---

## Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};
```

### Mobile Adaptations

- **Navigation**: Sidebar becomes bottom tab bar
- **Charts**: Simplified, vertically stacked
- **Tables**: Card-based layout instead of table
- **Forms**: Full-width inputs, larger touch targets
- **Modals**: Full-screen on mobile

---

## Accessibility

### WCAG 2.1 AAA Compliance

**Color Contrast**:
- Minimum 7:1 for normal text
- Minimum 4.5:1 for large text
- All interactive elements clearly distinguishable

**Keyboard Navigation**:
- Tab order follows visual flow
- Focus indicators visible (2px blue outline)
- All actions accessible via keyboard
- Escape closes modals/dropdowns

**Screen Readers**:
- Proper ARIA labels on all interactive elements
- Semantic HTML structure
- Alt text for all images
- Live regions for dynamic content

**Motion**:
- Respect `prefers-reduced-motion`
- Disable animations for users who prefer it
- No auto-playing videos

---

## Component Library

### Key Reusable Components

```typescript
// Primary Button
<Button
  variant="primary" | "secondary" | "outline" | "ghost"
  size="sm" | "md" | "lg"
  loading={boolean}
  disabled={boolean}
  icon={ReactNode}
>
  Click me
</Button>

// Progress Bar
<ProgressBar
  value={number}       // 0-100
  animated={boolean}
  showLabel={boolean}
  color="primary" | "success" | "warning"
/>

// Card
<Card
  elevated={boolean}
  hoverable={boolean}
  onClick={() => {}}
>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>

// Status Badge
<StatusBadge
  status="success" | "warning" | "error" | "info"
  size="sm" | "md"
  dot={boolean}
>
  Active
</StatusBadge>

// Code Block
<CodeBlock
  language="typescript" | "sql" | "json"
  code={string}
  showLineNumbers={boolean}
  highlightLines={number[]}
/>
```

---

## Conclusion

This design system provides:

✅ **Consistent UX**: Same patterns throughout the app
✅ **Delightful Interactions**: Every action feels rewarding
✅ **Accessible**: WCAG 2.1 AAA compliant
✅ **Scalable**: Component library ready for expansion
✅ **Beautiful**: Clean, modern aesthetic

**Next Steps**:
1. Implement component library in Storybook
2. Create interactive prototypes in Figma
3. Build responsive layouts
4. Test with real users
5. Iterate based on feedback

**The interface is designed. Now let's build it.** 🎨✨
