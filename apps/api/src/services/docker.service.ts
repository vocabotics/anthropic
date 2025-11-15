import Docker from 'dockerode';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import path from 'path';
import fs from 'fs/promises';
import { randomBytes } from 'crypto';

const docker = new Docker();

export interface CodeExecutionInput {
  projectId: string;
  userId: string;
  code: string;
  language: 'javascript' | 'typescript' | 'python';
  timeout?: number; // in milliseconds
  environment?: Record<string, string>;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
}

/**
 * Docker Execution Service
 * Safely executes user code in isolated Docker containers
 */
export class DockerService {
  private readonly EXECUTION_TIMEOUT = 30000; // 30 seconds
  private readonly MEMORY_LIMIT = 512 * 1024 * 1024; // 512 MB
  private readonly CPU_QUOTA = 50000; // 50% of one CPU

  // Docker images for different languages
  private readonly IMAGES = {
    javascript: 'node:20-alpine',
    typescript: 'node:20-alpine',
    python: 'python:3.11-alpine',
  };

  /**
   * Execute code in a Docker container
   */
  async executeCode(input: CodeExecutionInput): Promise<ExecutionResult> {
    const startTime = Date.now();
    let containerId: string | null = null;

    try {
      // Ensure image is pulled
      await this.ensureImage(this.IMAGES[input.language]);

      // Create temporary directory for code
      const tempDir = await this.createTempDirectory(input.projectId);
      const fileName = this.getFileName(input.language);
      const filePath = path.join(tempDir, fileName);

      // Write code to file
      await fs.writeFile(filePath, input.code, 'utf-8');

      // Create container
      const container = await docker.createContainer({
        Image: this.IMAGES[input.language],
        Cmd: this.getExecutionCommand(input.language, fileName),
        WorkingDir: '/app',
        Env: this.prepareEnvironment(input.environment),
        HostConfig: {
          Binds: [`${tempDir}:/app:ro`], // Read-only mount
          Memory: this.MEMORY_LIMIT,
          MemorySwap: this.MEMORY_LIMIT, // Disable swap
          CpuQuota: this.CPU_QUOTA,
          NetworkMode: 'none', // No network access
          ReadonlyRootfs: false, // Some runtimes need write access to /tmp
          AutoRemove: true,
        },
        AttachStdout: true,
        AttachStderr: true,
      });

      containerId = container.id;

      // Start container
      await container.start();

      // Wait for execution with timeout
      const timeout = input.timeout || this.EXECUTION_TIMEOUT;
      const result = await Promise.race([
        this.waitForContainer(container),
        this.timeoutPromise(timeout),
      ]);

      if (result === 'timeout') {
        // Kill container on timeout
        await container.kill();
        throw new Error(`Execution timed out after ${timeout}ms`);
      }

      // Get logs
      const logs = await container.logs({
        stdout: true,
        stderr: true,
      });

      const output = logs.toString('utf-8');

      // Get exit code
      const inspection = await container.inspect();
      const exitCode = inspection.State.ExitCode || 0;

      const duration = Date.now() - startTime;

      // Clean up
      await this.cleanupTempDirectory(tempDir);

      // Record execution
      await this.recordExecution(input, exitCode === 0, duration);

      logger.info('Code execution completed', {
        projectId: input.projectId,
        language: input.language,
        success: exitCode === 0,
        duration,
      });

      return {
        success: exitCode === 0,
        output,
        exitCode,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Code execution failed', {
        projectId: input.projectId,
        language: input.language,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      // Record failed execution
      await this.recordExecution(input, false, duration);

      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        duration,
      };
    }
  }

  /**
   * Test execution environment by running a simple test
   */
  async testExecution(language: 'javascript' | 'typescript' | 'python'): Promise<boolean> {
    const testCode = {
      javascript: 'console.log("Hello from Vocabotics!");',
      typescript: 'console.log("Hello from Vocabotics!");',
      python: 'print("Hello from Vocabotics!")',
    };

    const result = await this.executeCode({
      projectId: 'test',
      userId: 'test',
      code: testCode[language],
      language,
    });

    return result.success;
  }

  /**
   * Ensure Docker image is available
   */
  private async ensureImage(image: string): Promise<void> {
    try {
      await docker.getImage(image).inspect();
    } catch (error) {
      // Image doesn't exist, pull it
      logger.info('Pulling Docker image', { image });

      await new Promise((resolve, reject) => {
        docker.pull(image, (err: any, stream: any) => {
          if (err) return reject(err);

          docker.modem.followProgress(stream, (err: any, output: any) => {
            if (err) return reject(err);
            resolve(output);
          });
        });
      });

      logger.info('Docker image pulled successfully', { image });
    }
  }

  /**
   * Create temporary directory for code execution
   */
  private async createTempDirectory(projectId: string): Promise<string> {
    const tempDir = path.join('/tmp', 'vocabotics', projectId, randomBytes(16).toString('hex'));
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  }

  /**
   * Clean up temporary directory
   */
  private async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      logger.warn('Failed to cleanup temp directory', {
        tempDir,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get file name for language
   */
  private getFileName(language: string): string {
    const extensions = {
      javascript: 'index.js',
      typescript: 'index.ts',
      python: 'main.py',
    };
    return extensions[language as keyof typeof extensions] || 'code.txt';
  }

  /**
   * Get execution command for language
   */
  private getExecutionCommand(language: string, fileName: string): string[] {
    const commands = {
      javascript: ['node', fileName],
      typescript: ['npx', 'tsx', fileName],
      python: ['python', fileName],
    };
    return commands[language as keyof typeof commands] || ['cat', fileName];
  }

  /**
   * Prepare environment variables
   */
  private prepareEnvironment(env?: Record<string, string>): string[] {
    const baseEnv = {
      NODE_ENV: 'production',
      PYTHONUNBUFFERED: '1',
    };

    const combined = { ...baseEnv, ...env };
    return Object.entries(combined).map(([key, value]) => `${key}=${value}`);
  }

  /**
   * Wait for container to finish
   */
  private async waitForContainer(container: Docker.Container): Promise<'done'> {
    await container.wait();
    return 'done';
  }

  /**
   * Create timeout promise
   */
  private timeoutPromise(ms: number): Promise<'timeout'> {
    return new Promise((resolve) => {
      setTimeout(() => resolve('timeout'), ms);
    });
  }

  /**
   * Record execution in database
   */
  private async recordExecution(
    input: CodeExecutionInput,
    success: boolean,
    duration: number
  ): Promise<void> {
    try {
      // Only record for real projects (not test executions)
      if (input.projectId === 'test') {
        return;
      }

      await prisma.aiCall.create({
        data: {
          projectId: input.projectId,
          userId: input.userId,
          model: 'docker-execution',
          taskType: 'code_execution',
          phase: 'testing',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          costUsd: 0,
          durationMs: duration,
          cached: false,
          generationQualityScore: success ? 100 : 0,
        },
      });
    } catch (error) {
      logger.warn('Failed to record execution', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get Docker info (for health checks)
   */
  async getInfo(): Promise<any> {
    try {
      return await docker.info();
    } catch (error) {
      logger.error('Failed to get Docker info', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * List running containers (for debugging)
   */
  async listContainers(): Promise<Docker.ContainerInfo[]> {
    try {
      return await docker.listContainers({ all: true });
    } catch (error) {
      logger.error('Failed to list containers', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }
}

// Export singleton instance
export const dockerService = new DockerService();
