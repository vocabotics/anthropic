import { OpenRouterClient, OpenRouterMessage, MODELS } from '../../lib/openrouter';
import { logger } from '../../utils/logger';
import { ArchitectureDocument } from './architecture-generator.service';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: {
    url: string;
    description: string;
  }[];
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
  tags: {
    name: string;
    description: string;
  }[];
}

export interface RouteImplementation {
  path: string;
  method: string;
  vocaboticsId: string;
  requirementIds: string[];
  handler: string;
  middleware: string[];
  validation: {
    body?: any;
    query?: any;
    params?: any;
  };
}

/**
 * API Generator Service
 * Generates OpenAPI specs and route implementations
 */
export class APIGeneratorService {
  /**
   * Generate OpenAPI 3.0 specification
   */
  async generateOpenAPISpec(
    architecture: ArchitectureDocument,
    client: OpenRouterClient
  ): Promise<OpenAPISpec> {
    const systemPrompt = `You are an expert in RESTful API design and OpenAPI specifications.

Generate production-ready OpenAPI 3.0 specifications that:
1. Follow REST best practices
2. Include comprehensive schemas for all request/response bodies
3. Document all query parameters and path parameters
4. Include security schemes (JWT, API keys, etc.)
5. Add detailed descriptions and examples
6. Group endpoints by tags
7. Include error responses (400, 401, 403, 404, 500)
8. Map to requirement IDs using x-requirements extension

Output MUST be valid OpenAPI 3.0 JSON.`;

    const userPrompt = `Generate a complete OpenAPI 3.0 specification based on this architecture:

**API Contracts:**
${JSON.stringify(architecture.apiContracts, null, 2)}

**Data Models:**
${JSON.stringify(architecture.dataModels, null, 2)}

**Security:**
${JSON.stringify(architecture.security, null, 2)}

Requirements:
1. All endpoints must have request/response schemas
2. Include authentication requirements
3. Add examples for all schemas
4. Document error responses
5. Use requirement IDs in x-requirements extension
6. Group endpoints by domain (auth, users, projects, etc.)

Generate the complete OpenAPI spec as JSON.`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const result = await client.complete({
        model: MODELS.SONNET_4_5,
        messages,
        temperature: 0.3,
        max_tokens: 12000,
      });

      const spec = this.parseOpenAPISpec(result.content);

      logger.info('OpenAPI spec generated', {
        paths: Object.keys(spec.paths).length,
        schemas: Object.keys(spec.components.schemas).length,
      });

      return spec;
    } catch (error) {
      logger.error('OpenAPI generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate route implementations with Vocabotics tags
   */
  async generateRouteImplementations(
    architecture: ArchitectureDocument,
    client: OpenRouterClient
  ): Promise<RouteImplementation[]> {
    const systemPrompt = `You are an expert in Express.js and TypeScript.

Generate route implementations that:
1. Include Vocabotics traceability tags
2. Use proper middleware (auth, validation)
3. Follow RESTful conventions
4. Include error handling
5. Use Zod for validation schemas
6. Return proper HTTP status codes

Each route should include:
- vocabotics-id: Unique identifier
- vocabotics-requirements: Comma-separated requirement IDs
- Type-safe request/response handling
- Proper error handling`;

    const userPrompt = `Generate route implementations for these API endpoints:

${JSON.stringify(architecture.apiContracts.endpoints, null, 2)}

Generate as JSON array:
[
  {
    "path": "/api/users",
    "method": "POST",
    "vocaboticsId": "API-USERS-CREATE-001",
    "requirementIds": ["REQ-F-001", "REQ-F-002"],
    "handler": "// vocabotics-id: API-USERS-CREATE-001\\n// vocabotics-requirements: REQ-F-001,REQ-F-002\\nexport async function createUser(req, res, next) { ... }",
    "middleware": ["authenticate", "validateBody(createUserSchema)"],
    "validation": {
      "body": {
        "name": "string",
        "email": "string",
        "password": "string"
      }
    }
  }
]`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const result = await client.complete({
        model: MODELS.SONNET_4_5,
        messages,
        temperature: 0.3,
        max_tokens: 10000,
      });

      const routes = this.parseRouteImplementations(result.content);

      logger.info('Route implementations generated', {
        count: routes.length,
      });

      return routes;
    } catch (error) {
      logger.error('Route implementation generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Validate OpenAPI spec
   */
  validateOpenAPISpec(spec: OpenAPISpec): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!spec.openapi || !spec.openapi.startsWith('3.0')) {
      errors.push('OpenAPI version must be 3.0.x');
    }

    if (!spec.info || !spec.info.title || !spec.info.version) {
      errors.push('Missing required info fields');
    }

    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      errors.push('No paths defined');
    }

    // Check paths have operations
    for (const [path, operations] of Object.entries(spec.paths)) {
      if (!operations || typeof operations !== 'object') {
        errors.push(`Path ${path} has no operations`);
        continue;
      }

      const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];
      const hasOperation = httpMethods.some(method => method in operations);

      if (!hasOperation) {
        warnings.push(`Path ${path} has no HTTP methods defined`);
      }

      // Check for security
      for (const method of httpMethods) {
        if (operations[method]) {
          if (!operations[method].responses) {
            warnings.push(`${method.toUpperCase()} ${path} has no responses defined`);
          }

          if (!operations[method].security && !spec.security) {
            warnings.push(`${method.toUpperCase()} ${path} has no security defined`);
          }
        }
      }
    }

    // Check components
    if (!spec.components) {
      warnings.push('No components defined');
    } else {
      if (!spec.components.schemas || Object.keys(spec.components.schemas).length === 0) {
        warnings.push('No schemas defined in components');
      }

      if (!spec.components.securitySchemes) {
        warnings.push('No security schemes defined');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Parse OpenAPI spec from AI response
   */
  private parseOpenAPISpec(content: string): OpenAPISpec {
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const spec = JSON.parse(jsonContent);

    // Ensure required OpenAPI structure
    if (!spec.openapi) {
      spec.openapi = '3.0.3';
    }

    if (!spec.components) {
      spec.components = {
        schemas: {},
        securitySchemes: {},
      };
    }

    return spec;
  }

  /**
   * Parse route implementations from AI response
   */
  private parseRouteImplementations(content: string): RouteImplementation[] {
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const routes = JSON.parse(jsonContent);

    if (!Array.isArray(routes)) {
      throw new Error('Routes must be an array');
    }

    return routes;
  }
}

// Export singleton
export const apiGenerator = new APIGeneratorService();
