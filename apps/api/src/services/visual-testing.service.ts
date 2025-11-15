import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface VisualTest {
  name: string;
  url: string;
  viewport?: {
    width: number;
    height: number;
  };
  selector?: string; // Optional: screenshot specific element
  waitForSelector?: string;
  waitTime?: number; // ms to wait before screenshot
}

export interface VisualTestResult {
  testName: string;
  passed: boolean;
  diffPercentage: number;
  screenshotPath: string;
  baselinePath?: string;
  diffPath?: string;
  error?: string;
}

export interface VisualTestSuite {
  projectId: string;
  tests: VisualTest[];
  baselineDir?: string;
  threshold?: number; // Percentage difference threshold (0-100)
}

/**
 * Visual Testing Service
 * Performs visual regression testing with Puppeteer
 */
export class VisualTestingService {
  private browser: Browser | null = null;
  private screenshotDir = path.join(process.cwd(), 'screenshots');
  private baselineDir = path.join(process.cwd(), 'screenshots', 'baselines');
  private diffDir = path.join(process.cwd(), 'screenshots', 'diffs');

  /**
   * Initialize browser
   */
  private async initBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    logger.info('Puppeteer browser initialized');
    return this.browser;
  }

  /**
   * Close browser
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed');
    }
  }

  /**
   * Run visual test suite
   */
  async runTestSuite(suite: VisualTestSuite): Promise<VisualTestResult[]> {
    logger.info('Running visual test suite', {
      projectId: suite.projectId,
      testCount: suite.tests.length,
    });

    // Ensure directories exist
    await this.ensureDirectories(suite.projectId);

    const browser = await this.initBrowser();
    const results: VisualTestResult[] = [];

    try {
      for (const test of suite.tests) {
        const result = await this.runTest(browser, suite.projectId, test, suite.threshold || 0.1);
        results.push(result);
      }

      // Store results
      await this.storeTestResults(suite.projectId, results);

      logger.info('Visual test suite completed', {
        projectId: suite.projectId,
        totalTests: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
      });

      return results;
    } catch (error) {
      logger.error('Visual test suite failed', {
        projectId: suite.projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Run single visual test
   */
  private async runTest(
    browser: Browser,
    projectId: string,
    test: VisualTest,
    threshold: number
  ): Promise<VisualTestResult> {
    logger.info('Running visual test', { projectId, testName: test.name });

    const page = await browser.newPage();

    try {
      // Set viewport
      await page.setViewport(test.viewport || { width: 1280, height: 720 });

      // Navigate to URL
      await page.goto(test.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for selector if specified
      if (test.waitForSelector) {
        await page.waitForSelector(test.waitForSelector, { timeout: 10000 });
      }

      // Wait additional time if specified
      if (test.waitTime) {
        await page.waitForTimeout(test.waitTime);
      }

      // Take screenshot
      const screenshotPath = path.join(
        this.screenshotDir,
        projectId,
        `${test.name}.png`
      );

      if (test.selector) {
        const element = await page.$(test.selector);
        if (element) {
          await element.screenshot({ path: screenshotPath });
        } else {
          throw new Error(`Selector not found: ${test.selector}`);
        }
      } else {
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      // Compare with baseline
      const baselinePath = path.join(this.baselineDir, projectId, `${test.name}.png`);
      const diffPath = path.join(this.diffDir, projectId, `${test.name}.png`);

      const comparison = await this.compareScreenshots(
        screenshotPath,
        baselinePath,
        diffPath,
        threshold
      );

      logger.info('Visual test completed', {
        projectId,
        testName: test.name,
        passed: comparison.passed,
        diffPercentage: comparison.diffPercentage,
      });

      return {
        testName: test.name,
        passed: comparison.passed,
        diffPercentage: comparison.diffPercentage,
        screenshotPath,
        baselinePath: comparison.baselineExists ? baselinePath : undefined,
        diffPath: comparison.diffExists ? diffPath : undefined,
      };
    } catch (error) {
      logger.error('Visual test failed', {
        projectId,
        testName: test.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        testName: test.name,
        passed: false,
        diffPercentage: 100,
        screenshotPath: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Compare screenshots
   */
  private async compareScreenshots(
    currentPath: string,
    baselinePath: string,
    diffPath: string,
    threshold: number
  ): Promise<{
    passed: boolean;
    diffPercentage: number;
    baselineExists: boolean;
    diffExists: boolean;
  }> {
    try {
      // Check if baseline exists
      const baselineExists = await this.fileExists(baselinePath);

      if (!baselineExists) {
        // No baseline - copy current as baseline
        await fs.copyFile(currentPath, baselinePath);
        logger.info('Baseline created', { baselinePath });

        return {
          passed: true,
          diffPercentage: 0,
          baselineExists: true,
          diffExists: false,
        };
      }

      // Load images
      const current = PNG.sync.read(await fs.readFile(currentPath));
      const baseline = PNG.sync.read(await fs.readFile(baselinePath));

      // Ensure same dimensions
      if (current.width !== baseline.width || current.height !== baseline.height) {
        logger.warn('Screenshot dimensions mismatch', {
          current: { width: current.width, height: current.height },
          baseline: { width: baseline.width, height: baseline.height },
        });

        return {
          passed: false,
          diffPercentage: 100,
          baselineExists: true,
          diffExists: false,
        };
      }

      // Compare pixels
      const diff = new PNG({ width: current.width, height: current.height });
      const numDiffPixels = pixelmatch(
        current.data,
        baseline.data,
        diff.data,
        current.width,
        current.height,
        { threshold: 0.1 }
      );

      const totalPixels = current.width * current.height;
      const diffPercentage = (numDiffPixels / totalPixels) * 100;

      // Save diff image if there are differences
      let diffExists = false;
      if (diffPercentage > 0) {
        await fs.writeFile(diffPath, PNG.sync.write(diff));
        diffExists = true;
      }

      const passed = diffPercentage <= threshold;

      logger.info('Screenshot comparison complete', {
        diffPixels: numDiffPixels,
        totalPixels,
        diffPercentage: diffPercentage.toFixed(2),
        threshold,
        passed,
      });

      return {
        passed,
        diffPercentage,
        baselineExists: true,
        diffExists,
      };
    } catch (error) {
      logger.error('Screenshot comparison failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        passed: false,
        diffPercentage: 100,
        baselineExists: false,
        diffExists: false,
      };
    }
  }

  /**
   * Update baseline
   */
  async updateBaseline(projectId: string, testName: string): Promise<void> {
    const currentPath = path.join(this.screenshotDir, projectId, `${testName}.png`);
    const baselinePath = path.join(this.baselineDir, projectId, `${testName}.png`);

    if (await this.fileExists(currentPath)) {
      await fs.copyFile(currentPath, baselinePath);
      logger.info('Baseline updated', { projectId, testName });
    } else {
      throw new Error(`Screenshot not found: ${currentPath}`);
    }
  }

  /**
   * Get test results
   */
  async getTestResults(projectId: string, limit: number = 10) {
    return await prisma.visualTestRun.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Store test results in database
   */
  private async storeTestResults(
    projectId: string,
    results: VisualTestResult[]
  ): Promise<void> {
    try {
      const passed = results.filter(r => r.passed).length;
      const failed = results.filter(r => !r.passed).length;

      await prisma.visualTestRun.create({
        data: {
          projectId,
          status: failed === 0 ? 'passed' : 'failed',
          totalTests: results.length,
          passedTests: passed,
          failedTests: failed,
          results: results as any,
        },
      });

      logger.info('Visual test results stored', {
        projectId,
        passed,
        failed,
      });
    } catch (error) {
      logger.error('Failed to store visual test results', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Ensure directories exist
   */
  private async ensureDirectories(projectId: string): Promise<void> {
    const dirs = [
      path.join(this.screenshotDir, projectId),
      path.join(this.baselineDir, projectId),
      path.join(this.diffDir, projectId),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate visual tests from generated UI
   */
  async generateTestsForProject(projectId: string): Promise<VisualTest[]> {
    logger.info('Generating visual tests for project', { projectId });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        artifacts: {
          where: {
            type: 'code_frontend',
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const tests: VisualTest[] = [];

    // Parse frontend artifacts to find routes/pages
    for (const artifact of project.artifacts) {
      if (artifact.content && typeof artifact.content === 'object') {
        const content = artifact.content as any;

        // Extract routes from frontend code
        if (content.files && Array.isArray(content.files)) {
          for (const file of content.files) {
            // Look for route definitions
            const routeMatches = file.content.matchAll(/path:\s*['"](\/[^'"]*)['"]/g);
            for (const match of routeMatches) {
              const routePath = match[1];
              tests.push({
                name: `route-${routePath.replace(/\//g, '-') || 'home'}`,
                url: `http://localhost:3000${routePath}`,
                viewport: { width: 1280, height: 720 },
              });
            }

            // Also test mobile viewport
            if (routeMatches) {
              for (const match of routeMatches) {
                const routePath = match[1];
                tests.push({
                  name: `route-${routePath.replace(/\//g, '-') || 'home'}-mobile`,
                  url: `http://localhost:3000${routePath}`,
                  viewport: { width: 375, height: 667 },
                });
              }
            }
          }
        }
      }
    }

    // Add default tests if no routes found
    if (tests.length === 0) {
      tests.push(
        {
          name: 'home-desktop',
          url: 'http://localhost:3000',
          viewport: { width: 1280, height: 720 },
        },
        {
          name: 'home-mobile',
          url: 'http://localhost:3000',
          viewport: { width: 375, height: 667 },
        }
      );
    }

    logger.info('Visual tests generated', {
      projectId,
      testCount: tests.length,
    });

    return tests;
  }
}

// Export singleton
export const visualTestingService = new VisualTestingService();
