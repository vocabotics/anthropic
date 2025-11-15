import { OpenRouterClient, MODELS } from '../../lib/openrouter';
import { logger } from '../../utils/logger';
import { PRDDocument } from './prd-generator.service';
import { ArchitectureDocument } from './architecture-generator.service';
import { codeGenerator } from './code-generator.service';
import { schemaGenerator } from './schema-generator.service';
import { apiGenerator } from './api-generator.service';
import { scaffoldingService } from '../scaffolding.service';
import { GeneratedCode } from './code-generator.service';

export interface CompleteProject {
  prd: PRDDocument;
  architecture: ArchitectureDocument;
  schema: {
    prisma: string;
    migrations: any[];
  };
  api: {
    openapi: any;
    routes: any[];
  };
  code: {
    frontend: GeneratedCode;
    backend: GeneratedCode;
    tests: GeneratedCode;
  };
  scaffold: any;
  summary: {
    totalFiles: number;
    totalLines: number;
    requirementsCovered: string[];
    estimatedCost: number;
    generationTime: number;
  };
}

/**
 * Complete Project Generator
 * Orchestrates generation of entire project from vision
 */
export class ProjectGeneratorService {
  /**
   * Generate complete project from PRD and Architecture
   */
  async generateCompleteProject(
    prd: PRDDocument,
    architecture: ArchitectureDocument,
    client: OpenRouterClient,
    projectId: string
  ): Promise<CompleteProject> {
    const startTime = Date.now();
    let totalCost = 0;

    logger.info('Starting complete project generation', {
      projectId,
      prd: prd.title,
      architecture: architecture.title,
    });

    try {
      // 1. Generate Prisma schema
      logger.info('Generating database schema...');
      const schemaResult = await schemaGenerator.generatePrismaSchema(
        architecture,
        client
      );

      const migrationsResult = await schemaGenerator.generateMigrations(
        architecture,
        client
      );

      // 2. Generate API specifications
      logger.info('Generating API specifications...');
      const openAPISpec = await apiGenerator.generateOpenAPISpec(
        architecture,
        client
      );

      const routeImplementations = await apiGenerator.generateRouteImplementations(
        architecture,
        client
      );

      // 3. Generate backend code
      logger.info('Generating backend code...');
      const backendCode = await codeGenerator.generateBackendCode(
        architecture,
        architecture.components.filter(c => c.type === 'backend' || c.type === 'service'),
        client
      );

      // 4. Generate frontend code
      logger.info('Generating frontend code...');
      const frontendCode = await codeGenerator.generateFrontendCode(
        architecture,
        architecture.components.filter(c => c.type === 'frontend'),
        client
      );

      // 5. Generate tests
      logger.info('Generating tests...');
      const backendTests = await codeGenerator.generateTests(backendCode, client);
      const frontendTests = await codeGenerator.generateTests(frontendCode, client);

      const allTests: GeneratedCode = {
        files: [...backendTests.files, ...frontendTests.files],
        summary: {
          totalFiles: backendTests.summary.totalFiles + frontendTests.summary.totalFiles,
          totalLines: backendTests.summary.totalLines + frontendTests.summary.totalLines,
          requirementsCovered: Array.from(
            new Set([
              ...backendTests.summary.requirementsCovered,
              ...frontendTests.summary.requirementsCovered,
            ])
          ),
        },
      };

      // 6. Generate project scaffold
      logger.info('Generating project scaffold...');
      const scaffold = await scaffoldingService.generateProjectScaffold(
        projectId,
        architecture.technologyStack
      );

      // Merge all generated code into scaffold
      await scaffoldingService.mergeGeneratedCode(scaffold, backendCode);
      await scaffoldingService.mergeGeneratedCode(scaffold, frontendCode);
      await scaffoldingService.mergeGeneratedCode(scaffold, allTests);

      // Add schema files
      scaffold.structure.files.push({
        path: 'apps/api/prisma/schema.prisma',
        content: schemaResult.fullSchema,
        description: 'Prisma database schema',
      });

      for (const migration of migrationsResult) {
        scaffold.structure.files.push({
          path: `apps/api/prisma/migrations/${migration.id}.sql`,
          content: migration.sql,
          description: migration.description,
        });
      }

      // Add OpenAPI spec
      scaffold.structure.files.push({
        path: 'docs/openapi.json',
        content: JSON.stringify(openAPISpec, null, 2),
        description: 'OpenAPI 3.0 specification',
      });

      const generationTime = Date.now() - startTime;

      // Calculate totals
      const totalFiles =
        backendCode.summary.totalFiles +
        frontendCode.summary.totalFiles +
        allTests.summary.totalFiles +
        schemaResult.models.length +
        1; // OpenAPI spec

      const totalLines =
        backendCode.summary.totalLines +
        frontendCode.summary.totalLines +
        allTests.summary.totalLines;

      const requirementsCovered = Array.from(
        new Set([
          ...backendCode.summary.requirementsCovered,
          ...frontendCode.summary.requirementsCovered,
          ...allTests.summary.requirementsCovered,
        ])
      );

      const completeProject: CompleteProject = {
        prd,
        architecture,
        schema: {
          prisma: schemaResult.fullSchema,
          migrations: migrationsResult,
        },
        api: {
          openapi: openAPISpec,
          routes: routeImplementations,
        },
        code: {
          frontend: frontendCode,
          backend: backendCode,
          tests: allTests,
        },
        scaffold,
        summary: {
          totalFiles,
          totalLines,
          requirementsCovered,
          estimatedCost: totalCost,
          generationTime,
        },
      };

      logger.info('Complete project generated successfully', {
        projectId,
        totalFiles,
        totalLines,
        requirementsCovered: requirementsCovered.length,
        generationTimeMs: generationTime,
      });

      return completeProject;
    } catch (error) {
      logger.error('Complete project generation failed', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate package installation scripts
   */
  generateInstallationGuide(project: CompleteProject): string {
    return `# Installation Guide for ${project.prd.title}

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- pnpm (recommended)

## Quick Start

\`\`\`bash
# 1. Clone or extract the project
cd ${project.scaffold.projectName}

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Initialize database
cd apps/api
pnpm prisma:generate
pnpm prisma:push
pnpm prisma:seed

# 5. Start development
cd ../..
pnpm dev
\`\`\`

## What's Included

- ✅ ${project.summary.totalFiles} files generated
- ✅ ${project.summary.totalLines} lines of code
- ✅ ${project.summary.requirementsCovered.length} requirements implemented
- ✅ Complete test suite
- ✅ CI/CD pipeline
- ✅ Production-ready configuration

## Next Steps

1. Review the generated code in your IDE
2. Run tests: \`pnpm test\`
3. Build for production: \`pnpm build\`
4. Deploy to your hosting provider

## Documentation

- PRD: See \`docs/PRD.md\`
- Architecture: See \`docs/ARCHITECTURE.md\`
- API Reference: See \`docs/openapi.json\`

## Generated by Vocabotics

This project was generated using Vocabotics AI platform.
**Orchestration > Iteration**: Complete, production-ready code with full requirement traceability.

Generation time: ${(project.summary.generationTime / 1000).toFixed(2)}s
`;
  }

  /**
   * Validate complete project
   */
  validateProject(project: CompleteProject): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check PRD requirements coverage
    const allPRDRequirements = [
      ...project.prd.functionalRequirements.map(r => r.id),
      ...project.prd.nonFunctionalRequirements.map(r => r.id),
    ];

    const coveredRequirements = new Set(project.summary.requirementsCovered);

    for (const reqId of allPRDRequirements) {
      if (!coveredRequirements.has(reqId)) {
        warnings.push(`Requirement ${reqId} not covered by generated code`);
      }
    }

    // Check code has Vocabotics tags
    const codeValidation = codeGenerator.validateVocaboticsTags([
      ...project.code.backend.files,
      ...project.code.frontend.files,
    ]);

    errors.push(...codeValidation.errors);
    warnings.push(...codeValidation.warnings);

    // Check schema validation
    const schemaValidation = schemaGenerator.validateSchema(
      project.architecture.dataModels,
      project.schema.prisma
    );

    errors.push(...schemaValidation.errors);
    warnings.push(...schemaValidation.warnings);

    // Check API spec validation
    const apiValidation = apiGenerator.validateOpenAPISpec(project.api.openapi);

    errors.push(...apiValidation.errors);
    warnings.push(...apiValidation.warnings);

    const coveragePercent = (coveredRequirements.size / allPRDRequirements.length) * 100;

    if (coveragePercent < 80) {
      errors.push(
        `Only ${coveragePercent.toFixed(1)}% of requirements covered (minimum 80% required)`
      );
    } else if (coveragePercent < 100) {
      warnings.push(
        `${coveragePercent.toFixed(1)}% of requirements covered (100% recommended)`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export singleton
export const projectGenerator = new ProjectGeneratorService();
