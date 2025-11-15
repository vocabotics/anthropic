import { Octokit } from '@octokit/rest';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { keyManagerService } from './key-manager.service';

export interface CreateRepoInput {
  name: string;
  description?: string;
  isPrivate?: boolean;
  autoInit?: boolean;
}

export interface CreateCommitInput {
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: {
    path: string;
    content: string;
  }[];
}

export interface CreatePullRequestInput {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string; // Source branch
  base: string; // Target branch (usually 'main')
}

export interface AutoPRInput {
  projectId: string;
  artifactType: 'prd' | 'architecture' | 'code' | 'tests';
  artifactVersion: number;
  requirementIds: string[];
  summary: string;
}

/**
 * GitHub Integration Service
 * Handles repository creation, commits, PRs, and OAuth
 */
export class GitHubService {
  /**
   * Get Octokit client for user (using their GitHub token)
   */
  private async getOctokitForUser(userId: string): Promise<Octokit> {
    // Try to get user's GitHub token from BYOK
    const githubToken = await keyManagerService.getDecryptedKey(userId, 'github');

    if (!githubToken) {
      throw new Error('GitHub token not found. Please connect your GitHub account.');
    }

    return new Octokit({
      auth: githubToken,
    });
  }

  /**
   * Get authenticated user's GitHub info
   */
  async getAuthenticatedUser(userId: string) {
    try {
      const octokit = await this.getOctokitForUser(userId);
      const { data } = await octokit.users.getAuthenticated();

      logger.info('Retrieved GitHub user info', {
        userId,
        githubUsername: data.login,
      });

      return {
        id: data.id,
        login: data.login,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatar_url,
        bio: data.bio,
        publicRepos: data.public_repos,
      };
    } catch (error) {
      logger.error('Failed to get GitHub user', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to retrieve GitHub user information');
    }
  }

  /**
   * Create a new repository for a project
   */
  async createRepository(
    userId: string,
    projectId: string,
    input: CreateRepoInput
  ): Promise<string> {
    try {
      const octokit = await this.getOctokitForUser(userId);

      // Create repository
      const { data: repo } = await octokit.repos.createForAuthenticatedUser({
        name: input.name,
        description: input.description,
        private: input.isPrivate ?? true,
        auto_init: input.autoInit ?? true,
      });

      logger.info('GitHub repository created', {
        userId,
        projectId,
        repoName: repo.name,
        repoUrl: repo.html_url,
      });

      // Update project with GitHub info
      await prisma.project.update({
        where: { id: projectId },
        data: {
          githubRepoUrl: repo.html_url,
          githubRepoName: repo.full_name,
        },
      });

      return repo.html_url;
    } catch (error) {
      logger.error('Failed to create GitHub repository', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to create GitHub repository');
    }
  }

  /**
   * Create a commit with multiple files
   */
  async createCommit(
    userId: string,
    projectId: string,
    input: CreateCommitInput
  ): Promise<string> {
    try {
      const octokit = await this.getOctokitForUser(userId);

      // Get current commit SHA
      const { data: refData } = await octokit.git.getRef({
        owner: input.owner,
        repo: input.repo,
        ref: `heads/${input.branch}`,
      });

      const currentCommitSha = refData.object.sha;

      // Get current tree
      const { data: currentCommit } = await octokit.git.getCommit({
        owner: input.owner,
        repo: input.repo,
        commit_sha: currentCommitSha,
      });

      // Create blobs for each file
      const blobs = await Promise.all(
        input.files.map(async (file) => {
          const { data: blob } = await octokit.git.createBlob({
            owner: input.owner,
            repo: input.repo,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          };
        })
      );

      // Create new tree
      const { data: newTree } = await octokit.git.createTree({
        owner: input.owner,
        repo: input.repo,
        base_tree: currentCommit.tree.sha,
        tree: blobs,
      });

      // Create commit
      const { data: newCommit } = await octokit.git.createCommit({
        owner: input.owner,
        repo: input.repo,
        message: input.message,
        tree: newTree.sha,
        parents: [currentCommitSha],
      });

      // Update reference
      await octokit.git.updateRef({
        owner: input.owner,
        repo: input.repo,
        ref: `heads/${input.branch}`,
        sha: newCommit.sha,
      });

      logger.info('GitHub commit created', {
        userId,
        projectId,
        commitSha: newCommit.sha,
        fileCount: input.files.length,
      });

      // Record in database
      await prisma.stateTransition.create({
        data: {
          projectId,
          fromState: 'implementation',
          toState: 'committed',
          triggeredBy: userId,
          metadata: {
            commitSha: newCommit.sha,
            message: input.message,
            fileCount: input.files.length,
          },
        },
      });

      return newCommit.sha;
    } catch (error) {
      logger.error('Failed to create GitHub commit', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to create GitHub commit');
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    userId: string,
    projectId: string,
    input: CreatePullRequestInput
  ): Promise<string> {
    try {
      const octokit = await this.getOctokitForUser(userId);

      const { data: pr } = await octokit.pulls.create({
        owner: input.owner,
        repo: input.repo,
        title: input.title,
        body: input.body,
        head: input.head,
        base: input.base,
      });

      logger.info('GitHub pull request created', {
        userId,
        projectId,
        prNumber: pr.number,
        prUrl: pr.html_url,
      });

      return pr.html_url;
    } catch (error) {
      logger.error('Failed to create GitHub pull request', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to create GitHub pull request');
    }
  }

  /**
   * Automatically create PR with AI-generated description
   */
  async createAutomatedPR(
    userId: string,
    input: AutoPRInput
  ): Promise<string> {
    try {
      // Get project
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
        include: {
          artifacts: {
            where: {
              type: input.artifactType,
              version: input.artifactVersion,
            },
          },
        },
      });

      if (!project || !project.githubRepoName) {
        throw new Error('Project or GitHub repository not found');
      }

      const [owner, repo] = project.githubRepoName.split('/');

      // Create feature branch
      const branchName = `feature/${input.artifactType}-v${input.artifactVersion}-${Date.now()}`;

      // Generate PR title and description
      const prTitle = this.generatePRTitle(input);
      const prBody = this.generatePRDescription(input, project);

      // Create PR
      const prUrl = await this.createPullRequest(userId, input.projectId, {
        owner,
        repo,
        title: prTitle,
        body: prBody,
        head: branchName,
        base: project.defaultBranch || 'main',
      });

      logger.info('Automated PR created', {
        userId,
        projectId: input.projectId,
        artifactType: input.artifactType,
        prUrl,
      });

      return prUrl;
    } catch (error) {
      logger.error('Failed to create automated PR', {
        userId,
        projectId: input.projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate PR title
   */
  private generatePRTitle(input: AutoPRInput): string {
    const typeLabel = {
      prd: 'docs',
      architecture: 'docs',
      code: 'feat',
      tests: 'test',
    }[input.artifactType];

    return `${typeLabel}: ${input.summary}`;
  }

  /**
   * Generate PR description
   */
  private generatePRDescription(input: AutoPRInput, project: any): string {
    const artifact = project.artifacts[0];

    return `## Summary

${input.summary}

## Artifact Details

- **Type**: ${input.artifactType}
- **Version**: ${input.artifactVersion}
- **Generated**: ${artifact?.createdAt || 'Just now'}

## Requirements Covered

${input.requirementIds.map(id => `- ${id}`).join('\n')}

## Test Plan

- [ ] Review generated code
- [ ] Run unit tests (\`pnpm test\`)
- [ ] Run integration tests
- [ ] Verify all requirements are met
- [ ] Check for security issues
- [ ] Test in development environment

## Quality Metrics

- **Lines of Code**: ~${artifact?.metadata?.totalLines || 'N/A'}
- **Files Changed**: ~${artifact?.metadata?.totalFiles || 'N/A'}
- **AI Cost**: $${artifact?.metadata?.cost || 'N/A'}

## Generated by Vocabotics

This PR was automatically generated by [Vocabotics](https://vocabotics.com).

**Orchestration > Iteration**: Single comprehensive AI generation with full requirement traceability.

---

Please review and merge if all tests pass.
`;
  }

  /**
   * Create CI/CD workflow file
   */
  async setupGitHubActions(
    userId: string,
    projectId: string,
    workflowConfig: string
  ): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || !project.githubRepoName) {
        throw new Error('Project or GitHub repository not found');
      }

      const [owner, repo] = project.githubRepoName.split('/');

      // Commit workflow file
      await this.createCommit(userId, projectId, {
        owner,
        repo,
        branch: 'main',
        message: 'ci: Add GitHub Actions workflow',
        files: [
          {
            path: '.github/workflows/ci.yml',
            content: workflowConfig,
          },
        ],
      });

      logger.info('GitHub Actions workflow created', {
        userId,
        projectId,
      });
    } catch (error) {
      logger.error('Failed to setup GitHub Actions', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * List repositories for authenticated user
   */
  async listRepositories(userId: string, page: number = 1, perPage: number = 30) {
    try {
      const octokit = await this.getOctokitForUser(userId);

      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        page,
        per_page: perPage,
        sort: 'updated',
        direction: 'desc',
      });

      return repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch,
        language: repo.language,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        updatedAt: repo.updated_at,
      }));
    } catch (error) {
      logger.error('Failed to list GitHub repositories', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to list GitHub repositories');
    }
  }

  /**
   * Create initial project structure in GitHub
   * This is called automatically when a project is created
   */
  async initializeProjectRepository(
    userId: string,
    projectId: string,
    projectName: string,
    projectDescription: string
  ): Promise<string> {
    try {
      // Create repository
      const repoUrl = await this.createRepository(userId, projectId, {
        name: projectName.toLowerCase().replace(/\s+/g, '-'),
        description: projectDescription,
        isPrivate: true,
        autoInit: true,
      });

      // Get project details for initial commit
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const [owner, repo] = project.githubRepoName?.split('/') || [];

      if (!owner || !repo) {
        throw new Error('Invalid repository name');
      }

      // Create initial README
      const readmeContent = `# ${project.name}

${project.description}

## Project Vision

${project.vision}

## Technology Stack

${JSON.stringify(project.technologyStack, null, 2)}

## Generated by Vocabotics

This project was generated using [Vocabotics](https://vocabotics.com) - AI-powered software development platform.

**Orchestration > Iteration**: Single comprehensive AI generations with full traceability.
`;

      // Commit initial files
      await this.createCommit(userId, projectId, {
        owner,
        repo,
        branch: 'main',
        message: '🚀 Initial project setup by Vocabotics',
        files: [
          {
            path: 'README.md',
            content: readmeContent,
          },
          {
            path: '.gitignore',
            content: `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov

# Production
build/
dist/

# Environment
.env
.env.local
.env.production

# Logs
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`,
          },
        ],
      });

      logger.info('GitHub repository initialized', {
        userId,
        projectId,
        repoUrl,
      });

      return repoUrl;
    } catch (error) {
      logger.error('Failed to initialize GitHub repository', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Export singleton instance
export const githubService = new GitHubService();
