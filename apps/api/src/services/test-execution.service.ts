import { dockerService } from './docker.service';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

export interface TestFile {
  path: string;
  content: string;
  framework: 'jest' | 'vitest' | 'pytest';
}

export interface TestResult {
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage?: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  failures: {
    test: string;
    error: string;
    stack?: string;
  }[];
  duration: number;
  output: string;
}

/**
 * Test Execution Service
 * Runs generated tests in isolated Docker containers
 */
export class TestExecutionService {
  /**
   * Execute tests for a project
   */
  async executeTests(
    projectId: string,
    testFiles: TestFile[]
  ): Promise<TestResult> {
    const startTime = Date.now();

    logger.info('Starting test execution', {
      projectId,
      testCount: testFiles.length,
    });

    try {
      // Determine test framework (assume all tests use same framework)
      const framework = testFiles[0]?.framework || 'jest';

      // Execute tests based on framework
      const result = await this.runTests(projectId, testFiles, framework);

      // Record test run
      await this.recordTestRun(projectId, result);

      logger.info('Test execution completed', {
        projectId,
        success: result.success,
        passed: result.passedTests,
        failed: result.failedTests,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      logger.error('Test execution failed', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const duration = Date.now() - startTime;

      return {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        failures: [{
          test: 'Test execution',
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
        duration,
        output: '',
      };
    }
  }

  /**
   * Run tests using specific framework
   */
  private async runTests(
    projectId: string,
    testFiles: TestFile[],
    framework: 'jest' | 'vitest' | 'pytest'
  ): Promise<TestResult> {
    const testCommands = {
      jest: 'npm test -- --json --coverage',
      vitest: 'npm test -- --reporter=json --coverage',
      pytest: 'pytest --json-report --cov',
    };

    // Create test runner script
    const testScript = this.generateTestRunnerScript(testFiles, framework);

    // Execute in Docker
    const executionResult = await dockerService.executeCode({
      projectId,
      userId: 'system',
      code: testScript,
      language: framework === 'pytest' ? 'python' : 'typescript',
      timeout: 120000, // 2 minutes for tests
    });

    // Parse test results
    return this.parseTestResults(executionResult.output, framework);
  }

  /**
   * Generate test runner script
   */
  private generateTestRunnerScript(
    testFiles: TestFile[],
    framework: string
  ): string {
    if (framework === 'pytest') {
      return `
# Python test runner
import pytest
import json

# Write test files
${testFiles.map((file, i) => `
with open('test_${i}.py', 'w') as f:
    f.write("""${file.content}""")
`).join('\n')}

# Run tests
pytest.main(['--json-report', '--cov'])
`;
    } else {
      // Jest/Vitest
      return `
// TypeScript test runner
${testFiles.map((file, i) => `
// ${file.path}
${file.content}
`).join('\n\n')}

// Run tests
const { exec } = require('child_process');
exec('${framework === 'jest' ? 'jest' : 'vitest'} --json', (error, stdout, stderr) => {
  console.log(stdout);
  if (error) {
    console.error(stderr);
    process.exit(1);
  }
});
`;
    }
  }

  /**
   * Parse test results from output
   */
  private parseTestResults(output: string, framework: string): TestResult {
    try {
      // Try to parse JSON output
      const jsonMatch = output.match(/\{[\s\S]*"numTotalTests"[\s\S]*\}/);
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0]);

        return {
          success: results.success || results.numFailedTests === 0,
          totalTests: results.numTotalTests || 0,
          passedTests: results.numPassedTests || 0,
          failedTests: results.numFailedTests || 0,
          skippedTests: results.numPendingTests || 0,
          coverage: results.coverageMap ? {
            lines: results.coverageMap.total?.lines?.pct || 0,
            statements: results.coverageMap.total?.statements?.pct || 0,
            functions: results.coverageMap.total?.functions?.pct || 0,
            branches: results.coverageMap.total?.branches?.pct || 0,
          } : undefined,
          failures: results.testResults?.flatMap((suite: any) =>
            suite.assertionResults
              ?.filter((test: any) => test.status === 'failed')
              .map((test: any) => ({
                test: test.title,
                error: test.failureMessages?.[0] || 'Unknown error',
              }))
          ) || [],
          duration: results.testDuration || 0,
          output,
        };
      }

      // Fallback: parse text output
      return this.parseTextOutput(output);
    } catch (error) {
      logger.error('Failed to parse test results', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        failures: [],
        duration: 0,
        output,
      };
    }
  }

  /**
   * Parse text output (fallback)
   */
  private parseTextOutput(output: string): TestResult {
    const passedMatch = output.match(/(\d+) passed/i);
    const failedMatch = output.match(/(\d+) failed/i);
    const totalMatch = output.match(/Tests:\s+(\d+) total/i);

    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;

    return {
      success: failed === 0,
      totalTests: total,
      passedTests: passed,
      failedTests: failed,
      skippedTests: 0,
      failures: [],
      duration: 0,
      output,
    };
  }

  /**
   * Record test run in database
   */
  private async recordTestRun(
    projectId: string,
    result: TestResult
  ): Promise<void> {
    try {
      await prisma.testRun.create({
        data: {
          projectId,
          status: result.success ? 'passed' : 'failed',
          totalTests: result.totalTests,
          passedTests: result.passedTests,
          failedTests: result.failedTests,
          skippedTests: result.skippedTests,
          duration: result.duration,
          coveragePercentage: result.coverage?.lines,
          rawOutput: result.output,
        },
      });

      logger.info('Test run recorded', {
        projectId,
        status: result.success ? 'passed' : 'failed',
      });
    } catch (error) {
      logger.error('Failed to record test run', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get test history for project
   */
  async getTestHistory(projectId: string, limit: number = 10) {
    return await prisma.testRun.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get latest test run
   */
  async getLatestTestRun(projectId: string) {
    return await prisma.testRun.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

// Export singleton
export const testExecutionService = new TestExecutionService();
