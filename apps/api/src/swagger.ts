import { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vocabotics API',
      version: '1.0.0',
      description: `
        Vocabotics Platform API - AI-powered software development platform

        ## Overview

        Vocabotics follows the "Orchestration > Iteration" principle, using AI orchestration
        to generate complete, production-ready applications from high-level vision statements.

        ## Authentication

        Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:
        \`\`\`
        Authorization: Bearer <your-jwt-token>
        \`\`\`

        ## Key Features

        - **PRD Generation**: Transform vision into ISO-compliant requirements
        - **Architecture Design**: Generate complete system architecture
        - **Code Generation**: Produce frontend and backend code with Vocabotics tags
        - **Integration Mapping**: Track FE→BE→DB traceability
        - **Quality Metrics**: ISO 9001, ISO 12207, WCAG 2.1 compliance
        - **Visual Testing**: Puppeteer-based screenshot validation
        - **Subscription Management**: Stripe integration for billing
      `,
      contact: {
        name: 'Vocabotics API Support',
        url: 'https://vocabotics.com/support',
      },
      license: {
        name: 'Proprietary',
        url: 'https://vocabotics.com/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.vocabotics.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              description: 'User account status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Project ID',
            },
            name: {
              type: 'string',
              description: 'Project name',
            },
            description: {
              type: 'string',
              description: 'Project description',
            },
            status: {
              type: 'string',
              enum: [
                'created',
                'prd_generation',
                'prd_review',
                'architecture_generation',
                'architecture_review',
                'code_generation',
                'testing',
                'completed',
                'failed',
              ],
              description: 'Current project status',
            },
            currentPhase: {
              type: 'string',
              description: 'Current workflow phase',
            },
            progress: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Overall project progress percentage',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Project creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        PRDDocument: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'PRD title',
            },
            version: {
              type: 'string',
              description: 'PRD version',
            },
            vision: {
              type: 'string',
              description: 'Product vision statement',
            },
            executiveSummary: {
              type: 'string',
              description: 'Executive summary',
            },
            targetAudience: {
              type: 'object',
              properties: {
                primary: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Primary target audience',
                },
                secondary: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Secondary target audience',
                },
              },
            },
            functionalRequirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                  },
                  category: { type: 'string' },
                },
              },
            },
            complianceStandards: {
              type: 'array',
              items: { type: 'string' },
              description: 'ISO and compliance standards (9001, 12207, WCAG)',
            },
          },
        },
        QualityMetrics: {
          type: 'object',
          properties: {
            overallScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Overall quality score (weighted average)',
            },
            testCoverage: {
              type: 'object',
              properties: {
                lines: { type: 'number', description: 'Line coverage %' },
                statements: { type: 'number', description: 'Statement coverage %' },
                functions: { type: 'number', description: 'Function coverage %' },
                branches: { type: 'number', description: 'Branch coverage %' },
              },
            },
            codeQuality: {
              type: 'object',
              properties: {
                totalFiles: { type: 'number' },
                totalLines: { type: 'number' },
                vocaboticsTagCoverage: {
                  type: 'number',
                  description: 'Percentage of components with Vocabotics tags',
                },
              },
            },
            requirementCoverage: {
              type: 'object',
              properties: {
                totalRequirements: { type: 'number' },
                implementedRequirements: { type: 'number' },
                testedRequirements: { type: 'number' },
                coveragePercentage: { type: 'number' },
              },
            },
          },
        },
        IntegrationMap: {
          type: 'object',
          properties: {
            elements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  vocaboticsId: { type: 'string', description: 'Unique Vocabotics ID' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  layer: {
                    type: 'string',
                    enum: ['frontend', 'backend', 'database'],
                  },
                  filePath: { type: 'string' },
                  requirements: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Linked requirement IDs',
                  },
                },
              },
            },
            relationships: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string', description: 'Source element ID' },
                  to: { type: 'string', description: 'Target element ID' },
                  type: {
                    type: 'string',
                    enum: ['calls', 'renders', 'queries', 'tests'],
                  },
                },
              },
            },
            coverage: {
              type: 'object',
              properties: {
                totalElements: { type: 'number' },
                mappedElements: { type: 'number' },
                unmappedElements: { type: 'number' },
                coveragePercentage: { type: 'number' },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Projects',
        description: 'Project management and CRUD operations',
      },
      {
        name: 'Workflow',
        description: 'Workflow orchestration and state management',
      },
      {
        name: 'Generation',
        description: 'AI-powered artifact generation (PRD, Architecture, Code)',
      },
      {
        name: 'Quality',
        description: 'Quality metrics and compliance validation',
      },
      {
        name: 'Integration Map',
        description: 'FE→BE→DB traceability and impact analysis',
      },
      {
        name: 'Testing',
        description: 'Test execution and visual validation',
      },
      {
        name: 'Subscription',
        description: 'Stripe subscription and billing management',
      },
      {
        name: 'Admin',
        description: 'Platform administration and analytics',
      },
      {
        name: 'Keys',
        description: 'BYOK (Bring Your Own Key) management',
      },
    ],
  },
  apis: [
    './src/routes/*.ts', // Path to route files with JSDoc annotations
    './src/routes/**/*.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger documentation
 */
export function setupSwagger(app: Express): void {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Vocabotics API Documentation',
  }));

  // Swagger JSON
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger documentation available at /api-docs');
}

export default swaggerSpec;
