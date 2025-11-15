import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { integrationMapService } from './integration-map.service';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TraceabilityMatrixRow {
  requirementId: string;
  requirementDescription: string;
  requirementType: 'functional' | 'non-functional';
  priority: 'high' | 'medium' | 'low';

  // Implementation
  implementedIn: string[]; // Component IDs
  implementationStatus: 'not_started' | 'in_progress' | 'completed';
  implementationCoverage: number; // 0-100%

  // Testing
  testedBy: string[]; // Test IDs
  testStatus: 'not_tested' | 'failed' | 'passed';
  testCoverage: number; // 0-100%

  // Traceability
  relatedComponents: {
    vocaboticsId: string;
    type: string;
    layer: string;
    filePath: string;
  }[];

  // Compliance
  complianceStandards: string[];

  // Overall
  overallStatus: 'not_started' | 'in_progress' | 'completed' | 'verified';
}

export interface TraceabilityMatrix {
  projectId: string;
  projectName: string;
  generatedAt: Date;
  rows: TraceabilityMatrixRow[];
  summary: {
    totalRequirements: number;
    implementedRequirements: number;
    testedRequirements: number;
    verifiedRequirements: number;
    implementationCoverage: number;
    testCoverage: number;
    overallCoverage: number;
  };
}

export type ExportFormat = 'json' | 'csv' | 'pdf' | 'html';

/**
 * Traceability Matrix Builder Service
 * Generates requirements traceability matrices (RTM)
 */
export class TraceabilityMatrixService {
  /**
   * Build traceability matrix for project
   */
  async buildMatrix(projectId: string): Promise<TraceabilityMatrix> {
    logger.info('Building traceability matrix', { projectId });

    try {
      // Get project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          artifacts: true,
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Get PRD artifact
      const prdArtifact = project.artifacts.find(a => a.type === 'prd');
      if (!prdArtifact || !prdArtifact.content) {
        throw new Error('PRD not found for project');
      }

      const prd = prdArtifact.content as any;

      // Get integration map
      const integrationMap = await integrationMapService.getIntegrationMap(projectId);

      // Build matrix rows
      const rows: TraceabilityMatrixRow[] = [];

      // Process functional requirements
      if (prd.functionalRequirements && Array.isArray(prd.functionalRequirements)) {
        for (const req of prd.functionalRequirements) {
          const row = await this.buildMatrixRow(
            projectId,
            req,
            'functional',
            integrationMap
          );
          rows.push(row);
        }
      }

      // Process non-functional requirements
      if (prd.nonFunctionalRequirements && Array.isArray(prd.nonFunctionalRequirements)) {
        for (const req of prd.nonFunctionalRequirements) {
          const row = await this.buildMatrixRow(
            projectId,
            req,
            'non-functional',
            integrationMap
          );
          rows.push(row);
        }
      }

      // Calculate summary
      const summary = this.calculateSummary(rows);

      const matrix: TraceabilityMatrix = {
        projectId,
        projectName: project.name,
        generatedAt: new Date(),
        rows,
        summary,
      };

      // Store matrix
      await this.storeMatrix(matrix);

      logger.info('Traceability matrix built', {
        projectId,
        totalRequirements: rows.length,
        implementedRequirements: summary.implementedRequirements,
        testedRequirements: summary.testedRequirements,
      });

      return matrix;
    } catch (error) {
      logger.error('Failed to build traceability matrix', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Build matrix row for requirement
   */
  private async buildMatrixRow(
    projectId: string,
    requirement: any,
    type: 'functional' | 'non-functional',
    integrationMap: any
  ): Promise<TraceabilityMatrixRow> {
    const requirementId = requirement.id || requirement.requirementId;

    // Find all elements implementing this requirement
    const implementingElements = integrationMap.elements.filter((el: any) =>
      el.requirements.includes(requirementId)
    );

    // Find components (non-test elements)
    const components = implementingElements.filter((el: any) => el.type !== 'test');

    // Find tests
    const tests = implementingElements.filter((el: any) => el.type === 'test');

    // Determine implementation status
    let implementationStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (components.length > 0) {
      // Check if all expected components are implemented
      // For now, we consider it completed if any component exists
      implementationStatus = 'completed';
    }

    // Determine test status
    let testStatus: 'not_tested' | 'failed' | 'passed' = 'not_tested';
    if (tests.length > 0) {
      // Check test results
      const latestTestRun = await prisma.testRun.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      if (latestTestRun) {
        testStatus = latestTestRun.status === 'passed' ? 'passed' : 'failed';
      }
    }

    // Overall status
    let overallStatus: 'not_started' | 'in_progress' | 'completed' | 'verified' = 'not_started';
    if (implementationStatus === 'completed' && testStatus === 'passed') {
      overallStatus = 'verified';
    } else if (implementationStatus === 'completed') {
      overallStatus = 'completed';
    } else if (implementationStatus === 'in_progress') {
      overallStatus = 'in_progress';
    }

    return {
      requirementId,
      requirementDescription: requirement.description || requirement.title || '',
      requirementType: type,
      priority: requirement.priority || 'medium',
      implementedIn: components.map((c: any) => c.vocaboticsId),
      implementationStatus,
      implementationCoverage: components.length > 0 ? 100 : 0,
      testedBy: tests.map((t: any) => t.vocaboticsId),
      testStatus,
      testCoverage: tests.length > 0 ? 100 : 0,
      relatedComponents: components.map((c: any) => ({
        vocaboticsId: c.vocaboticsId,
        type: c.type,
        layer: c.layer,
        filePath: c.filePath,
      })),
      complianceStandards: requirement.complianceStandards || [],
      overallStatus,
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(rows: TraceabilityMatrixRow[]) {
    const totalRequirements = rows.length;
    const implementedRequirements = rows.filter(
      r => r.implementationStatus === 'completed'
    ).length;
    const testedRequirements = rows.filter(
      r => r.testStatus === 'passed'
    ).length;
    const verifiedRequirements = rows.filter(
      r => r.overallStatus === 'verified'
    ).length;

    const implementationCoverage = totalRequirements > 0
      ? (implementedRequirements / totalRequirements) * 100
      : 0;

    const testCoverage = totalRequirements > 0
      ? (testedRequirements / totalRequirements) * 100
      : 0;

    const overallCoverage = totalRequirements > 0
      ? (verifiedRequirements / totalRequirements) * 100
      : 0;

    return {
      totalRequirements,
      implementedRequirements,
      testedRequirements,
      verifiedRequirements,
      implementationCoverage,
      testCoverage,
      overallCoverage,
    };
  }

  /**
   * Store matrix in database
   */
  private async storeMatrix(matrix: TraceabilityMatrix): Promise<void> {
    await prisma.traceabilityMatrix.create({
      data: {
        projectId: matrix.projectId,
        matrix: matrix as any,
      },
    });
  }

  /**
   * Get latest matrix
   */
  async getLatestMatrix(projectId: string): Promise<TraceabilityMatrix | null> {
    const record = await prisma.traceabilityMatrix.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || !record.matrix) {
      return null;
    }

    return record.matrix as any;
  }

  /**
   * Export matrix to various formats
   */
  async exportMatrix(
    projectId: string,
    format: ExportFormat
  ): Promise<string> {
    logger.info('Exporting traceability matrix', { projectId, format });

    const matrix = await this.getLatestMatrix(projectId);
    if (!matrix) {
      throw new Error('No traceability matrix found for project');
    }

    const exportDir = path.join(process.cwd(), 'exports', projectId);
    await fs.mkdir(exportDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `traceability-matrix-${timestamp}`;

    switch (format) {
      case 'json':
        return await this.exportJSON(matrix, exportDir, filename);
      case 'csv':
        return await this.exportCSV(matrix, exportDir, filename);
      case 'pdf':
        return await this.exportPDF(matrix, exportDir, filename);
      case 'html':
        return await this.exportHTML(matrix, exportDir, filename);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export to JSON
   */
  private async exportJSON(
    matrix: TraceabilityMatrix,
    exportDir: string,
    filename: string
  ): Promise<string> {
    const filePath = path.join(exportDir, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(matrix, null, 2));
    logger.info('Matrix exported to JSON', { filePath });
    return filePath;
  }

  /**
   * Export to CSV
   */
  private async exportCSV(
    matrix: TraceabilityMatrix,
    exportDir: string,
    filename: string
  ): Promise<string> {
    const fields = [
      'requirementId',
      'requirementDescription',
      'requirementType',
      'priority',
      'implementationStatus',
      'implementationCoverage',
      'testStatus',
      'testCoverage',
      'overallStatus',
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(matrix.rows);

    const filePath = path.join(exportDir, `${filename}.csv`);
    await fs.writeFile(filePath, csv);
    logger.info('Matrix exported to CSV', { filePath });
    return filePath;
  }

  /**
   * Export to PDF
   */
  private async exportPDF(
    matrix: TraceabilityMatrix,
    exportDir: string,
    filename: string
  ): Promise<string> {
    const filePath = path.join(exportDir, `${filename}.pdf`);
    const doc = new PDFDocument({ margin: 50 });
    const stream = require('fs').createWriteStream(filePath);

    doc.pipe(stream);

    // Title
    doc.fontSize(20).text('Requirements Traceability Matrix', { align: 'center' });
    doc.moveDown();

    // Project info
    doc.fontSize(12).text(`Project: ${matrix.projectName}`);
    doc.text(`Generated: ${matrix.generatedAt.toISOString()}`);
    doc.moveDown();

    // Summary
    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Requirements: ${matrix.summary.totalRequirements}`);
    doc.text(`Implemented: ${matrix.summary.implementedRequirements} (${matrix.summary.implementationCoverage.toFixed(1)}%)`);
    doc.text(`Tested: ${matrix.summary.testedRequirements} (${matrix.summary.testCoverage.toFixed(1)}%)`);
    doc.text(`Verified: ${matrix.summary.verifiedRequirements} (${matrix.summary.overallCoverage.toFixed(1)}%)`);
    doc.moveDown();

    // Requirements
    doc.fontSize(14).text('Requirements', { underline: true });
    doc.fontSize(8);

    for (const row of matrix.rows) {
      doc.text(`${row.requirementId}: ${row.requirementDescription}`);
      doc.text(`  Type: ${row.requirementType} | Priority: ${row.priority}`);
      doc.text(`  Implementation: ${row.implementationStatus} (${row.implementationCoverage}%)`);
      doc.text(`  Testing: ${row.testStatus} (${row.testCoverage}%)`);
      doc.text(`  Status: ${row.overallStatus}`);
      doc.moveDown(0.5);
    }

    doc.end();

    await new Promise(resolve => stream.on('finish', resolve));

    logger.info('Matrix exported to PDF', { filePath });
    return filePath;
  }

  /**
   * Export to HTML
   */
  private async exportHTML(
    matrix: TraceabilityMatrix,
    exportDir: string,
    filename: string
  ): Promise<string> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Traceability Matrix - ${matrix.projectName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .status-verified { color: green; font-weight: bold; }
    .status-completed { color: blue; }
    .status-in-progress { color: orange; }
    .status-not-started { color: red; }
  </style>
</head>
<body>
  <h1>Requirements Traceability Matrix</h1>
  <p><strong>Project:</strong> ${matrix.projectName}</p>
  <p><strong>Generated:</strong> ${matrix.generatedAt.toISOString()}</p>

  <div class="summary">
    <h2>Summary</h2>
    <p>Total Requirements: ${matrix.summary.totalRequirements}</p>
    <p>Implemented: ${matrix.summary.implementedRequirements} (${matrix.summary.implementationCoverage.toFixed(1)}%)</p>
    <p>Tested: ${matrix.summary.testedRequirements} (${matrix.summary.testCoverage.toFixed(1)}%)</p>
    <p>Verified: ${matrix.summary.verifiedRequirements} (${matrix.summary.overallCoverage.toFixed(1)}%)</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Requirement ID</th>
        <th>Description</th>
        <th>Type</th>
        <th>Priority</th>
        <th>Implementation</th>
        <th>Testing</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${matrix.rows.map(row => `
        <tr>
          <td>${row.requirementId}</td>
          <td>${row.requirementDescription}</td>
          <td>${row.requirementType}</td>
          <td>${row.priority}</td>
          <td>${row.implementationStatus} (${row.implementationCoverage}%)</td>
          <td>${row.testStatus} (${row.testCoverage}%)</td>
          <td class="status-${row.overallStatus}">${row.overallStatus}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
    `;

    const filePath = path.join(exportDir, `${filename}.html`);
    await fs.writeFile(filePath, html);
    logger.info('Matrix exported to HTML', { filePath });
    return filePath;
  }
}

// Export singleton
export const traceabilityMatrixService = new TraceabilityMatrixService();
