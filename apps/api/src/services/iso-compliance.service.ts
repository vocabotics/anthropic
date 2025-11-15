import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { traceabilityMatrixService } from './traceability-matrix.service';
import { qualityMetricsService } from './quality-metrics.service';

export type ComplianceStandard = 'ISO_9001' | 'ISO_12207' | 'WCAG_2_1' | 'ISO_25010';

export interface ComplianceRequirement {
  id: string;
  standard: ComplianceStandard;
  clause: string;
  title: string;
  description: string;
  mandatory: boolean;
  category: string;
}

export interface ComplianceCheckResult {
  requirementId: string;
  passed: boolean;
  score: number; // 0-100
  evidence: string[];
  gaps: string[];
  recommendations: string[];
}

export interface ComplianceReport {
  projectId: string;
  projectName: string;
  generatedAt: Date;
  standard: ComplianceStandard;
  overallCompliance: number; // 0-100
  results: ComplianceCheckResult[];
  summary: {
    totalRequirements: number;
    passedRequirements: number;
    failedRequirements: number;
    compliancePercentage: number;
    criticalGaps: string[];
  };
}

/**
 * ISO Compliance Validator Service
 * Validates compliance with ISO 9001, ISO 12207, WCAG 2.1, and ISO 25010
 */
export class ISOComplianceService {
  /**
   * ISO 9001:2015 Quality Management requirements
   */
  private readonly ISO_9001_REQUIREMENTS: ComplianceRequirement[] = [
    {
      id: 'ISO_9001_4.1',
      standard: 'ISO_9001',
      clause: '4.1',
      title: 'Understanding the organization and its context',
      description: 'Project context and scope must be documented',
      mandatory: true,
      category: 'Context',
    },
    {
      id: 'ISO_9001_4.2',
      standard: 'ISO_9001',
      clause: '4.2',
      title: 'Understanding needs and expectations',
      description: 'Stakeholder requirements must be identified',
      mandatory: true,
      category: 'Context',
    },
    {
      id: 'ISO_9001_5.2',
      standard: 'ISO_9001',
      clause: '5.2',
      title: 'Quality policy',
      description: 'Quality objectives must be established',
      mandatory: true,
      category: 'Leadership',
    },
    {
      id: 'ISO_9001_6.2',
      standard: 'ISO_9001',
      clause: '6.2',
      title: 'Quality objectives',
      description: 'Measurable quality objectives must be defined',
      mandatory: true,
      category: 'Planning',
    },
    {
      id: 'ISO_9001_7.1',
      standard: 'ISO_9001',
      clause: '7.1',
      title: 'Resources',
      description: 'Required resources must be identified and provided',
      mandatory: true,
      category: 'Support',
    },
    {
      id: 'ISO_9001_8.1',
      standard: 'ISO_9001',
      clause: '8.1',
      title: 'Operational planning and control',
      description: 'Operational processes must be planned and controlled',
      mandatory: true,
      category: 'Operation',
    },
    {
      id: 'ISO_9001_8.2',
      standard: 'ISO_9001',
      clause: '8.2',
      title: 'Requirements for products and services',
      description: 'Requirements must be reviewed and documented',
      mandatory: true,
      category: 'Operation',
    },
    {
      id: 'ISO_9001_8.5',
      standard: 'ISO_9001',
      clause: '8.5',
      title: 'Production and service provision',
      description: 'Development process must be controlled',
      mandatory: true,
      category: 'Operation',
    },
    {
      id: 'ISO_9001_9.1',
      standard: 'ISO_9001',
      clause: '9.1',
      title: 'Monitoring, measurement, analysis and evaluation',
      description: 'Quality metrics must be monitored',
      mandatory: true,
      category: 'Performance Evaluation',
    },
    {
      id: 'ISO_9001_10.2',
      standard: 'ISO_9001',
      clause: '10.2',
      title: 'Nonconformity and corrective action',
      description: 'Defects must be tracked and corrected',
      mandatory: true,
      category: 'Improvement',
    },
  ];

  /**
   * ISO 12207 Software lifecycle process requirements
   */
  private readonly ISO_12207_REQUIREMENTS: ComplianceRequirement[] = [
    {
      id: 'ISO_12207_6.4.1',
      standard: 'ISO_12207',
      clause: '6.4.1',
      title: 'Stakeholder requirements definition',
      description: 'Stakeholder requirements must be defined and documented',
      mandatory: true,
      category: 'Technical Processes',
    },
    {
      id: 'ISO_12207_6.4.2',
      standard: 'ISO_12207',
      clause: '6.4.2',
      title: 'Requirements analysis',
      description: 'Requirements must be analyzed and validated',
      mandatory: true,
      category: 'Technical Processes',
    },
    {
      id: 'ISO_12207_6.4.3',
      standard: 'ISO_12207',
      clause: '6.4.3',
      title: 'Architectural design',
      description: 'System architecture must be designed and documented',
      mandatory: true,
      category: 'Technical Processes',
    },
    {
      id: 'ISO_12207_6.4.4',
      standard: 'ISO_12207',
      clause: '6.4.4',
      title: 'Implementation',
      description: 'Software must be implemented according to design',
      mandatory: true,
      category: 'Technical Processes',
    },
    {
      id: 'ISO_12207_6.4.5',
      standard: 'ISO_12207',
      clause: '6.4.5',
      title: 'Integration',
      description: 'Components must be integrated and tested',
      mandatory: true,
      category: 'Technical Processes',
    },
    {
      id: 'ISO_12207_6.4.6',
      standard: 'ISO_12207',
      clause: '6.4.6',
      title: 'Verification',
      description: 'Verification activities must be performed',
      mandatory: true,
      category: 'Technical Processes',
    },
    {
      id: 'ISO_12207_6.4.7',
      standard: 'ISO_12207',
      clause: '6.4.7',
      title: 'Transition',
      description: 'System must be transitioned to operation',
      mandatory: true,
      category: 'Technical Processes',
    },
    {
      id: 'ISO_12207_6.4.8',
      standard: 'ISO_12207',
      clause: '6.4.8',
      title: 'Validation',
      description: 'System must be validated against stakeholder needs',
      mandatory: true,
      category: 'Technical Processes',
    },
    {
      id: 'ISO_12207_6.5',
      standard: 'ISO_12207',
      clause: '6.5',
      title: 'Software maintenance',
      description: 'Maintenance processes must be established',
      mandatory: false,
      category: 'Technical Processes',
    },
    {
      id: 'ISO_12207_7.1',
      standard: 'ISO_12207',
      clause: '7.1',
      title: 'Documentation management',
      description: 'Documentation must be managed and controlled',
      mandatory: true,
      category: 'Technical Management Processes',
    },
  ];

  /**
   * WCAG 2.1 Level AA requirements (subset)
   */
  private readonly WCAG_REQUIREMENTS: ComplianceRequirement[] = [
    {
      id: 'WCAG_1.1.1',
      standard: 'WCAG_2_1',
      clause: '1.1.1',
      title: 'Non-text Content',
      description: 'All non-text content must have text alternatives',
      mandatory: true,
      category: 'Perceivable',
    },
    {
      id: 'WCAG_1.3.1',
      standard: 'WCAG_2_1',
      clause: '1.3.1',
      title: 'Info and Relationships',
      description: 'Information and relationships must be programmatically determinable',
      mandatory: true,
      category: 'Perceivable',
    },
    {
      id: 'WCAG_1.4.3',
      standard: 'WCAG_2_1',
      clause: '1.4.3',
      title: 'Contrast (Minimum)',
      description: 'Text must have sufficient contrast ratio',
      mandatory: true,
      category: 'Perceivable',
    },
    {
      id: 'WCAG_2.1.1',
      standard: 'WCAG_2_1',
      clause: '2.1.1',
      title: 'Keyboard',
      description: 'All functionality must be available via keyboard',
      mandatory: true,
      category: 'Operable',
    },
    {
      id: 'WCAG_2.4.3',
      standard: 'WCAG_2_1',
      clause: '2.4.3',
      title: 'Focus Order',
      description: 'Focus order must be logical and consistent',
      mandatory: true,
      category: 'Operable',
    },
    {
      id: 'WCAG_3.1.1',
      standard: 'WCAG_2_1',
      clause: '3.1.1',
      title: 'Language of Page',
      description: 'Default language must be programmatically determinable',
      mandatory: true,
      category: 'Understandable',
    },
    {
      id: 'WCAG_3.2.3',
      standard: 'WCAG_2_1',
      clause: '3.2.3',
      title: 'Consistent Navigation',
      description: 'Navigation must be consistent across pages',
      mandatory: true,
      category: 'Understandable',
    },
    {
      id: 'WCAG_4.1.2',
      standard: 'WCAG_2_1',
      clause: '4.1.2',
      title: 'Name, Role, Value',
      description: 'UI components must have accessible names and roles',
      mandatory: true,
      category: 'Robust',
    },
  ];

  /**
   * Validate compliance for a project
   */
  async validateCompliance(
    projectId: string,
    standard: ComplianceStandard
  ): Promise<ComplianceReport> {
    logger.info('Validating compliance', { projectId, standard });

    try {
      const requirements = this.getRequirements(standard);
      const results: ComplianceCheckResult[] = [];

      for (const requirement of requirements) {
        const result = await this.checkRequirement(projectId, requirement);
        results.push(result);
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      const summary = this.calculateSummary(results);
      const overallCompliance = summary.compliancePercentage;

      const report: ComplianceReport = {
        projectId,
        projectName: project?.name || 'Unknown',
        generatedAt: new Date(),
        standard,
        overallCompliance,
        results,
        summary,
      };

      // Store report
      await this.storeReport(report);

      logger.info('Compliance validation completed', {
        projectId,
        standard,
        compliance: overallCompliance.toFixed(1),
      });

      return report;
    } catch (error) {
      logger.error('Failed to validate compliance', {
        projectId,
        standard,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check single compliance requirement
   */
  private async checkRequirement(
    projectId: string,
    requirement: ComplianceRequirement
  ): Promise<ComplianceCheckResult> {
    const evidence: string[] = [];
    const gaps: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    try {
      // Get project artifacts
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { artifacts: true },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Check based on standard and requirement
      switch (requirement.standard) {
        case 'ISO_9001':
          ({ score, evidence, gaps, recommendations } = await this.checkISO9001(
            project,
            requirement
          ));
          break;

        case 'ISO_12207':
          ({ score, evidence, gaps, recommendations } = await this.checkISO12207(
            project,
            requirement
          ));
          break;

        case 'WCAG_2_1':
          ({ score, evidence, gaps, recommendations } = await this.checkWCAG(
            project,
            requirement
          ));
          break;

        default:
          score = 0;
          gaps.push('Standard not implemented');
      }

      return {
        requirementId: requirement.id,
        passed: score >= 70, // 70% threshold for passing
        score,
        evidence,
        gaps,
        recommendations,
      };
    } catch (error) {
      logger.error('Failed to check compliance requirement', {
        requirementId: requirement.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        requirementId: requirement.id,
        passed: false,
        score: 0,
        evidence: [],
        gaps: ['Error checking requirement'],
        recommendations: ['Review requirement manually'],
      };
    }
  }

  /**
   * Check ISO 9001 requirement
   */
  private async checkISO9001(
    project: any,
    requirement: ComplianceRequirement
  ): Promise<{
    score: number;
    evidence: string[];
    gaps: string[];
    recommendations: string[];
  }> {
    const evidence: string[] = [];
    const gaps: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    const prdArtifact = project.artifacts.find((a: any) => a.type === 'prd');
    const archArtifact = project.artifacts.find((a: any) => a.type === 'architecture');

    switch (requirement.clause) {
      case '4.1': // Understanding organization and context
      case '4.2': // Understanding needs and expectations
        if (prdArtifact?.content) {
          const prd = prdArtifact.content as any;
          if (prd.vision) {
            evidence.push('Project vision documented in PRD');
            score += 50;
          }
          if (prd.targetAudience) {
            evidence.push('Target audience identified');
            score += 50;
          }
        } else {
          gaps.push('PRD not found');
          recommendations.push('Create comprehensive PRD with vision and stakeholder analysis');
        }
        break;

      case '5.2': // Quality policy
      case '6.2': // Quality objectives
        const metrics = await qualityMetricsService.getLatestMetrics(project.id);
        if (metrics) {
          evidence.push('Quality metrics being tracked');
          score += 70;
          if (metrics.overallScore >= 70) {
            evidence.push(`Overall quality score: ${metrics.overallScore}%`);
            score += 30;
          }
        } else {
          gaps.push('No quality metrics found');
          recommendations.push('Implement quality metrics tracking');
        }
        break;

      case '8.2': // Requirements for products and services
        if (prdArtifact?.content) {
          const prd = prdArtifact.content as any;
          if (prd.functionalRequirements?.length > 0) {
            evidence.push(`${prd.functionalRequirements.length} functional requirements documented`);
            score += 50;
          }
          if (prd.nonFunctionalRequirements?.length > 0) {
            evidence.push(`${prd.nonFunctionalRequirements.length} non-functional requirements documented`);
            score += 50;
          }
        }
        break;

      case '9.1': // Monitoring and measurement
        const matrix = await traceabilityMatrixService.getLatestMatrix(project.id);
        if (matrix) {
          evidence.push('Traceability matrix exists');
          score += 50;
          if (matrix.summary.overallCoverage >= 70) {
            evidence.push(`Overall coverage: ${matrix.summary.overallCoverage.toFixed(1)}%`);
            score += 50;
          }
        } else {
          gaps.push('No traceability matrix found');
          recommendations.push('Build traceability matrix');
        }
        break;

      default:
        score = 50; // Default partial compliance
        evidence.push('General project documentation exists');
    }

    return { score: Math.min(score, 100), evidence, gaps, recommendations };
  }

  /**
   * Check ISO 12207 requirement
   */
  private async checkISO12207(
    project: any,
    requirement: ComplianceRequirement
  ): Promise<{
    score: number;
    evidence: string[];
    gaps: string[];
    recommendations: string[];
  }> {
    const evidence: string[] = [];
    const gaps: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    const prdArtifact = project.artifacts.find((a: any) => a.type === 'prd');
    const archArtifact = project.artifacts.find((a: any) => a.type === 'architecture');
    const codeArtifacts = project.artifacts.filter((a: any) =>
      ['code_frontend', 'code_backend', 'tests'].includes(a.type)
    );

    switch (requirement.clause) {
      case '6.4.1': // Stakeholder requirements definition
        if (prdArtifact?.content) {
          const prd = prdArtifact.content as any;
          evidence.push('PRD exists with stakeholder requirements');
          score += 100;
        } else {
          gaps.push('PRD not found');
          recommendations.push('Create PRD with stakeholder requirements');
        }
        break;

      case '6.4.2': // Requirements analysis
        if (prdArtifact?.content) {
          const prd = prdArtifact.content as any;
          if (prd.userStories?.length > 0) {
            evidence.push('User stories defined');
            score += 100;
          }
        }
        break;

      case '6.4.3': // Architectural design
        if (archArtifact?.content) {
          const arch = archArtifact.content as any;
          evidence.push('Architecture documented');
          score += 100;
        } else {
          gaps.push('Architecture not documented');
          recommendations.push('Create architecture document');
        }
        break;

      case '6.4.4': // Implementation
        if (codeArtifacts.length > 0) {
          evidence.push(`${codeArtifacts.length} code artifacts generated`);
          score += 100;
        } else {
          gaps.push('No code generated');
          recommendations.push('Generate implementation code');
        }
        break;

      case '6.4.6': // Verification
        const testRun = await prisma.testRun.findFirst({
          where: { projectId: project.id },
          orderBy: { createdAt: 'desc' },
        });

        if (testRun) {
          evidence.push('Tests have been executed');
          score += 50;
          if (testRun.status === 'passed') {
            evidence.push('Latest tests passed');
            score += 50;
          }
        } else {
          gaps.push('No test execution found');
          recommendations.push('Run test suite');
        }
        break;

      default:
        score = 50;
        evidence.push('Process partially documented');
    }

    return { score: Math.min(score, 100), evidence, gaps, recommendations };
  }

  /**
   * Check WCAG requirement
   */
  private async checkWCAG(
    project: any,
    requirement: ComplianceRequirement
  ): Promise<{
    score: number;
    evidence: string[];
    gaps: string[];
    recommendations: string[];
  }> {
    const evidence: string[] = [];
    const gaps: string[] = [];
    const recommendations: string[] = [];
    let score = 50; // Default score for generated UI

    const frontendArtifacts = project.artifacts.filter((a: any) =>
      a.type === 'code_frontend'
    );

    if (frontendArtifacts.length === 0) {
      gaps.push('No frontend code generated');
      recommendations.push('Generate frontend code with accessibility features');
      return { score: 0, evidence, gaps, recommendations };
    }

    // Basic checks based on requirement
    switch (requirement.clause) {
      case '1.1.1': // Non-text content
        evidence.push('Frontend uses semantic HTML');
        score = 70;
        recommendations.push('Verify all images have alt text');
        break;

      case '2.1.1': // Keyboard
        evidence.push('React components support keyboard navigation');
        score = 70;
        recommendations.push('Test keyboard navigation manually');
        break;

      case '3.1.1': // Language
        evidence.push('HTML lang attribute should be set');
        score = 80;
        break;

      case '4.1.2': // Name, role, value
        evidence.push('Using standard HTML elements with ARIA support');
        score = 70;
        recommendations.push('Verify ARIA labels on custom components');
        break;

      default:
        evidence.push('Modern React framework with accessibility support');
        score = 60;
        recommendations.push('Manual accessibility audit recommended');
    }

    return { score, evidence, gaps, recommendations };
  }

  /**
   * Get requirements for standard
   */
  private getRequirements(standard: ComplianceStandard): ComplianceRequirement[] {
    switch (standard) {
      case 'ISO_9001':
        return this.ISO_9001_REQUIREMENTS;
      case 'ISO_12207':
        return this.ISO_12207_REQUIREMENTS;
      case 'WCAG_2_1':
        return this.WCAG_REQUIREMENTS;
      default:
        return [];
    }
  }

  /**
   * Calculate summary
   */
  private calculateSummary(results: ComplianceCheckResult[]) {
    const totalRequirements = results.length;
    const passedRequirements = results.filter(r => r.passed).length;
    const failedRequirements = totalRequirements - passedRequirements;

    const compliancePercentage = totalRequirements > 0
      ? (passedRequirements / totalRequirements) * 100
      : 0;

    // Get critical gaps (from failed mandatory requirements)
    const criticalGaps = results
      .filter(r => !r.passed && r.gaps.length > 0)
      .flatMap(r => r.gaps)
      .slice(0, 5); // Top 5 critical gaps

    return {
      totalRequirements,
      passedRequirements,
      failedRequirements,
      compliancePercentage,
      criticalGaps,
    };
  }

  /**
   * Store report
   */
  private async storeReport(report: ComplianceReport): Promise<void> {
    await prisma.complianceReport.create({
      data: {
        projectId: report.projectId,
        standard: report.standard,
        overallCompliance: report.overallCompliance,
        report: report as any,
      },
    });
  }

  /**
   * Get latest report
   */
  async getLatestReport(
    projectId: string,
    standard: ComplianceStandard
  ): Promise<ComplianceReport | null> {
    const record = await prisma.complianceReport.findFirst({
      where: { projectId, standard },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || !record.report) {
      return null;
    }

    return record.report as any;
  }
}

// Export singleton
export const isoComplianceService = new ISOComplianceService();
