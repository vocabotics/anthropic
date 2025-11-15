import { OpenRouterClient, OpenRouterMessage, MODELS } from '../../lib/openrouter';
import { logger } from '../../utils/logger';
import { ArchitectureDocument, DataModel } from './architecture-generator.service';

export interface PrismaSchema {
  models: string[];
  enums: string[];
  fullSchema: string;
}

export interface DatabaseMigration {
  id: string;
  description: string;
  sql: string;
  rollback: string;
}

/**
 * Schema Generator Service
 * Generates database schemas (Prisma, SQL) from architecture
 */
export class SchemaGeneratorService {
  /**
   * Generate Prisma schema from data models
   */
  async generatePrismaSchema(
    architecture: ArchitectureDocument,
    client: OpenRouterClient
  ): Promise<PrismaSchema> {
    const systemPrompt = `You are an expert database architect specializing in Prisma ORM.

Generate production-ready Prisma schemas that:
1. Follow Prisma best practices
2. Include proper indexes for performance
3. Define all relationships correctly
4. Use appropriate field types
5. Include Vocabotics traceability comments
6. Handle cascading deletes appropriately
7. Include unique constraints where needed

Output format:
- Full Prisma schema with all models
- Proper naming conventions (PascalCase for models, camelCase for fields)
- Comprehensive comments
- Model-level and field-level attributes`;

    const userPrompt = `Generate a complete Prisma schema based on these data models:

${JSON.stringify(architecture.dataModels, null, 2)}

Requirements:
1. Use PostgreSQL as the database
2. Add createdAt and updatedAt to all models
3. Use UUID for all primary keys
4. Add proper indexes for foreign keys and commonly queried fields
5. Include traceability comments linking to requirement IDs
6. Handle all relationships (oneToOne, oneToMany, manyToMany)

Example format:
\`\`\`prisma
// vocabotics-requirements: REQ-F-001, REQ-F-002
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  projects      Project[]

  @@index([email])
  @@map("users")
}
\`\`\`

Generate the complete schema.`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const result = await client.complete({
        model: MODELS.SONNET_4_5,
        messages,
        temperature: 0.3, // Lower temperature for structured output
        max_tokens: 8000,
      });

      const schema = this.parsePrismaSchema(result.content);

      logger.info('Prisma schema generated', {
        models: schema.models.length,
        enums: schema.enums.length,
      });

      return schema;
    } catch (error) {
      logger.error('Schema generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate SQL migrations
   */
  async generateMigrations(
    architecture: ArchitectureDocument,
    client: OpenRouterClient
  ): Promise<DatabaseMigration[]> {
    const systemPrompt = `You are an expert in database migrations and SQL.

Generate database migrations that:
1. Create tables in dependency order
2. Include proper foreign key constraints
3. Add indexes for performance
4. Handle data types correctly for PostgreSQL
5. Include rollback scripts
6. Are idempotent (can be run multiple times safely)`;

    const userPrompt = `Generate SQL migrations for these data models:

${JSON.stringify(architecture.dataModels, null, 2)}

Generate migrations as JSON array:
[
  {
    "id": "001_create_users_table",
    "description": "Create users table with authentication fields",
    "sql": "CREATE TABLE users (...);",
    "rollback": "DROP TABLE IF EXISTS users;"
  }
]`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const result = await client.complete({
        model: MODELS.HAIKU_3_5, // Use faster model for structured output
        messages,
        temperature: 0.2,
        max_tokens: 6000,
      });

      const migrations = this.parseMigrations(result.content);

      logger.info('Database migrations generated', {
        count: migrations.length,
      });

      return migrations;
    } catch (error) {
      logger.error('Migration generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Validate schema against data models
   */
  validateSchema(
    dataModels: DataModel[],
    prismaSchema: string
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that all data models are present
    for (const model of dataModels) {
      const modelRegex = new RegExp(`model ${model.name}\\s*{`, 'i');
      if (!modelRegex.test(prismaSchema)) {
        errors.push(`Model ${model.name} not found in schema`);
        continue;
      }

      // Check that all fields are present
      for (const field of model.fields) {
        const fieldRegex = new RegExp(`${field.name}\\s+\\w+`, 'i');
        if (!fieldRegex.test(prismaSchema)) {
          warnings.push(`Field ${field.name} not found in model ${model.name}`);
        }
      }
    }

    // Check for createdAt and updatedAt
    const modelsWithoutTimestamps = [];
    for (const model of dataModels) {
      const modelMatch = prismaSchema.match(
        new RegExp(`model ${model.name}\\s*{([^}]+)}`, 'i')
      );
      if (modelMatch) {
        const modelContent = modelMatch[1];
        if (!modelContent.includes('createdAt') || !modelContent.includes('updatedAt')) {
          modelsWithoutTimestamps.push(model.name);
        }
      }
    }

    if (modelsWithoutTimestamps.length > 0) {
      warnings.push(
        `Models without timestamps: ${modelsWithoutTimestamps.join(', ')}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Parse Prisma schema from AI response
   */
  private parsePrismaSchema(content: string): PrismaSchema {
    // Extract schema from markdown code blocks
    let schemaContent = content.trim();
    const prismaBlockMatch = schemaContent.match(/```prisma\n([\s\S]*?)\n```/);
    if (prismaBlockMatch) {
      schemaContent = prismaBlockMatch[1];
    } else if (schemaContent.startsWith('```')) {
      schemaContent = schemaContent.replace(/^```\w*\n/, '').replace(/\n```$/, '');
    }

    // Extract model names
    const modelMatches = schemaContent.matchAll(/model\s+(\w+)\s*{/g);
    const models = Array.from(modelMatches).map(match => match[1]);

    // Extract enum names
    const enumMatches = schemaContent.matchAll(/enum\s+(\w+)\s*{/g);
    const enums = Array.from(enumMatches).map(match => match[1]);

    // Add datasource and generator if not present
    if (!schemaContent.includes('datasource db')) {
      schemaContent = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

${schemaContent}`;
    }

    return {
      models,
      enums,
      fullSchema: schemaContent,
    };
  }

  /**
   * Parse migrations from AI response
   */
  private parseMigrations(content: string): DatabaseMigration[] {
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const migrations = JSON.parse(jsonContent);

    if (!Array.isArray(migrations)) {
      throw new Error('Migrations must be an array');
    }

    // Validate migration structure
    for (const migration of migrations) {
      if (!migration.id || !migration.sql || !migration.rollback) {
        throw new Error('Invalid migration structure');
      }
    }

    return migrations;
  }
}

// Export singleton
export const schemaGenerator = new SchemaGeneratorService();
