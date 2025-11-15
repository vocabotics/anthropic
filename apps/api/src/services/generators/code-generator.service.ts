import { OpenRouterClient, OpenRouterMessage, MODELS } from '../../lib/openrouter';
import { logger } from '../../utils/logger';
import { ArchitectureDocument, Component } from './architecture-generator.service';

export interface GeneratedCode {
  files: {
    path: string;
    content: string;
    vocaboticsId: string;
    requirementIds: string[];
    type: 'component' | 'service' | 'route' | 'test' | 'config';
  }[];
  summary: {
    totalFiles: number;
    totalLines: number;
    requirementsCovered: string[];
  };
}

/**
 * Code Generator Service
 * Generates production-ready code with Vocabotics traceability
 */
export class CodeGeneratorService {
  /**
   * Generate frontend components (React + TypeScript)
   */
  async generateFrontendCode(
    architecture: ArchitectureDocument,
    components: Component[],
    client: OpenRouterClient
  ): Promise<GeneratedCode> {
    const frontendComponents = components.filter(c => c.type === 'frontend');

    if (frontendComponents.length === 0) {
      return {
        files: [],
        summary: {
          totalFiles: 0,
          totalLines: 0,
          requirementsCovered: [],
        },
      };
    }

    const systemPrompt = `You are an expert React and TypeScript developer.

Generate production-ready React components that:
1. Use TypeScript with strict typing
2. Follow React best practices (hooks, composition)
3. Include Vocabotics traceability comments
4. Use modern React patterns (functional components, hooks)
5. Include proper error handling
6. Are fully accessible (ARIA attributes)
7. Include loading and error states
8. Use TailwindCSS for styling

CRITICAL: Every component MUST include Vocabotics tags:
{/* vocabotics-id: "COMPONENT-ID" */}
{/* vocabotics-type: "component|page|layout" */}
{/* vocabotics-requirements: "REQ-F-001,REQ-F-002" */}`;

    const userPrompt = `Generate React components based on these specifications:

**Components:**
${JSON.stringify(frontendComponents, null, 2)}

**Technology Stack:**
- React 18 with TypeScript
- React Router for navigation
- TailwindCSS for styling
- Zustand for state management
- TanStack Query for data fetching

Generate each component as a separate file with:
1. Component code with TypeScript interfaces
2. Vocabotics traceability tags
3. Props validation
4. Error boundaries where appropriate
5. Loading states
6. Responsive design with TailwindCSS

Output as JSON:
{
  "files": [
    {
      "path": "src/components/UserList.tsx",
      "content": "{/* vocabotics-id: \"USER-LIST-001\" */}\\n{/* vocabotics-requirements: \"REQ-F-001\" */}\\nimport React from 'react';\\n\\ninterface User {...}\\n\\nexport function UserList() {...}",
      "vocaboticsId": "USER-LIST-001",
      "requirementIds": ["REQ-F-001"],
      "type": "component"
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
        temperature: 0.4,
        max_tokens: 16000,
      });

      const generatedCode = this.parseGeneratedCode(result.content);

      logger.info('Frontend code generated', {
        files: generatedCode.files.length,
        components: frontendComponents.length,
      });

      return generatedCode;
    } catch (error) {
      logger.error('Frontend code generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate backend code (Express + TypeScript)
   */
  async generateBackendCode(
    architecture: ArchitectureDocument,
    components: Component[],
    client: OpenRouterClient
  ): Promise<GeneratedCode> {
    const backendComponents = components.filter(c => c.type === 'backend' || c.type === 'service');

    if (backendComponents.length === 0) {
      return {
        files: [],
        summary: {
          totalFiles: 0,
          totalLines: 0,
          requirementsCovered: [],
        },
      };
    }

    const systemPrompt = `You are an expert backend developer specializing in Express.js and TypeScript.

Generate production-ready backend code that:
1. Uses TypeScript with strict typing
2. Follows Express best practices
3. Includes Vocabotics traceability comments
4. Implements proper error handling
5. Uses middleware for cross-cutting concerns
6. Includes input validation (Zod)
7. Implements security best practices
8. Uses async/await properly

CRITICAL: Every file MUST include Vocabotics tags:
// vocabotics-id: "SERVICE-ID"
// vocabotics-type: "service|route|controller|middleware"
// vocabotics-requirements: "REQ-F-001,REQ-F-002"`;

    const userPrompt = `Generate backend code based on these specifications:

**Components:**
${JSON.stringify(backendComponents, null, 2)}

**API Contracts:**
${JSON.stringify(architecture.apiContracts.endpoints.slice(0, 10), null, 2)}

**Technology Stack:**
- Express 4.x with TypeScript
- Prisma ORM
- Zod for validation
- JWT for authentication

Generate:
1. Route handlers with Vocabotics tags
2. Service layer with business logic
3. Validation schemas (Zod)
4. Error handling
5. Middleware as needed

Output as JSON:
{
  "files": [
    {
      "path": "src/routes/users.routes.ts",
      "content": "// vocabotics-id: \"USERS-ROUTES-001\"\\n// vocabotics-requirements: \"REQ-F-001\"\\nimport { Router } from 'express';\\n\\nconst router = Router();\\n\\n...",
      "vocaboticsId": "USERS-ROUTES-001",
      "requirementIds": ["REQ-F-001"],
      "type": "route"
    },
    {
      "path": "src/services/users.service.ts",
      "content": "// vocabotics-id: \"USERS-SERVICE-001\"\\n...",
      "vocaboticsId": "USERS-SERVICE-001",
      "requirementIds": ["REQ-F-001"],
      "type": "service"
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
        temperature: 0.4,
        max_tokens: 16000,
      });

      const generatedCode = this.parseGeneratedCode(result.content);

      logger.info('Backend code generated', {
        files: generatedCode.files.length,
        components: backendComponents.length,
      });

      return generatedCode;
    } catch (error) {
      logger.error('Backend code generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate test files
   */
  async generateTests(
    generatedCode: GeneratedCode,
    client: OpenRouterClient
  ): Promise<GeneratedCode> {
    if (generatedCode.files.length === 0) {
      return {
        files: [],
        summary: {
          totalFiles: 0,
          totalLines: 0,
          requirementsCovered: [],
        },
      };
    }

    const systemPrompt = `You are an expert in test-driven development.

Generate comprehensive test suites that:
1. Test all functionality
2. Include edge cases
3. Mock external dependencies
4. Use proper assertions
5. Follow AAA pattern (Arrange, Act, Assert)
6. Target 95%+ code coverage
7. Include Vocabotics traceability

Use:
- Vitest for React components (with React Testing Library)
- Jest + Supertest for backend APIs`;

    const userPrompt = `Generate test files for this code:

${JSON.stringify(generatedCode.files.slice(0, 5), null, 2)}

Generate comprehensive tests including:
1. Unit tests for all functions
2. Integration tests for API endpoints
3. Component tests for React components
4. Edge cases and error scenarios

Output as JSON with same structure as code generation.`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const result = await client.complete({
        model: MODELS.HAIKU_3_5, // Use faster model for tests
        messages,
        temperature: 0.3,
        max_tokens: 12000,
      });

      const testCode = this.parseGeneratedCode(result.content);

      logger.info('Test code generated', {
        files: testCode.files.length,
      });

      return testCode;
    } catch (error) {
      logger.error('Test generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Extract Vocabotics tags from code
   */
  extractVocaboticsTags(code: string): {
    id?: string;
    type?: string;
    requirements: string[];
  } {
    const tags: any = {
      requirements: [],
    };

    // Match comment-based tags
    const idMatch = code.match(/vocabotics-id:\s*["']?([^"'\n]+)["']?/);
    if (idMatch) {
      tags.id = idMatch[1].trim();
    }

    const typeMatch = code.match(/vocabotics-type:\s*["']?([^"'\n]+)["']?/);
    if (typeMatch) {
      tags.type = typeMatch[1].trim();
    }

    const reqMatch = code.match(/vocabotics-requirements:\s*["']?([^"'\n]+)["']?/);
    if (reqMatch) {
      tags.requirements = reqMatch[1]
        .split(',')
        .map(r => r.trim())
        .filter(Boolean);
    }

    return tags;
  }

  /**
   * Validate code has proper Vocabotics tags
   */
  validateVocaboticsTags(files: GeneratedCode['files']): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of files) {
      const tags = this.extractVocaboticsTags(file.content);

      if (!tags.id) {
        errors.push(`File ${file.path} missing vocabotics-id tag`);
      }

      if (!tags.type) {
        warnings.push(`File ${file.path} missing vocabotics-type tag`);
      }

      if (tags.requirements.length === 0) {
        warnings.push(`File ${file.path} missing vocabotics-requirements tag`);
      }

      // Verify tags match metadata
      if (file.vocaboticsId && tags.id !== file.vocaboticsId) {
        warnings.push(
          `File ${file.path} has mismatched vocabotics-id: ${tags.id} vs ${file.vocaboticsId}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Parse generated code from AI response
   */
  private parseGeneratedCode(content: string): GeneratedCode {
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const data = JSON.parse(jsonContent);

    if (!data.files || !Array.isArray(data.files)) {
      throw new Error('Invalid generated code format');
    }

    // Calculate summary
    const totalLines = data.files.reduce((sum: number, file: any) => {
      return sum + (file.content.split('\n').length || 0);
    }, 0);

    const requirementsCovered = Array.from(
      new Set(data.files.flatMap((f: any) => f.requirementIds || []))
    );

    return {
      files: data.files,
      summary: {
        totalFiles: data.files.length,
        totalLines,
        requirementsCovered: requirementsCovered as string[],
      },
    };
  }
}

// Export singleton
export const codeGenerator = new CodeGeneratorService();
