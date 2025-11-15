import { OpenRouterClient, OpenRouterMessage, MODELS } from '../../lib/openrouter';
import { logger } from '../../utils/logger';

export interface PRDInput {
  vision: string;
  targetAudience?: string;
  keyFeatures?: string[];
  constraints?: string[];
  industryStandards?: string[];
}

export interface Requirement {
  id: string;
  type: 'functional' | 'non-functional';
  category?: 'performance' | 'security' | 'scalability' | 'usability' | 'reliability';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  acceptanceCriteria?: string[];
  dependencies?: string[];
}

export interface UserStory {
  id: string;
  asA: string;
  iWant: string;
  soThat: string;
  requirementIds: string[];
  acceptanceCriteria: string[];
  estimatedEffort?: string;
}

export interface PRDDocument {
  title: string;
  version: string;
  lastUpdated: string;
  vision: string;
  executiveSummary: string;

  // ISO compliance sections
  targetAudience: {
    primary: string[];
    secondary: string[];
    personas: {
      name: string;
      role: string;
      goals: string[];
      painPoints: string[];
    }[];
  };

  functionalRequirements: Requirement[];
  nonFunctionalRequirements: Requirement[];

  userStories: UserStory[];

  successMetrics: {
    metric: string;
    target: string;
    measurement: string;
  }[];

  constraints: {
    technical: string[];
    business: string[];
    regulatory: string[];
  };

  dependencies: {
    internal: string[];
    external: string[];
    thirdParty: string[];
  };

  risks: {
    risk: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    mitigation: string;
  }[];

  timeline: {
    phase: string;
    duration: string;
    deliverables: string[];
  }[];

  complianceStandards: string[];
}

/**
 * PRD Generator Service
 * Generates ISO-compliant Product Requirements Documents
 */
export class PRDGeneratorService {
  /**
   * Generate comprehensive PRD following ISO 9001 and ISO 12207
   */
  async generate(
    input: PRDInput,
    client: OpenRouterClient
  ): Promise<PRDDocument> {
    const systemPrompt = `You are an expert product manager and technical architect specializing in ISO-compliant documentation.

Generate a comprehensive Product Requirements Document (PRD) following:
- ISO 9001:2015 (Quality Management Systems)
- ISO 12207 (Software Life Cycle Processes)
- ISO/IEC 25010 (Systems and software Quality Requirements and Evaluation)

The PRD must be:
1. **Complete**: All aspects of the product fully documented
2. **Consistent**: No contradictions between requirements
3. **Traceable**: Every requirement has a unique ID and clear relationships
4. **Testable**: Acceptance criteria for all requirements
5. **Prioritized**: Critical/High/Medium/Low priority classification

Output MUST be valid JSON matching the exact schema provided.`;

    const userPrompt = `Generate a PRD for the following product:

**Vision:**
${input.vision}

${input.targetAudience ? `**Target Audience:**\n${input.targetAudience}\n` : ''}

${input.keyFeatures && input.keyFeatures.length > 0 ? `**Key Features:**\n${input.keyFeatures.map(f => `- ${f}`).join('\n')}\n` : ''}

${input.constraints && input.constraints.length > 0 ? `**Constraints:**\n${input.constraints.map(c => `- ${c}`).join('\n')}\n` : ''}

${input.industryStandards && input.industryStandards.length > 0 ? `**Industry Standards:**\n${input.industryStandards.map(s => `- ${s}`).join('\n')}\n` : ''}

Generate a comprehensive PRD with:
- At least 15-20 functional requirements (REQ-F-001, REQ-F-002, ...)
- At least 10-15 non-functional requirements (REQ-NF-001, REQ-NF-002, ...)
- At least 10-15 user stories (US-001, US-002, ...)
- Complete persona profiles
- Success metrics with measurable targets
- Risk assessment with mitigation strategies
- Timeline breakdown by phase

Output as JSON matching this exact structure:
{
  "title": "Product Title",
  "version": "1.0.0",
  "lastUpdated": "YYYY-MM-DD",
  "vision": "...",
  "executiveSummary": "...",
  "targetAudience": {
    "primary": ["..."],
    "secondary": ["..."],
    "personas": [{"name": "...", "role": "...", "goals": ["..."], "painPoints": ["..."]}]
  },
  "functionalRequirements": [
    {
      "id": "REQ-F-001",
      "type": "functional",
      "priority": "critical",
      "description": "...",
      "acceptanceCriteria": ["..."],
      "dependencies": []
    }
  ],
  "nonFunctionalRequirements": [
    {
      "id": "REQ-NF-001",
      "type": "non-functional",
      "category": "performance",
      "priority": "high",
      "description": "...",
      "acceptanceCriteria": ["..."]
    }
  ],
  "userStories": [
    {
      "id": "US-001",
      "asA": "...",
      "iWant": "...",
      "soThat": "...",
      "requirementIds": ["REQ-F-001"],
      "acceptanceCriteria": ["..."],
      "estimatedEffort": "2-3 days"
    }
  ],
  "successMetrics": [
    {"metric": "...", "target": "...", "measurement": "..."}
  ],
  "constraints": {
    "technical": ["..."],
    "business": ["..."],
    "regulatory": ["..."]
  },
  "dependencies": {
    "internal": ["..."],
    "external": ["..."],
    "thirdParty": ["..."]
  },
  "risks": [
    {"risk": "...", "severity": "high", "mitigation": "..."}
  ],
  "timeline": [
    {"phase": "...", "duration": "...", "deliverables": ["..."]}
  ],
  "complianceStandards": ["ISO 9001:2015", "ISO 12207", "GDPR", ...]
}`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const result = await client.complete({
        model: MODELS.SONNET_4_5,
        messages,
        temperature: 0.7,
        max_tokens: 12000,
      });

      // Parse and validate JSON
      const prd = this.parseAndValidate(result.content);

      logger.info('PRD generated successfully', {
        title: prd.title,
        functionalReqs: prd.functionalRequirements.length,
        nonFunctionalReqs: prd.nonFunctionalRequirements.length,
        userStories: prd.userStories.length,
      });

      return prd;
    } catch (error) {
      logger.error('PRD generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Parse and validate PRD JSON
   */
  private parseAndValidate(content: string): PRDDocument {
    // Extract JSON from markdown code blocks
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const prd = JSON.parse(jsonContent);

    // Validate required fields
    const requiredFields = [
      'title',
      'version',
      'vision',
      'executiveSummary',
      'targetAudience',
      'functionalRequirements',
      'nonFunctionalRequirements',
      'userStories',
      'successMetrics',
      'constraints',
      'dependencies',
      'risks',
    ];

    for (const field of requiredFields) {
      if (!prd[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate requirement IDs are unique
    const reqIds = new Set<string>();
    for (const req of [...prd.functionalRequirements, ...prd.nonFunctionalRequirements]) {
      if (reqIds.has(req.id)) {
        throw new Error(`Duplicate requirement ID: ${req.id}`);
      }
      reqIds.add(req.id);
    }

    // Validate user story IDs are unique
    const storyIds = new Set<string>();
    for (const story of prd.userStories) {
      if (storyIds.has(story.id)) {
        throw new Error(`Duplicate user story ID: ${story.id}`);
      }
      storyIds.add(story.id);
    }

    return prd;
  }

  /**
   * Validate requirement traceability
   */
  validateTraceability(prd: PRDDocument): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Collect all requirement IDs
    const allReqIds = new Set(
      [...prd.functionalRequirements, ...prd.nonFunctionalRequirements].map(r => r.id)
    );

    // Check user stories reference valid requirements
    for (const story of prd.userStories) {
      for (const reqId of story.requirementIds) {
        if (!allReqIds.has(reqId)) {
          errors.push(`User story ${story.id} references non-existent requirement ${reqId}`);
        }
      }

      if (story.requirementIds.length === 0) {
        warnings.push(`User story ${story.id} has no linked requirements`);
      }
    }

    // Check for orphaned requirements (not linked to any user story)
    const linkedReqs = new Set(prd.userStories.flatMap(s => s.requirementIds));
    for (const reqId of allReqIds) {
      if (!linkedReqs.has(reqId)) {
        warnings.push(`Requirement ${reqId} is not linked to any user story`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export singleton
export const prdGenerator = new PRDGeneratorService();
