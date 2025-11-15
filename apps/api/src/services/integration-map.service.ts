import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { codeGenerator } from './generators/code-generator.service';

export interface IntegrationElement {
  vocaboticsId: string;
  elementType: 'component' | 'route' | 'service' | 'database';
  name: string;
  filePath: string;
  requirementIds: string[];
  dependencies: string[];
  apiEndpoint?: string;
  databaseOperations?: string[];
  testFiles?: string[];
}

export interface IntegrationMap {
  projectId: string;
  elements: IntegrationElement[];
  relationships: {
    from: string; // vocaboticsId
    to: string; // vocaboticsId
    type: 'calls' | 'queries' | 'renders' | 'tests';
    description: string;
  }[];
  coverage: {
    totalRequirements: number;
    implementedRequirements: number;
    coveragePercentage: number;
    missingRequirements: string[];
  };
}

/**
 * Integration Map Service
 * Maps complete FE → BE → DB traceability with Vocabotics tags
 */
export class IntegrationMapService {
  /**
   * Build integration map from project artifacts
   */
  async buildIntegrationMap(projectId: string): Promise<IntegrationMap> {
    logger.info('Building integration map', { projectId });

    try {
      // Get all artifacts for the project
      const artifacts = await prisma.artifact.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      // Extract integration elements from code artifacts
      const elements: IntegrationElement[] = [];
      const codeArtifacts = artifacts.filter(a =>
        a.type.startsWith('code_') || a.type === 'tests'
      );

      for (const artifact of codeArtifacts) {
        const extractedElements = this.extractElementsFromArtifact(artifact);
        elements.push(...extractedElements);
      }

      // Build relationships between elements
      const relationships = this.buildRelationships(elements);

      // Calculate requirement coverage
      const coverage = await this.calculateCoverage(projectId, elements);

      // Store integration map
      await this.storeIntegrationMap(projectId, elements);

      const map: IntegrationMap = {
        projectId,
        elements,
        relationships,
        coverage,
      };

      logger.info('Integration map built', {
        projectId,
        elements: elements.length,
        relationships: relationships.length,
        coverage: coverage.coveragePercentage,
      });

      return map;
    } catch (error) {
      logger.error('Failed to build integration map', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Extract integration elements from artifact
   */
  private extractElementsFromArtifact(artifact: any): IntegrationElement[] {
    const elements: IntegrationElement[] = [];

    if (!artifact.content || typeof artifact.content !== 'object') {
      return elements;
    }

    // Handle code artifacts
    if (artifact.content.files && Array.isArray(artifact.content.files)) {
      for (const file of artifact.content.files) {
        const tags = codeGenerator.extractVocaboticsTags(file.content);

        if (tags.id) {
          const element: IntegrationElement = {
            vocaboticsId: tags.id,
            elementType: this.inferElementType(tags.type, file.path),
            name: this.extractElementName(file.path, file.content),
            filePath: file.path,
            requirementIds: tags.requirements || [],
            dependencies: this.extractDependencies(file.content),
            apiEndpoint: this.extractAPIEndpoint(file.content),
            databaseOperations: this.extractDatabaseOperations(file.content),
            testFiles: [],
          };

          elements.push(element);
        }
      }
    }

    return elements;
  }

  /**
   * Infer element type from tags and file path
   */
  private inferElementType(
    tagType: string | undefined,
    filePath: string
  ): 'component' | 'route' | 'service' | 'database' {
    if (tagType) {
      if (tagType === 'component' || tagType === 'page' || tagType === 'layout') {
        return 'component';
      }
      if (tagType === 'route' || tagType === 'controller') {
        return 'route';
      }
      if (tagType === 'service') {
        return 'service';
      }
      if (tagType === 'model' || tagType === 'schema') {
        return 'database';
      }
    }

    // Infer from file path
    if (filePath.includes('/components/') || filePath.includes('/pages/')) {
      return 'component';
    }
    if (filePath.includes('/routes/') || filePath.includes('/controllers/')) {
      return 'route';
    }
    if (filePath.includes('/services/')) {
      return 'service';
    }
    if (filePath.includes('/prisma/') || filePath.includes('/models/')) {
      return 'database';
    }

    return 'service'; // default
  }

  /**
   * Extract element name from file path and content
   */
  private extractElementName(filePath: string, content: string): string {
    // Try to extract from export statement
    const exportMatch = content.match(/export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)/);
    if (exportMatch) {
      return exportMatch[1];
    }

    // Use file name
    const fileName = filePath.split('/').pop() || 'unknown';
    return fileName.replace(/\.(tsx?|jsx?)$/, '');
  }

  /**
   * Extract dependencies from code
   */
  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];

    // Extract import statements
    const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"](.+?)['"]/g);
    for (const match of importMatches) {
      if (!match[1].startsWith('.') && !match[1].startsWith('@/')) {
        dependencies.push(match[1]);
      }
    }

    // Extract function calls that might be dependencies
    const functionCallMatches = content.matchAll(/(\w+Service|api\.\w+)\(/g);
    for (const match of functionCallMatches) {
      dependencies.push(match[1]);
    }

    return Array.from(new Set(dependencies));
  }

  /**
   * Extract API endpoint from code
   */
  private extractAPIEndpoint(content: string): string | undefined {
    // Look for route definitions
    const routeMatch = content.match(/router\.(get|post|put|patch|delete)\(['"](.+?)['"]/);
    if (routeMatch) {
      return `${routeMatch[1].toUpperCase()} ${routeMatch[2]}`;
    }

    // Look for API calls
    const apiMatch = content.match(/(?:axios|fetch|api)\.\w+\(['"](.+?)['"]/);
    if (apiMatch) {
      return apiMatch[1];
    }

    return undefined;
  }

  /**
   * Extract database operations from code
   */
  private extractDatabaseOperations(content: string): string[] {
    const operations: string[] = [];

    // Prisma operations
    const prismaMatches = content.matchAll(/prisma\.(\w+)\.(findMany|findUnique|findFirst|create|update|delete|upsert|count|aggregate)/g);
    for (const match of prismaMatches) {
      operations.push(`${match[1]}.${match[2]}`);
    }

    return operations;
  }

  /**
   * Build relationships between elements
   */
  private buildRelationships(elements: IntegrationElement[]) {
    const relationships: IntegrationMap['relationships'] = [];

    for (const element of elements) {
      // API call relationships
      if (element.elementType === 'component' && element.apiEndpoint) {
        const backendElement = elements.find(
          e => e.elementType === 'route' && e.apiEndpoint === element.apiEndpoint
        );
        if (backendElement) {
          relationships.push({
            from: element.vocaboticsId,
            to: backendElement.vocaboticsId,
            type: 'calls',
            description: `Component calls API endpoint ${element.apiEndpoint}`,
          });
        }
      }

      // Service → Database relationships
      if (element.elementType === 'service' && element.databaseOperations) {
        for (const operation of element.databaseOperations) {
          const [model] = operation.split('.');
          const dbElement = elements.find(
            e => e.elementType === 'database' && e.name.toLowerCase().includes(model.toLowerCase())
          );
          if (dbElement) {
            relationships.push({
              from: element.vocaboticsId,
              to: dbElement.vocaboticsId,
              type: 'queries',
              description: `Service performs ${operation} on database`,
            });
          }
        }
      }

      // Route → Service relationships
      if (element.elementType === 'route') {
        const services = element.dependencies.filter(d => d.includes('Service'));
        for (const serviceName of services) {
          const serviceElement = elements.find(
            e => e.elementType === 'service' && e.name === serviceName
          );
          if (serviceElement) {
            relationships.push({
              from: element.vocaboticsId,
              to: serviceElement.vocaboticsId,
              type: 'calls',
              description: `Route uses ${serviceName}`,
            });
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Calculate requirement coverage
   */
  private async calculateCoverage(projectId: string, elements: IntegrationElement[]) {
    // Get all requirements from PRD
    const prdArtifact = await prisma.artifact.findFirst({
      where: {
        projectId,
        type: 'prd',
      },
      orderBy: { version: 'desc' },
    });

    if (!prdArtifact || !prdArtifact.content) {
      return {
        totalRequirements: 0,
        implementedRequirements: 0,
        coveragePercentage: 0,
        missingRequirements: [],
      };
    }

    const prd = prdArtifact.content as any;
    const allRequirements = [
      ...(prd.functionalRequirements || []).map((r: any) => r.id),
      ...(prd.nonFunctionalRequirements || []).map((r: any) => r.id),
    ];

    // Get implemented requirements from elements
    const implementedRequirements = new Set(
      elements.flatMap(e => e.requirementIds)
    );

    const missingRequirements = allRequirements.filter(
      (reqId: string) => !implementedRequirements.has(reqId)
    );

    return {
      totalRequirements: allRequirements.length,
      implementedRequirements: implementedRequirements.size,
      coveragePercentage: allRequirements.length > 0
        ? (implementedRequirements.size / allRequirements.length) * 100
        : 0,
      missingRequirements,
    };
  }

  /**
   * Store integration map in database
   */
  private async storeIntegrationMap(
    projectId: string,
    elements: IntegrationElement[]
  ): Promise<void> {
    // Store each element in database
    for (const element of elements) {
      await prisma.integrationElement.upsert({
        where: {
          vocaboticsId: element.vocaboticsId,
        },
        create: {
          vocaboticsId: element.vocaboticsId,
          projectId,
          elementType: element.elementType,
          name: element.name,
          filePath: element.filePath,
          requirementIds: element.requirementIds,
          dependencies: element.dependencies,
          apiEndpoint: element.apiEndpoint,
          databaseOperations: element.databaseOperations || [],
          testFiles: element.testFiles || [],
        },
        update: {
          elementType: element.elementType,
          name: element.name,
          filePath: element.filePath,
          requirementIds: element.requirementIds,
          dependencies: element.dependencies,
          apiEndpoint: element.apiEndpoint,
          databaseOperations: element.databaseOperations || [],
          testFiles: element.testFiles || [],
        },
      });
    }

    logger.info('Integration elements stored', {
      projectId,
      count: elements.length,
    });
  }

  /**
   * Get integration map for project
   */
  async getIntegrationMap(projectId: string): Promise<IntegrationMap> {
    const elements = await prisma.integrationElement.findMany({
      where: { projectId },
    });

    const mappedElements: IntegrationElement[] = elements.map(e => ({
      vocaboticsId: e.vocaboticsId,
      elementType: e.elementType as any,
      name: e.name,
      filePath: e.filePath,
      requirementIds: e.requirementIds,
      dependencies: e.dependencies,
      apiEndpoint: e.apiEndpoint || undefined,
      databaseOperations: e.databaseOperations,
      testFiles: e.testFiles,
    }));

    const relationships = this.buildRelationships(mappedElements);
    const coverage = await this.calculateCoverage(projectId, mappedElements);

    return {
      projectId,
      elements: mappedElements,
      relationships,
      coverage,
    };
  }

  /**
   * Get element by ID
   */
  async getElement(vocaboticsId: string): Promise<IntegrationElement | null> {
    const element = await prisma.integrationElement.findUnique({
      where: { vocaboticsId },
    });

    if (!element) {
      return null;
    }

    return {
      vocaboticsId: element.vocaboticsId,
      elementType: element.elementType as any,
      name: element.name,
      filePath: element.filePath,
      requirementIds: element.requirementIds,
      dependencies: element.dependencies,
      apiEndpoint: element.apiEndpoint || undefined,
      databaseOperations: element.databaseOperations,
      testFiles: element.testFiles,
    };
  }

  /**
   * Analyze impact of changing a requirement
   */
  async analyzeImpact(projectId: string, requirementId: string) {
    const elements = await prisma.integrationElement.findMany({
      where: {
        projectId,
        requirementIds: {
          has: requirementId,
        },
      },
    });

    // Get all downstream dependencies
    const allElements = await prisma.integrationElement.findMany({
      where: { projectId },
    });

    const mappedElements: IntegrationElement[] = allElements.map(e => ({
      vocaboticsId: e.vocaboticsId,
      elementType: e.elementType as any,
      name: e.name,
      filePath: e.filePath,
      requirementIds: e.requirementIds,
      dependencies: e.dependencies,
      apiEndpoint: e.apiEndpoint || undefined,
      databaseOperations: e.databaseOperations,
      testFiles: e.testFiles,
    }));

    const relationships = this.buildRelationships(mappedElements);

    // Find all elements that depend on the affected elements
    const affectedIds = new Set(elements.map(e => e.vocaboticsId));
    const impactedIds = new Set<string>();

    for (const rel of relationships) {
      if (affectedIds.has(rel.to)) {
        impactedIds.add(rel.from);
      }
    }

    const impactedElements = mappedElements.filter(e =>
      impactedIds.has(e.vocaboticsId)
    );

    return {
      requirementId,
      directlyAffected: elements.length,
      indirectlyAffected: impactedElements.length,
      totalImpact: elements.length + impactedElements.length,
      affectedElements: elements.map(e => ({
        id: e.vocaboticsId,
        type: e.elementType,
        name: e.name,
        path: e.filePath,
      })),
      impactedElements: impactedElements.map(e => ({
        id: e.vocaboticsId,
        type: e.elementType,
        name: e.name,
        path: e.filePath,
      })),
    };
  }
}

// Export singleton
export const integrationMapService = new IntegrationMapService();
