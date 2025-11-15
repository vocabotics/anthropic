import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { testExecutionService } from './test-execution.service';
import { integrationMapService } from './integration-map.service';

export interface QualityMetrics {
  projectId: string;
  timestamp: Date;

  // Test Coverage
  testCoverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
    overallScore: number;
  };

  // Code Quality
  codeQuality: {
    totalFiles: number;
    totalLines: number;
    vocaboticsTagsCount: number;
    vocaboticsTagsCoverage: number; // percentage of files with tags
    eslintErrors: number;
    eslintWarnings: number;
    qualityScore: number; // 0-100
  };

  // Requirement Coverage
  requirementCoverage: {
    totalRequirements: number;
    implementedRequirements: number;
    testedRequirements: number;
    coveragePercentage: number;
    missingRequirements: string[];
  };

  // AI Generation Quality
  aiQuality: {
    totalAICalls: number;
    totalCost: number;
    averageResponseTime: number;
    cacheHitRate: number;
    generationQualityAverage: number; // 0-100
  };

  // Performance
  performance: {
    buildTime?: number;
    testExecutionTime?: number;
    averageResponseTime?: number;
  };

  // Security
  security: {
    vulnerabilitiesCount: number;
    criticalVulnerabilities: number;
    securityScore: number; // 0-100
  };

  // Overall Quality Score
  overallScore: number; // weighted average of all scores
}

/**
 * Quality Metrics Service
 * Calculates and tracks quality metrics for projects
 */
export class QualityMetricsService {
  /**
   * Calculate quality metrics for a project
   */
  async calculateMetrics(projectId: string): Promise<QualityMetrics> {
    logger.info('Calculating quality metrics', { projectId });

    try {
      const [
        testCoverage,
        codeQuality,
        requirementCoverage,
        aiQuality,
        performance,
        security,
      ] = await Promise.all([
        this.calculateTestCoverage(projectId),
        this.calculateCodeQuality(projectId),
        this.calculateRequirementCoverage(projectId),
        this.calculateAIQuality(projectId),
        this.calculatePerformance(projectId),
        this.calculateSecurity(projectId),
      ]);

      // Calculate overall score (weighted average)
      const overallScore = this.calculateOverallScore({
        testCoverage: testCoverage.overallScore,
        codeQuality: codeQuality.qualityScore,
        requirementCoverage: requirementCoverage.coveragePercentage,
        securityScore: security.securityScore,
      });

      const metrics: QualityMetrics = {
        projectId,
        timestamp: new Date(),
        testCoverage,
        codeQuality,
        requirementCoverage,
        aiQuality,
        performance,
        security,
        overallScore,
      };

      // Store metrics
      await this.storeMetrics(metrics);

      logger.info('Quality metrics calculated', {
        projectId,
        overallScore,
        testCoverage: testCoverage.overallScore,
        requirementCoverage: requirementCoverage.coveragePercentage,
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to calculate quality metrics', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Calculate test coverage metrics
   */
  private async calculateTestCoverage(projectId: string) {
    const latestTestRun = await testExecutionService.getLatestTestRun(projectId);

    if (!latestTestRun || !latestTestRun.coveragePercentage) {
      return {
        lines: 0,
        statements: 0,
        functions: 0,
        branches: 0,
        overallScore: 0,
      };
    }

    // For now, use the coverage percentage from test run
    // In future, parse detailed coverage reports
    const coverage = latestTestRun.coveragePercentage.toNumber();

    return {
      lines: coverage,
      statements: coverage,
      functions: coverage,
      branches: coverage,
      overallScore: coverage,
    };
  }

  /**
   * Calculate code quality metrics
   */
  private async calculateCodeQuality(projectId: string) {
    // Get all code artifacts
    const codeArtifacts = await prisma.artifact.findMany({
      where: {
        projectId,
        type: {
          in: ['code_frontend', 'code_backend', 'tests'],
        },
      },
    });

    let totalFiles = 0;
    let totalLines = 0;
    let filesWithTags = 0;

    for (const artifact of codeArtifacts) {
      if (artifact.content && typeof artifact.content === 'object') {
        const content = artifact.content as any;
        if (content.files && Array.isArray(content.files)) {
          totalFiles += content.files.length;

          for (const file of content.files) {
            const lines = file.content.split('\n').length;
            totalLines += lines;

            // Check for Vocabotics tags
            if (
              file.content.includes('vocabotics-id') ||
              file.content.includes('vocabotics-type') ||
              file.content.includes('vocabotics-requirements')
            ) {
              filesWithTags++;
            }
          }
        }
      }
    }

    const vocaboticsTagsCoverage = totalFiles > 0
      ? (filesWithTags / totalFiles) * 100
      : 0;

    // Quality score based on tag coverage and code organization
    const qualityScore = Math.min(
      100,
      vocaboticsTagsCoverage * 0.7 + // 70% weight on tag coverage
      (totalFiles > 0 ? 30 : 0) // 30% for having any code
    );

    return {
      totalFiles,
      totalLines,
      vocaboticsTagsCount: filesWithTags,
      vocaboticsTagsCoverage,
      eslintErrors: 0, // TODO: Run ESLint
      eslintWarnings: 0, // TODO: Run ESLint
      qualityScore,
    };
  }

  /**
   * Calculate requirement coverage
   */
  private async calculateRequirementCoverage(projectId: string) {
    const integrationMap = await integrationMapService.getIntegrationMap(projectId);

    const { coverage } = integrationMap;

    // Get tested requirements
    const testArtifacts = await prisma.artifact.findMany({
      where: {
        projectId,
        type: 'tests',
      },
    });

    const testedRequirements = new Set<string>();
    for (const artifact of testArtifacts) {
      if (artifact.content && typeof artifact.content === 'object') {
        const content = artifact.content as any;
        if (content.files && Array.isArray(content.files)) {
          for (const file of content.files) {
            // Extract requirement IDs from test file comments
            const reqMatches = file.content.matchAll(/vocabotics-requirements:\s*["']?([^"'\n]+)["']?/g);
            for (const match of reqMatches) {
              const reqIds = match[1].split(',').map(id => id.trim());
              reqIds.forEach(id => testedRequirements.add(id));
            }
          }
        }
      }
    }

    return {
      totalRequirements: coverage.totalRequirements,
      implementedRequirements: coverage.implementedRequirements,
      testedRequirements: testedRequirements.size,
      coveragePercentage: coverage.coveragePercentage,
      missingRequirements: coverage.missingRequirements,
    };
  }

  /**
   * Calculate AI quality metrics
   */
  private async calculateAIQuality(projectId: string) {
    const aiCalls = await prisma.aiCall.findMany({
      where: { projectId },
    });

    if (aiCalls.length === 0) {
      return {
        totalAICalls: 0,
        totalCost: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        generationQualityAverage: 0,
      };
    }

    const totalCost = aiCalls.reduce((sum, call) => sum + call.costUsd.toNumber(), 0);
    const averageResponseTime = aiCalls.reduce((sum, call) => sum + call.durationMs, 0) / aiCalls.length;
    const cachedCalls = aiCalls.filter(call => call.cached).length;
    const cacheHitRate = (cachedCalls / aiCalls.length) * 100;

    // Calculate average quality score (if available)
    const callsWithQuality = aiCalls.filter(call => call.generationQualityScore !== null);
    const generationQualityAverage = callsWithQuality.length > 0
      ? callsWithQuality.reduce((sum, call) => sum + (call.generationQualityScore || 0), 0) / callsWithQuality.length
      : 0;

    return {
      totalAICalls: aiCalls.length,
      totalCost,
      averageResponseTime,
      cacheHitRate,
      generationQualityAverage,
    };
  }

  /**
   * Calculate performance metrics
   */
  private async calculatePerformance(projectId: string) {
    const latestTestRun = await testExecutionService.getLatestTestRun(projectId);

    return {
      buildTime: undefined, // TODO: Track build time
      testExecutionTime: latestTestRun?.duration || undefined,
      averageResponseTime: undefined, // TODO: Track API response times
    };
  }

  /**
   * Calculate security metrics
   */
  private async calculateSecurity(projectId: string) {
    // TODO: Integrate with security scanning tools (Snyk, OWASP)
    // For now, return safe defaults

    return {
      vulnerabilitiesCount: 0,
      criticalVulnerabilities: 0,
      securityScore: 100, // Assume secure until proven otherwise
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(scores: {
    testCoverage: number;
    codeQuality: number;
    requirementCoverage: number;
    securityScore: number;
  }): number {
    // Weighted average
    const weights = {
      testCoverage: 0.25,
      codeQuality: 0.25,
      requirementCoverage: 0.30,
      securityScore: 0.20,
    };

    return Math.round(
      scores.testCoverage * weights.testCoverage +
      scores.codeQuality * weights.codeQuality +
      scores.requirementCoverage * weights.requirementCoverage +
      scores.securityScore * weights.securityScore
    );
  }

  /**
   * Store metrics in database
   */
  private async storeMetrics(metrics: QualityMetrics): Promise<void> {
    await prisma.qualityMetric.create({
      data: {
        projectId: metrics.projectId,
        testCoverage: metrics.testCoverage.overallScore,
        codeQuality: metrics.codeQuality.qualityScore,
        requirementCoverage: metrics.requirementCoverage.coveragePercentage,
        securityScore: metrics.security.securityScore,
        overallScore: metrics.overallScore,
        metadata: {
          testCoverage: metrics.testCoverage,
          codeQuality: metrics.codeQuality,
          requirementCoverage: metrics.requirementCoverage,
          aiQuality: metrics.aiQuality,
          performance: metrics.performance,
          security: metrics.security,
        },
      },
    });
  }

  /**
   * Get metrics history for project
   */
  async getMetricsHistory(projectId: string, limit: number = 30) {
    return await prisma.qualityMetric.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get latest metrics
   */
  async getLatestMetrics(projectId: string): Promise<QualityMetrics | null> {
    const latestRecord = await prisma.qualityMetric.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestRecord || !latestRecord.metadata) {
      return null;
    }

    const metadata = latestRecord.metadata as any;

    return {
      projectId,
      timestamp: latestRecord.createdAt,
      testCoverage: metadata.testCoverage,
      codeQuality: metadata.codeQuality,
      requirementCoverage: metadata.requirementCoverage,
      aiQuality: metadata.aiQuality,
      performance: metadata.performance,
      security: metadata.security,
      overallScore: latestRecord.overallScore.toNumber(),
    };
  }
}

// Export singleton
export const qualityMetricsService = new QualityMetricsService();
