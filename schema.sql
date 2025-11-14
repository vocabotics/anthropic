-- ============================================================================
-- Vocabotics Database Schema
-- Version: 1.0
-- Database: PostgreSQL 16+
-- Purpose: Complete database design for AI-orchestrated development platform
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users and Authentication
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'enterprise')),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- User sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================================
-- PROJECT MANAGEMENT
-- ============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  vision TEXT NOT NULL, -- Original vision from user

  -- Workflow state
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  current_phase VARCHAR(50) DEFAULT 'vision_input' CHECK (current_phase IN (
    'vision_input',
    'prd_generation',
    'prd_review',
    'architecture_generation',
    'architecture_review',
    'sprint_planning',
    'implementation',
    'mapping_generation',
    'testing',
    'quality_validation',
    'deployment_ready',
    'deployed'
  )),

  -- Metadata
  tags VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[],
  technology_stack JSONB DEFAULT '{}'::jsonb,

  -- Statistics
  total_ai_calls INTEGER DEFAULT 0,
  total_ai_cost_usd DECIMAL(10,4) DEFAULT 0,
  total_lines_generated INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deployed_at TIMESTAMP,

  -- Settings
  settings JSONB DEFAULT '{
    "autoGenerateTests": true,
    "enforceISO9001": true,
    "enforceISO12207": true,
    "targetTestCoverage": 95,
    "qualityThreshold": 90
  }'::jsonb
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_current_phase ON projects(current_phase);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Project members (for team collaboration)
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

-- ============================================================================
-- ARTIFACTS (PRD, Architecture, Code, etc.)
-- ============================================================================

CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Artifact identification
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'prd',
    'architecture',
    'database_schema',
    'api_specification',
    'frontend_code',
    'backend_code',
    'test_suite',
    'integration_map',
    'quality_report',
    'deployment_config'
  )),

  -- Version control
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  parent_id UUID REFERENCES artifacts(id), -- For versioning

  -- Content
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB NOT NULL, -- The actual artifact data

  -- Generation metadata
  generated_by VARCHAR(50) CHECK (generated_by IN ('sonnet-4.5', 'haiku', 'vision', 'human')),
  generation_prompt TEXT, -- Prompt used to generate this
  generation_time_ms INTEGER,

  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'deprecated')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_artifacts_project_id ON artifacts(project_id);
CREATE INDEX idx_artifacts_type ON artifacts(type);
CREATE INDEX idx_artifacts_status ON artifacts(status);
CREATE INDEX idx_artifacts_created_at ON artifacts(created_at DESC);

-- ============================================================================
-- INTEGRATION MAP & TRACEABILITY
-- ============================================================================

-- Integration elements (frontend elements with full traceability)
CREATE TABLE integration_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Vocabotics tag
  vocabotics_id VARCHAR(255) NOT NULL, -- e.g., "btn-login-submit"

  -- Element identification
  element_type VARCHAR(50) NOT NULL CHECK (element_type IN (
    'button', 'input', 'form', 'link', 'component', 'page', 'modal'
  )),

  -- Frontend location
  file_path VARCHAR(500),
  line_number INTEGER,
  column_number INTEGER,
  component_name VARCHAR(255),

  -- Backend connection
  action_type VARCHAR(50), -- e.g., 'api_call', 'navigation', 'state_update'
  action_handler VARCHAR(500), -- e.g., 'handleLoginSubmit'

  -- API connection
  api_method VARCHAR(10), -- GET, POST, PUT, DELETE, etc.
  api_endpoint VARCHAR(500), -- e.g., '/api/auth/login'
  api_handler_file VARCHAR(500),
  api_handler_function VARCHAR(255),

  -- Database connection
  database_operations JSONB DEFAULT '[]'::jsonb, -- Array of DB operations
  -- Example: [
  --   {
  --     "type": "SELECT",
  --     "table": "users",
  --     "query": "SELECT * FROM users WHERE email = $1"
  --   }
  -- ]

  -- Testing
  test_files VARCHAR(500)[] DEFAULT ARRAY[]::VARCHAR[],
  test_coverage_percentage DECIMAL(5,2),

  -- Requirements traceability
  requirement_ids VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[],

  -- Metadata
  validation_rules JSONB DEFAULT '{}'::jsonb,
  accessibility_attributes JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(project_id, vocabotics_id)
);

CREATE INDEX idx_integration_elements_project_id ON integration_elements(project_id);
CREATE INDEX idx_integration_elements_vocabotics_id ON integration_elements(vocabotics_id);
CREATE INDEX idx_integration_elements_api_endpoint ON integration_elements(api_endpoint);
CREATE INDEX idx_integration_elements_element_type ON integration_elements(element_type);

-- API endpoints (comprehensive catalog)
CREATE TABLE api_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Endpoint details
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  handler_file VARCHAR(500),
  handler_function VARCHAR(255),

  -- Documentation
  summary TEXT,
  description TEXT,

  -- Request/Response
  request_schema JSONB, -- JSON schema for request body
  response_schema JSONB, -- JSON schema for response
  parameters JSONB DEFAULT '[]'::jsonb, -- Query params, path params

  -- Authentication
  requires_auth BOOLEAN DEFAULT TRUE,
  required_roles VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR[],

  -- Database operations
  database_operations JSONB DEFAULT '[]'::jsonb,

  -- Dependencies
  calls_external_apis JSONB DEFAULT '[]'::jsonb,
  depends_on_services VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR[],

  -- Frontend usage
  used_by_components VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR[],

  -- Testing
  test_coverage_percentage DECIMAL(5,2),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(project_id, method, path)
);

CREATE INDEX idx_api_endpoints_project_id ON api_endpoints(project_id);
CREATE INDEX idx_api_endpoints_method_path ON api_endpoints(method, path);

-- Database operations catalog
CREATE TABLE database_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Operation details
  operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN (
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRANSACTION'
  )),
  table_name VARCHAR(255) NOT NULL,
  query_template TEXT NOT NULL,

  -- Location
  file_path VARCHAR(500),
  line_number INTEGER,
  function_name VARCHAR(255),

  -- Usage
  used_by_apis VARCHAR(500)[] DEFAULT ARRAY[]::VARCHAR[],
  used_by_elements VARCHAR(500)[] DEFAULT ARRAY[]::VARCHAR[],

  -- Performance
  estimated_complexity VARCHAR(20), -- O(1), O(n), O(n²), etc.
  requires_index BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_database_operations_project_id ON database_operations(project_id);
CREATE INDEX idx_database_operations_table_name ON database_operations(table_name);

-- Dependency graph
CREATE TABLE dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Dependency relationship
  from_type VARCHAR(50) NOT NULL, -- 'component', 'api', 'module', etc.
  from_id VARCHAR(255) NOT NULL,
  to_type VARCHAR(50) NOT NULL,
  to_id VARCHAR(255) NOT NULL,

  -- Dependency nature
  dependency_type VARCHAR(50) NOT NULL CHECK (dependency_type IN (
    'calls', 'imports', 'uses', 'extends', 'implements', 'queries'
  )),

  -- Metadata
  critical BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(project_id, from_type, from_id, to_type, to_id, dependency_type)
);

CREATE INDEX idx_dependencies_project_id ON dependencies(project_id);
CREATE INDEX idx_dependencies_from ON dependencies(from_type, from_id);
CREATE INDEX idx_dependencies_to ON dependencies(to_type, to_id);

-- ============================================================================
-- TESTING & QUALITY
-- ============================================================================

-- Test runs
CREATE TABLE test_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Run details
  run_type VARCHAR(50) NOT NULL CHECK (run_type IN (
    'unit', 'integration', 'e2e', 'visual', 'accessibility', 'security', 'performance', 'all'
  )),
  status VARCHAR(50) DEFAULT 'running' CHECK (status IN (
    'running', 'completed', 'failed', 'cancelled'
  )),

  -- Results
  total_tests INTEGER DEFAULT 0,
  passed_tests INTEGER DEFAULT 0,
  failed_tests INTEGER DEFAULT 0,
  skipped_tests INTEGER DEFAULT 0,

  -- Timing
  duration_ms INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- Triggered by
  triggered_by UUID REFERENCES users(id),
  trigger_type VARCHAR(50), -- 'manual', 'commit', 'schedule', 'ai-generation'

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_test_runs_project_id ON test_runs(project_id);
CREATE INDEX idx_test_runs_status ON test_runs(status);
CREATE INDEX idx_test_runs_started_at ON test_runs(started_at DESC);

-- Individual test results
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Test identification
  test_type VARCHAR(50) NOT NULL,
  test_file VARCHAR(500),
  test_name VARCHAR(500) NOT NULL,
  test_suite VARCHAR(255),

  -- Result
  passed BOOLEAN NOT NULL,
  error_message TEXT,
  stack_trace TEXT,

  -- Timing
  duration_ms INTEGER,

  -- Visual testing specific
  screenshot_url VARCHAR(500),
  baseline_screenshot_url VARCHAR(500),
  diff_screenshot_url VARCHAR(500),
  visual_diff_score DECIMAL(5,2), -- Percentage difference

  -- Coverage
  code_coverage JSONB, -- Line coverage info

  -- Traceability
  tests_requirement_ids VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[],
  tests_element_ids VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR[],

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_test_results_test_run_id ON test_results(test_run_id);
CREATE INDEX idx_test_results_project_id ON test_results(project_id);
CREATE INDEX idx_test_results_passed ON test_results(passed);
CREATE INDEX idx_test_results_test_type ON test_results(test_type);

-- Quality metrics (snapshots over time)
CREATE TABLE quality_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Metric type
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
    'test_coverage',
    'code_quality',
    'iso9001_compliance',
    'iso12207_compliance',
    'wcag_compliance',
    'owasp_security',
    'performance',
    'overall'
  )),

  -- Score (0-100)
  score DECIMAL(5,2) NOT NULL,

  -- Details
  details JSONB NOT NULL,
  -- Example for test_coverage:
  -- {
  --   "unit": 96.5,
  --   "integration": 94.2,
  --   "e2e": 89.7,
  --   "visual": 92.3,
  --   "lines_covered": 4523,
  --   "lines_total": 4785
  -- }

  -- Gaps and recommendations
  gaps JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,

  -- Timestamp
  measured_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quality_metrics_project_id ON quality_metrics(project_id);
CREATE INDEX idx_quality_metrics_metric_type ON quality_metrics(metric_type);
CREATE INDEX idx_quality_metrics_measured_at ON quality_metrics(measured_at DESC);

-- Traceability matrix
CREATE TABLE traceability_matrix (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Requirement
  requirement_id VARCHAR(100) NOT NULL, -- e.g., "REQ-AUTH-001"
  requirement_text TEXT NOT NULL,
  requirement_type VARCHAR(50), -- 'functional', 'non-functional', 'security', etc.
  requirement_priority VARCHAR(20), -- 'critical', 'high', 'medium', 'low'

  -- Design
  design_artifact_id UUID REFERENCES artifacts(id),
  design_section TEXT,

  -- Implementation
  implementation_files VARCHAR(500)[] DEFAULT ARRAY[]::VARCHAR[],
  implementation_functions VARCHAR(500)[] DEFAULT ARRAY[]::VARCHAR[],

  -- Testing
  test_files VARCHAR(500)[] DEFAULT ARRAY[]::VARCHAR[],
  test_names VARCHAR(500)[] DEFAULT ARRAY[]::VARCHAR[],
  test_coverage_percentage DECIMAL(5,2),

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'designed', 'implemented', 'tested', 'verified', 'complete'
  )),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(project_id, requirement_id)
);

CREATE INDEX idx_traceability_matrix_project_id ON traceability_matrix(project_id);
CREATE INDEX idx_traceability_matrix_requirement_id ON traceability_matrix(requirement_id);
CREATE INDEX idx_traceability_matrix_status ON traceability_matrix(status);

-- ============================================================================
-- AI USAGE & ANALYTICS
-- ============================================================================

-- AI calls log (for analytics and cost tracking)
CREATE TABLE ai_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Call details
  model VARCHAR(50) NOT NULL CHECK (model IN ('sonnet-4.5', 'haiku', 'vision')),
  task_type VARCHAR(100) NOT NULL,
  phase VARCHAR(50),

  -- Token usage
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,

  -- Cost
  cost_usd DECIMAL(10,6) NOT NULL,

  -- Performance
  duration_ms INTEGER NOT NULL,

  -- Cache hit
  cached BOOLEAN DEFAULT FALSE,
  cache_key VARCHAR(500),

  -- Quality
  generation_quality_score DECIMAL(5,2), -- If available

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_calls_project_id ON ai_calls(project_id);
CREATE INDEX idx_ai_calls_user_id ON ai_calls(user_id);
CREATE INDEX idx_ai_calls_model ON ai_calls(model);
CREATE INDEX idx_ai_calls_created_at ON ai_calls(created_at DESC);
CREATE INDEX idx_ai_calls_cached ON ai_calls(cached);

-- ============================================================================
-- WORKFLOW & STATE TRANSITIONS
-- ============================================================================

-- State transitions log
CREATE TABLE state_transitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Transition
  from_phase VARCHAR(50) NOT NULL,
  to_phase VARCHAR(50) NOT NULL,

  -- Trigger
  triggered_by UUID REFERENCES users(id),
  trigger_type VARCHAR(50), -- 'user_action', 'ai_completion', 'approval', 'rollback'

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_state_transitions_project_id ON state_transitions(project_id);
CREATE INDEX idx_state_transitions_created_at ON state_transitions(created_at DESC);

-- ============================================================================
-- NOTIFICATIONS & EVENTS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification details
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'generation_complete',
    'test_complete',
    'approval_required',
    'quality_issue',
    'deployment_ready',
    'error'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT,

  -- Related entities
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE,

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,

  -- Action
  action_url VARCHAR(500),
  action_label VARCHAR(100),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- BILLING & USAGE (Enterprise)
-- ============================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Plan
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),

  -- Billing
  billing_cycle VARCHAR(20), -- 'monthly', 'annual'
  price_usd DECIMAL(10,2),

  -- Limits
  max_projects INTEGER,
  max_team_members INTEGER,
  max_ai_calls_per_month INTEGER,

  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  cancelled_at TIMESTAMP,

  -- Payment
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Usage tracking
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Usage
  projects_created INTEGER DEFAULT 0,
  ai_calls_made INTEGER DEFAULT 0,
  ai_cost_usd DECIMAL(10,4) DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,

  -- Details
  details JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, period_start)
);

CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Project overview with stats
CREATE VIEW project_overview AS
SELECT
  p.id,
  p.name,
  p.description,
  p.status,
  p.current_phase,
  p.owner_id,
  u.name as owner_name,
  p.created_at,
  p.updated_at,

  -- AI usage stats
  p.total_ai_calls,
  p.total_ai_cost_usd,

  -- Quality metrics (latest)
  (SELECT score FROM quality_metrics
   WHERE project_id = p.id AND metric_type = 'overall'
   ORDER BY measured_at DESC LIMIT 1) as quality_score,

  -- Test coverage (latest)
  (SELECT score FROM quality_metrics
   WHERE project_id = p.id AND metric_type = 'test_coverage'
   ORDER BY measured_at DESC LIMIT 1) as test_coverage,

  -- Artifact counts
  (SELECT COUNT(*) FROM artifacts WHERE project_id = p.id) as artifact_count,

  -- Integration elements count
  (SELECT COUNT(*) FROM integration_elements WHERE project_id = p.id) as element_count

FROM projects p
JOIN users u ON p.owner_id = u.id;

-- Integration element with full traceability
CREATE VIEW element_traceability AS
SELECT
  ie.id,
  ie.project_id,
  ie.vocabotics_id,
  ie.element_type,
  ie.file_path,
  ie.component_name,

  -- API info
  ie.api_method,
  ie.api_endpoint,
  ae.summary as api_summary,

  -- Database operations
  ie.database_operations,

  -- Tests
  ie.test_files,
  ie.test_coverage_percentage,

  -- Requirements
  ie.requirement_ids,

  -- From projects
  p.name as project_name

FROM integration_elements ie
JOIN projects p ON ie.project_id = p.id
LEFT JOIN api_endpoints ae ON ie.project_id = ae.project_id
  AND ie.api_endpoint = ae.path
  AND ie.api_method = ae.method;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_elements_updated_at BEFORE UPDATE ON integration_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_endpoints_updated_at BEFORE UPDATE ON api_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traceability_matrix_updated_at BEFORE UPDATE ON traceability_matrix
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update project AI usage stats
CREATE OR REPLACE FUNCTION update_project_ai_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET
    total_ai_calls = total_ai_calls + 1,
    total_ai_cost_usd = total_ai_cost_usd + NEW.cost_usd,
    updated_at = NOW()
  WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_ai_stats_trigger
  AFTER INSERT ON ai_calls
  FOR EACH ROW
  WHEN (NEW.project_id IS NOT NULL)
  EXECUTE FUNCTION update_project_ai_stats();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Policies for projects
CREATE POLICY project_access_policy ON projects
  FOR ALL
  USING (
    owner_id = current_setting('app.user_id', true)::uuid
    OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id
      AND user_id = current_setting('app.user_id', true)::uuid
    )
  );

-- Policies for artifacts (inherit from project)
CREATE POLICY artifact_access_policy ON artifacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifacts.project_id
      AND (
        projects.owner_id = current_setting('app.user_id', true)::uuid
        OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = current_setting('app.user_id', true)::uuid
        )
      )
    )
  );

-- ============================================================================
-- SAMPLE DATA (Development/Testing)
-- ============================================================================

-- Insert sample user
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'demo@vocabotics.com',
  crypt('demo123', gen_salt('bf')),
  'Demo User',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Create materialized view for project statistics (refresh periodically)
CREATE MATERIALIZED VIEW project_statistics AS
SELECT
  p.id as project_id,
  COUNT(DISTINCT a.id) as total_artifacts,
  COUNT(DISTINCT ie.id) as total_elements,
  COUNT(DISTINCT ae.id) as total_apis,
  AVG(qm.score) FILTER (WHERE qm.metric_type = 'overall') as avg_quality_score,
  SUM(ac.total_tokens) as total_tokens_used,
  SUM(ac.cost_usd) as total_cost_usd
FROM projects p
LEFT JOIN artifacts a ON p.id = a.project_id
LEFT JOIN integration_elements ie ON p.id = ie.project_id
LEFT JOIN api_endpoints ae ON p.id = ae.project_id
LEFT JOIN quality_metrics qm ON p.id = qm.project_id
LEFT JOIN ai_calls ac ON p.id = ac.project_id
GROUP BY p.id;

CREATE UNIQUE INDEX idx_project_statistics_project_id
  ON project_statistics(project_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_project_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY project_statistics;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================

CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_migrations (version, description)
VALUES ('1.0.0', 'Initial Vocabotics schema with full orchestration support');

-- ============================================================================
-- GRANTS (Adjust based on your security requirements)
-- ============================================================================

-- Grant appropriate permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vocabotics_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vocabotics_app;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Summary Statistics Query
COMMENT ON DATABASE vocabotics IS 'Vocabotics AI Development Orchestration Platform Database';
