import { OpenRouterClient, OpenRouterMessage, MODELS, AICallMetadata, AICallResult } from '../lib/openrouter';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export interface GenerationOptions {
  projectId?: string;
  userId: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  useUserKey?: boolean; // Use BYOK if available
}

export interface PRDGenerationInput {
  vision: string;
  targetAudience?: string;
  keyFeatures?: string[];
  constraints?: string[];
}

export interface ArchitectureGenerationInput {
  prdContent: any;
  technologyStack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
  };
}

export interface CodeGenerationInput {
  architectureContent: any;
  componentType: 'frontend' | 'backend' | 'database';
  specifications: any;
}

export class AIService {
  private client: OpenRouterClient;

  constructor(client?: OpenRouterClient) {
    this.client = client || new OpenRouterClient();
  }

  /**
   * Get the appropriate API key for a user
   * Prioritizes BYOK if user has one configured
   */
  private async getClientForUser(userId: string, useUserKey: boolean = true): Promise<OpenRouterClient> {
    if (!useUserKey) {
      return this.client;
    }

    // Check if user has BYOK configured
    const userKey = await prisma.userAPIKey.findFirst({
      where: {
        userId,
        provider: 'openrouter',
        isActive: true,
      },
    });

    if (userKey && userKey.encryptedKey) {
      // TODO: Decrypt the key using BYOK manager
      // For now, use default client
      logger.info('User has BYOK configured', { userId });
      return this.client;
    }

    return this.client;
  }

  /**
   * Save AI call record to database
   */
  private async recordAICall(
    result: AICallResult,
    metadata: AICallMetadata
  ): Promise<void> {
    try {
      await prisma.aiCall.create({
        data: {
          projectId: metadata.projectId,
          userId: metadata.userId,
          artifactId: metadata.artifactId,
          model: result.model,
          taskType: metadata.taskType,
          phase: metadata.phase,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          costUsd: result.costUsd,
          durationMs: result.durationMs,
          cached: result.cached,
          generationQualityScore: null, // Can be set later via review
        },
      });

      // Update project totals if projectId is provided
      if (metadata.projectId) {
        await prisma.project.update({
          where: { id: metadata.projectId },
          data: {
            totalAICalls: { increment: 1 },
            totalAICostUsd: { increment: result.costUsd },
          },
        });
      }

      // Update user usage tracking
      if (metadata.userId) {
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

        await prisma.usageTracking.upsert({
          where: {
            userId_periodStart: {
              userId: metadata.userId,
              periodStart,
            },
          },
          create: {
            userId: metadata.userId,
            periodStart,
            periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
            totalAICalls: 1,
            totalTokensUsed: result.usage.totalTokens,
            totalCostUsd: result.costUsd,
            projectsCreated: 0,
            artifactsGenerated: 0,
          },
          update: {
            totalAICalls: { increment: 1 },
            totalTokensUsed: { increment: result.usage.totalTokens },
            totalCostUsd: { increment: result.costUsd },
          },
        });
      }
    } catch (error) {
      logger.error('Failed to record AI call', {
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata,
      });
      // Don't throw - we don't want to fail the generation if recording fails
    }
  }

  /**
   * Generate PRD from vision
   */
  async generatePRD(
    input: PRDGenerationInput,
    options: GenerationOptions
  ): Promise<{ content: any; metadata: AICallResult }> {
    const client = await this.getClientForUser(options.userId, options.useUserKey);

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are an expert product manager and technical architect. Generate a comprehensive Product Requirements Document (PRD) following ISO 9001 and ISO 12207 standards.

The PRD must include:
1. Executive Summary
2. Product Vision & Goals
3. Target Audience & User Personas
4. Functional Requirements (with unique IDs like REQ-F-001)
5. Non-Functional Requirements (REQ-NF-001)
6. User Stories
7. Acceptance Criteria
8. Success Metrics
9. Technical Constraints
10. Dependencies & Risks

Format the response as JSON with this structure:
{
  "title": "Product Title",
  "vision": "Product vision statement",
  "executiveSummary": "Brief summary",
  "targetAudience": [...],
  "userPersonas": [...],
  "functionalRequirements": [{"id": "REQ-F-001", "type": "functional", "priority": "critical|high|medium|low", "description": "..."}],
  "nonFunctionalRequirements": [{"id": "REQ-NF-001", "type": "performance|security|scalability|usability", "description": "..."}],
  "userStories": [{"id": "US-001", "asA": "...", "iWant": "...", "soThat": "...", "requirementIds": ["REQ-F-001"]}],
  "acceptanceCriteria": [...],
  "successMetrics": [...],
  "constraints": [...],
  "dependencies": [...],
  "risks": [...]
}`,
      },
      {
        role: 'user',
        content: `Generate a PRD for the following product vision:

${input.vision}

${input.targetAudience ? `Target Audience: ${input.targetAudience}` : ''}
${input.keyFeatures ? `Key Features: ${input.keyFeatures.join(', ')}` : ''}
${input.constraints ? `Constraints: ${input.constraints.join(', ')}` : ''}

Please generate a comprehensive PRD following the specified format.`,
      },
    ];

    const metadata: AICallMetadata = {
      projectId: options.projectId,
      userId: options.userId,
      taskType: 'prd_generation',
      phase: 'prd_generation',
    };

    const result = await client.complete(
      {
        model: options.model || MODELS.SONNET_4_5,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 8000,
      },
      metadata
    );

    // Record the AI call
    await this.recordAICall(result, metadata);

    // Parse JSON response
    let content;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonContent = result.content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      content = JSON.parse(jsonContent);
    } catch (error) {
      logger.error('Failed to parse PRD JSON', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Return raw content if parsing fails
      content = { raw: result.content };
    }

    return {
      content,
      metadata: result,
    };
  }

  /**
   * Generate Architecture Document from PRD
   */
  async generateArchitecture(
    input: ArchitectureGenerationInput,
    options: GenerationOptions
  ): Promise<{ content: any; metadata: AICallResult }> {
    const client = await this.getClientForUser(options.userId, options.useUserKey);

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are an expert software architect. Generate a comprehensive Software Architecture Document following ISO 12207 standards.

The architecture must include:
1. System Overview & Context
2. Architecture Principles & Patterns
3. Technology Stack (matching the specified stack)
4. System Components & Layers
5. Data Models & Database Schema
6. API Contracts & Endpoints
7. Integration Points
8. Security Architecture
9. Scalability & Performance
10. Deployment Architecture

Format the response as JSON with detailed specifications for each component.`,
      },
      {
        role: 'user',
        content: `Generate an architecture document based on this PRD:

${JSON.stringify(input.prdContent, null, 2)}

Technology Stack to use:
${JSON.stringify(input.technologyStack, null, 2)}

Please generate a comprehensive architecture document following the specified format.`,
      },
    ];

    const metadata: AICallMetadata = {
      projectId: options.projectId,
      userId: options.userId,
      taskType: 'architecture_generation',
      phase: 'architecture_design',
    };

    const result = await client.complete(
      {
        model: options.model || MODELS.SONNET_4_5,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 10000,
      },
      metadata
    );

    await this.recordAICall(result, metadata);

    let content;
    try {
      let jsonContent = result.content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      content = JSON.parse(jsonContent);
    } catch (error) {
      logger.error('Failed to parse Architecture JSON', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      content = { raw: result.content };
    }

    return {
      content,
      metadata: result,
    };
  }

  /**
   * Generate code based on architecture and specifications
   */
  async generateCode(
    input: CodeGenerationInput,
    options: GenerationOptions
  ): Promise<{ content: string; metadata: AICallResult }> {
    const client = await this.getClientForUser(options.userId, options.useUserKey);

    const componentPrompts = {
      frontend: 'Generate React component code with TypeScript, following best practices and the architecture specifications.',
      backend: 'Generate Express API code with TypeScript, including routes, controllers, and services following the architecture specifications.',
      database: 'Generate Prisma schema and migration code based on the data model specifications.',
    };

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are an expert software engineer. Generate production-ready code following best practices, with proper error handling, type safety, and documentation.

IMPORTANT: Add Vocabotics traceability tags to the code:
- vocabotics-id: Unique identifier for the element
- vocabotics-type: Type of element (component, route, service, etc.)
- vocabotics-requirements: Comma-separated requirement IDs this implements

Example for React:
{/* vocabotics-id: "USER-AUTH-LOGIN-001" vocabotics-type: "component" vocabotics-requirements: "REQ-F-001,REQ-F-002" */}

Example for backend:
// vocabotics-id: "API-AUTH-LOGIN-001" vocabotics-type: "route" vocabotics-requirements: "REQ-F-001"

Generate complete, working code that can be directly used in production.`,
      },
      {
        role: 'user',
        content: `${componentPrompts[input.componentType]}

Architecture:
${JSON.stringify(input.architectureContent, null, 2)}

Specifications:
${JSON.stringify(input.specifications, null, 2)}

Generate the code with proper Vocabotics traceability tags.`,
      },
    ];

    const metadata: AICallMetadata = {
      projectId: options.projectId,
      userId: options.userId,
      taskType: 'code_generation',
      phase: 'implementation',
    };

    const result = await client.complete(
      {
        model: options.model || MODELS.SONNET_4_5,
        messages,
        temperature: options.temperature || 0.3, // Lower temperature for code
        max_tokens: options.maxTokens || 12000,
      },
      metadata
    );

    await this.recordAICall(result, metadata);

    return {
      content: result.content,
      metadata: result,
    };
  }

  /**
   * Generate test code for a component
   */
  async generateTests(
    componentCode: string,
    componentType: 'frontend' | 'backend',
    options: GenerationOptions
  ): Promise<{ content: string; metadata: AICallResult }> {
    const client = await this.getClientForUser(options.userId, options.useUserKey);

    const testFrameworks = {
      frontend: 'Vitest and React Testing Library',
      backend: 'Jest and Supertest',
    };

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are an expert in test-driven development. Generate comprehensive test suites using ${testFrameworks[componentType]}.

Tests should include:
1. Unit tests for all functions/methods
2. Integration tests for API endpoints (backend) or component interactions (frontend)
3. Edge cases and error handling
4. Mock data and fixtures
5. Proper setup and teardown

Target 95%+ code coverage.`,
      },
      {
        role: 'user',
        content: `Generate comprehensive tests for this code:

\`\`\`typescript
${componentCode}
\`\`\`

Generate a complete test suite with high coverage.`,
      },
    ];

    const metadata: AICallMetadata = {
      projectId: options.projectId,
      userId: options.userId,
      taskType: 'test_generation',
      phase: 'testing',
    };

    const result = await client.complete(
      {
        model: options.model || MODELS.HAIKU_3_5, // Use faster/cheaper model for tests
        messages,
        temperature: 0.3,
        max_tokens: 8000,
      },
      metadata
    );

    await this.recordAICall(result, metadata);

    return {
      content: result.content,
      metadata: result,
    };
  }

  /**
   * Analyze image (for vision-based features)
   */
  async analyzeImage(
    imageUrl: string,
    prompt: string,
    options: GenerationOptions
  ): Promise<{ content: string; metadata: AICallResult }> {
    const client = await this.getClientForUser(options.userId, options.useUserKey);

    const messages: OpenRouterMessage[] = [
      {
        role: 'user',
        content: `${prompt}

Image URL: ${imageUrl}`,
      },
    ];

    const metadata: AICallMetadata = {
      projectId: options.projectId,
      userId: options.userId,
      taskType: 'image_analysis',
      phase: 'vision_input',
    };

    const result = await client.complete(
      {
        model: MODELS.SONNET_4_5_VISION, // Vision-capable model
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      },
      metadata
    );

    await this.recordAICall(result, metadata);

    return {
      content: result.content,
      metadata: result,
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
