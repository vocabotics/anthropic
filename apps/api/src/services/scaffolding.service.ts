import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { GeneratedCode } from './generators/code-generator.service';
import path from 'path';
import fs from 'fs/promises';

export interface ProjectScaffold {
  projectId: string;
  projectName: string;
  structure: {
    directories: string[];
    files: {
      path: string;
      content: string;
      description: string;
    }[];
  };
  configuration: {
    packageJson: any;
    tsconfig: any;
    env: Record<string, string>;
  };
  readme: string;
}

/**
 * Project Scaffolding Service
 * Generates complete project structure with all necessary files
 */
export class ScaffoldingService {
  /**
   * Generate complete project scaffold
   */
  async generateProjectScaffold(
    projectId: string,
    techStack: {
      frontend: string[];
      backend: string[];
      database: string[];
    }
  ): Promise<ProjectScaffold> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const projectName = this.sanitizeProjectName(project.name);

    // Generate directory structure
    const directories = this.generateDirectoryStructure(techStack);

    // Generate configuration files
    const configuration = await this.generateConfiguration(project, techStack);

    // Generate base files
    const files = await this.generateBaseFiles(project, techStack, configuration);

    // Generate README
    const readme = this.generateReadme(project, techStack);

    const scaffold: ProjectScaffold = {
      projectId,
      projectName,
      structure: {
        directories,
        files,
      },
      configuration,
      readme,
    };

    logger.info('Project scaffold generated', {
      projectId,
      directories: directories.length,
      files: files.length,
    });

    return scaffold;
  }

  /**
   * Write scaffold to filesystem
   */
  async writeScaffoldToFilesystem(
    scaffold: ProjectScaffold,
    basePath: string
  ): Promise<void> {
    const projectPath = path.join(basePath, scaffold.projectName);

    // Create directories
    for (const dir of scaffold.structure.directories) {
      const dirPath = path.join(projectPath, dir);
      await fs.mkdir(dirPath, { recursive: true });
    }

    // Write files
    for (const file of scaffold.structure.files) {
      const filePath = path.join(projectPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf-8');
    }

    logger.info('Scaffold written to filesystem', {
      projectPath,
      files: scaffold.structure.files.length,
    });
  }

  /**
   * Generate directory structure
   */
  private generateDirectoryStructure(techStack: any): string[] {
    const dirs: string[] = [];

    // Common directories
    dirs.push('.github/workflows');
    dirs.push('docs');

    // Backend directories
    if (techStack.backend?.includes('express')) {
      dirs.push('apps/api/src/routes');
      dirs.push('apps/api/src/services');
      dirs.push('apps/api/src/middleware');
      dirs.push('apps/api/src/utils');
      dirs.push('apps/api/src/lib');
      dirs.push('apps/api/prisma');
      dirs.push('apps/api/tests');
    }

    // Frontend directories
    if (techStack.frontend?.includes('react')) {
      dirs.push('apps/web/src/components');
      dirs.push('apps/web/src/pages');
      dirs.push('apps/web/src/layouts');
      dirs.push('apps/web/src/hooks');
      dirs.push('apps/web/src/stores');
      dirs.push('apps/web/src/lib');
      dirs.push('apps/web/src/utils');
      dirs.push('apps/web/public');
      dirs.push('apps/web/tests');
    }

    // Shared packages
    dirs.push('packages/types');
    dirs.push('packages/shared');

    return dirs;
  }

  /**
   * Generate configuration files
   */
  private async generateConfiguration(project: any, techStack: any) {
    // Root package.json
    const rootPackageJson = {
      name: this.sanitizeProjectName(project.name),
      version: '0.1.0',
      private: true,
      workspaces: ['apps/*', 'packages/*'],
      scripts: {
        dev: 'turbo run dev',
        build: 'turbo run build',
        test: 'turbo run test',
        lint: 'turbo run lint',
        'type-check': 'turbo run type-check',
      },
      devDependencies: {
        turbo: '^1.11.0',
        typescript: '^5.3.3',
      },
    };

    // Backend package.json
    const apiPackageJson = {
      name: '@' + this.sanitizeProjectName(project.name) + '/api',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'tsx watch src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js',
        test: 'jest',
        'test:watch': 'jest --watch',
        'prisma:generate': 'prisma generate',
        'prisma:push': 'prisma db push',
        'prisma:seed': 'tsx prisma/seed.ts',
      },
      dependencies: {
        express: '^4.18.2',
        '@prisma/client': '^5.7.0',
        'dotenv': '^16.3.1',
        cors: '^2.8.5',
        helmet: '^7.1.0',
        compression: '^1.7.4',
        bcrypt: '^5.1.1',
        jsonwebtoken: '^9.0.2',
        zod: '^3.22.4',
        ioredis: '^5.3.2',
        axios: '^1.6.2',
        winston: '^3.11.0',
      },
      devDependencies: {
        '@types/express': '^4.17.21',
        '@types/node': '^20.10.5',
        '@types/bcrypt': '^5.0.2',
        '@types/jsonwebtoken': '^9.0.5',
        '@types/cors': '^2.8.17',
        '@types/compression': '^1.7.5',
        typescript: '^5.3.3',
        tsx: '^4.7.0',
        prisma: '^5.7.0',
        jest: '^29.7.0',
        '@types/jest': '^29.5.11',
        'ts-jest': '^29.1.1',
        supertest: '^6.3.3',
        '@types/supertest': '^6.0.2',
      },
    };

    // Frontend package.json
    const webPackageJson = {
      name: '@' + this.sanitizeProjectName(project.name) + '/web',
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
        test: 'vitest',
        'test:ui': 'vitest --ui',
        lint: 'eslint . --ext ts,tsx',
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.21.0',
        axios: '^1.6.2',
        zustand: '^4.4.7',
        '@tanstack/react-query': '^5.17.0',
        'lucide-react': '^0.303.0',
        clsx: '^2.0.0',
        'tailwind-merge': '^2.2.0',
      },
      devDependencies: {
        '@types/react': '^18.2.45',
        '@types/react-dom': '^18.2.18',
        '@vitejs/plugin-react': '^4.2.1',
        vite: '^5.0.8',
        typescript: '^5.3.3',
        tailwindcss: '^3.4.0',
        autoprefixer: '^10.4.16',
        postcss: '^8.4.32',
        vitest: '^1.1.0',
        '@testing-library/react': '^14.1.2',
        '@testing-library/jest-dom': '^6.1.5',
        '@vitest/ui': '^1.1.0',
      },
    };

    // TypeScript config
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022'],
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: './dist',
        rootDir: './src',
        forceConsistentCasingInFileNames: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'tests'],
    };

    // Environment variables
    const env = {
      NODE_ENV: 'development',
      API_PORT: '3001',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/dbname',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'change-this-in-production',
      FRONTEND_URL: 'http://localhost:5173',
    };

    return {
      packageJson: rootPackageJson,
      apiPackageJson,
      webPackageJson,
      tsconfig,
      env,
    };
  }

  /**
   * Generate base files
   */
  private async generateBaseFiles(
    project: any,
    techStack: any,
    configuration: any
  ) {
    const files = [];

    // Root files
    files.push({
      path: 'package.json',
      content: JSON.stringify(configuration.packageJson, null, 2),
      description: 'Root package.json with workspace configuration',
    });

    files.push({
      path: 'turbo.json',
      content: JSON.stringify(
        {
          $schema: 'https://turbo.build/schema.json',
          pipeline: {
            build: {
              dependsOn: ['^build'],
              outputs: ['dist/**', 'build/**'],
            },
            dev: {
              cache: false,
            },
            test: {
              cache: false,
            },
            lint: {
              outputs: [],
            },
          },
        },
        null,
        2
      ),
      description: 'Turborepo configuration',
    });

    files.push({
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

# OS
.DS_Store
Thumbs.db

# Turbo
.turbo
`,
      description: 'Git ignore file',
    });

    files.push({
      path: '.env.example',
      content: Object.entries(configuration.env)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n'),
      description: 'Environment variables template',
    });

    // Backend files
    files.push({
      path: 'apps/api/package.json',
      content: JSON.stringify(configuration.apiPackageJson, null, 2),
      description: 'Backend API package.json',
    });

    files.push({
      path: 'apps/api/tsconfig.json',
      content: JSON.stringify(configuration.tsconfig, null, 2),
      description: 'Backend TypeScript configuration',
    });

    files.push({
      path: 'apps/api/.env.example',
      content: Object.entries(configuration.env)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n'),
      description: 'Backend environment template',
    });

    // Frontend files
    files.push({
      path: 'apps/web/package.json',
      content: JSON.stringify(configuration.webPackageJson, null, 2),
      description: 'Frontend package.json',
    });

    // GitHub Actions
    files.push({
      path: '.github/workflows/ci.yml',
      content: this.generateGitHubActionsCIConfig(project),
      description: 'CI/CD pipeline configuration',
    });

    return files;
  }

  /**
   * Generate README.md
   */
  private generateReadme(project: any, techStack: any): string {
    return `# ${project.name}

${project.description || 'Generated by Vocabotics'}

## Vision

${project.vision}

## Technology Stack

**Frontend:**
${techStack.frontend?.map((t: string) => `- ${t}`).join('\n') || '- Not specified'}

**Backend:**
${techStack.backend?.map((t: string) => `- ${t}`).join('\n') || '- Not specified'}

**Database:**
${techStack.database?.map((t: string) => `- ${t}`).join('\n') || '- Not specified'}

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- pnpm (recommended) or npm

### Installation

\`\`\`bash
# Install dependencies
pnpm install

# Setup database
cd apps/api
pnpm prisma:generate
pnpm prisma:push
pnpm prisma:seed

# Start development servers
cd ../..
pnpm dev
\`\`\`

### Environment Variables

Copy \`.env.example\` to \`.env\` and update with your configuration.

## Project Structure

\`\`\`
.
├── apps/
│   ├── api/          # Backend API (Express + TypeScript)
│   └── web/          # Frontend (React + TypeScript + Vite)
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── shared/       # Shared utilities
└── docs/             # Documentation
\`\`\`

## Development

- **Backend**: \`cd apps/api && pnpm dev\`
- **Frontend**: \`cd apps/web && pnpm dev\`
- **All**: \`pnpm dev\` (from root)

## Testing

\`\`\`bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
\`\`\`

## Building

\`\`\`bash
pnpm build
\`\`\`

## Generated by Vocabotics

This project was generated using [Vocabotics](https://vocabotics.com) - AI-powered software development platform.

**Orchestration > Iteration**: Single comprehensive AI generations with full traceability from requirements to code.

## License

MIT
`;
  }

  /**
   * Generate GitHub Actions CI config
   */
  private generateGitHubActionsCIConfig(project: any): string {
    return `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Build
        run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: echo "Add deployment steps here"
`;
  }

  /**
   * Sanitize project name for filesystem/npm
   */
  private sanitizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Merge generated code into scaffold
   */
  async mergeGeneratedCode(
    scaffold: ProjectScaffold,
    generatedCode: GeneratedCode
  ): Promise<ProjectScaffold> {
    // Add generated files to scaffold
    for (const file of generatedCode.files) {
      scaffold.structure.files.push({
        path: file.path,
        content: file.content,
        description: `Generated ${file.type}: ${file.vocaboticsId}`,
      });
    }

    logger.info('Generated code merged into scaffold', {
      projectId: scaffold.projectId,
      newFiles: generatedCode.files.length,
    });

    return scaffold;
  }
}

// Export singleton
export const scaffoldingService = new ScaffoldingService();
