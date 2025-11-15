import { OpenRouterClient, OpenRouterMessage, MODELS } from '../../lib/openrouter';
import { logger } from '../../utils/logger';
import { PRDDocument } from './prd-generator.service';

export interface TechnologyStack {
  frontend: string[];
  backend: string[];
  database: string[];
  infrastructure: string[];
  thirdParty: string[];
}

export interface Component {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'infrastructure';
  description: string;
  responsibilities: string[];
  technologies: string[];
  dependencies: string[];
  apis?: {
    endpoint: string;
    method: string;
    description: string;
    requirementIds: string[];
  }[];
}

export interface DataModel {
  name: string;
  description: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    unique?: boolean;
    indexed?: boolean;
    description: string;
  }[];
  relationships: {
    type: 'oneToOne' | 'oneToMany' | 'manyToMany';
    model: string;
    description: string;
  }[];
  requirementIds: string[];
}

export interface ArchitectureDocument {
  title: string;
  version: string;
  lastUpdated: string;

  overview: {
    summary: string;
    architectureStyle: string;
    designPrinciples: string[];
    qualityAttributes: string[];
  };

  technologyStack: TechnologyStack;

  components: Component[];

  dataModels: DataModel[];

  apiContracts: {
    basePath: string;
    version: string;
    authentication: string;
    endpoints: {
      path: string;
      method: string;
      summary: string;
      requirementIds: string[];
      request?: {
        headers?: Record<string, string>;
        body?: any;
        queryParams?: Record<string, string>;
      };
      response: {
        statusCode: number;
        schema: any;
      }[];
    }[];
  };

  integrations: {
    name: string;
    type: 'external_api' | 'third_party_service' | 'database' | 'message_queue';
    description: string;
    authentication: string;
    endpoints?: string[];
    requirementIds: string[];
  }[];

  security: {
    authentication: {
      mechanism: string;
      description: string;
    };
    authorization: {
      mechanism: string;
      roles: string[];
    };
    dataProtection: {
      encryption: string[];
      compliance: string[];
    };
    threats: {
      threat: string;
      mitigation: string;
    }[];
  };

  scalability: {
    horizontal: {
      supported: boolean;
      description: string;
    };
    vertical: {
      supported: boolean;
      description: string;
    };
    caching: {
      strategy: string;
      layers: string[];
    };
    loadBalancing: {
      strategy: string;
      description: string;
    };
  };

  deployment: {
    strategy: string;
    environments: {
      name: string;
      description: string;
      infrastructure: string[];
    }[];
    cicd: {
      platform: string;
      stages: string[];
    };
    monitoring: {
      tools: string[];
      metrics: string[];
    };
  };

  complianceMapping: {
    requirementId: string;
    components: string[];
    dataModels: string[];
    apis: string[];
  }[];
}

/**
 * Architecture Generator Service
 * Generates comprehensive software architecture documents
 */
export class ArchitectureGeneratorService {
  /**
   * Generate architecture from PRD
   */
  async generate(
    prd: PRDDocument,
    techStack: TechnologyStack,
    client: OpenRouterClient
  ): Promise<ArchitectureDocument> {
    const systemPrompt = `You are an expert software architect with deep knowledge of:
- Microservices and monolithic architectures
- RESTful API design and GraphQL
- Database design (SQL and NoSQL)
- Cloud infrastructure (AWS, GCP, Azure)
- Security best practices (OWASP Top 10)
- Scalability patterns
- ISO 12207 software architecture standards

Generate a comprehensive Software Architecture Document that:
1. Maps every requirement from the PRD to specific components
2. Defines clear component boundaries and responsibilities
3. Specifies complete data models with relationships
4. Documents all API endpoints with OpenAPI-style contracts
5. Addresses security, scalability, and deployment
6. Maintains full traceability to requirements

Output MUST be valid JSON matching the exact schema provided.`;

    const userPrompt = `Generate a comprehensive software architecture document based on this PRD:

**PRD:**
${JSON.stringify(prd, null, 2)}

**Technology Stack:**
${JSON.stringify(techStack, null, 2)}

Requirements:
1. Create components for ALL functional requirements
2. Design data models that support all user stories
3. Define API endpoints for every user-facing feature
4. Include security measures for all data protection requirements
5. Address scalability for performance requirements
6. Map every requirement ID to its implementing components

The architecture MUST use the specified technology stack. For example:
- Frontend: ${techStack.frontend.join(', ')}
- Backend: ${techStack.backend.join(', ')}
- Database: ${techStack.database.join(', ')}

Output as JSON matching this exact structure:
{
  "title": "Architecture Document Title",
  "version": "1.0.0",
  "lastUpdated": "YYYY-MM-DD",
  "overview": {
    "summary": "...",
    "architectureStyle": "layered|microservices|event-driven",
    "designPrinciples": ["...", "..."],
    "qualityAttributes": ["performance", "security", "scalability"]
  },
  "technologyStack": { /* as provided */ },
  "components": [
    {
      "id": "COMP-001",
      "name": "User Authentication Service",
      "type": "backend",
      "description": "...",
      "responsibilities": ["...", "..."],
      "technologies": ["express", "jsonwebtoken"],
      "dependencies": ["COMP-002"],
      "apis": [
        {
          "endpoint": "/api/auth/login",
          "method": "POST",
          "description": "...",
          "requirementIds": ["REQ-F-001"]
        }
      ]
    }
  ],
  "dataModels": [
    {
      "name": "User",
      "description": "...",
      "fields": [
        {
          "name": "id",
          "type": "uuid",
          "required": true,
          "unique": true,
          "indexed": true,
          "description": "Primary key"
        }
      ],
      "relationships": [
        {
          "type": "oneToMany",
          "model": "Project",
          "description": "A user can have multiple projects"
        }
      ],
      "requirementIds": ["REQ-F-001", "REQ-F-002"]
    }
  ],
  "apiContracts": {
    "basePath": "/api",
    "version": "v1",
    "authentication": "JWT Bearer Token",
    "endpoints": [...]
  },
  "integrations": [...],
  "security": {...},
  "scalability": {...},
  "deployment": {...},
  "complianceMapping": [
    {
      "requirementId": "REQ-F-001",
      "components": ["COMP-001"],
      "dataModels": ["User"],
      "apis": ["/api/auth/login"]
    }
  ]
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
        max_tokens: 16000,
      });

      const architecture = this.parseAndValidate(result.content);

      logger.info('Architecture generated successfully', {
        title: architecture.title,
        components: architecture.components.length,
        dataModels: architecture.dataModels.length,
        apiEndpoints: architecture.apiContracts.endpoints.length,
      });

      return architecture;
    } catch (error) {
      logger.error('Architecture generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Parse and validate architecture JSON
   */
  private parseAndValidate(content: string): ArchitectureDocument {
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const arch = JSON.parse(jsonContent);

    // Validate required fields
    const requiredFields = [
      'title',
      'version',
      'overview',
      'technologyStack',
      'components',
      'dataModels',
      'apiContracts',
      'security',
      'scalability',
      'deployment',
    ];

    for (const field of requiredFields) {
      if (!arch[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate component IDs are unique
    const componentIds = new Set<string>();
    for (const comp of arch.components) {
      if (componentIds.has(comp.id)) {
        throw new Error(`Duplicate component ID: ${comp.id}`);
      }
      componentIds.add(comp.id);
    }

    return arch;
  }

  /**
   * Validate requirement coverage
   */
  validateRequirementCoverage(
    prd: PRDDocument,
    architecture: ArchitectureDocument
  ): {
    valid: boolean;
    coverage: number;
    uncoveredRequirements: string[];
    errors: string[];
  } {
    const errors: string[] = [];

    // Get all requirement IDs from PRD
    const allReqIds = new Set(
      [...prd.functionalRequirements, ...prd.nonFunctionalRequirements].map(r => r.id)
    );

    // Get all requirement IDs covered by architecture
    const coveredReqIds = new Set<string>();

    // From components
    for (const comp of architecture.components) {
      if (comp.apis) {
        for (const api of comp.apis) {
          api.requirementIds.forEach(id => coveredReqIds.add(id));
        }
      }
    }

    // From data models
    for (const model of architecture.dataModels) {
      model.requirementIds.forEach(id => coveredReqIds.add(id));
    }

    // From API endpoints
    for (const endpoint of architecture.apiContracts.endpoints) {
      endpoint.requirementIds.forEach(id => coveredReqIds.add(id));
    }

    // From compliance mapping
    for (const mapping of architecture.complianceMapping || []) {
      coveredReqIds.add(mapping.requirementId);
    }

    // Find uncovered requirements
    const uncoveredRequirements = Array.from(allReqIds).filter(
      id => !coveredReqIds.has(id)
    );

    const coverage = (coveredReqIds.size / allReqIds.size) * 100;

    if (coverage < 100) {
      errors.push(`Only ${coverage.toFixed(1)}% of requirements are covered by the architecture`);
    }

    return {
      valid: uncoveredRequirements.length === 0,
      coverage,
      uncoveredRequirements,
      errors,
    };
  }
}

// Export singleton
export const architectureGenerator = new ArchitectureGeneratorService();
