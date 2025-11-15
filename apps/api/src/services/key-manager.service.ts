import { prisma } from '../lib/prisma';
import { encrypt, decrypt, EncryptedData, validateEncryptedData } from '../utils/encryption';
import { logger } from '../utils/logger';
import { OpenRouterClient } from '../lib/openrouter';

export interface CreateKeyInput {
  userId: string;
  provider: 'openrouter' | 'github' | 'stripe';
  apiKey: string;
  name?: string;
  description?: string;
}

export interface UpdateKeyInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface KeyInfo {
  id: string;
  provider: string;
  name: string | null;
  description: string | null;
  isActive: boolean;
  lastUsed: Date | null;
  usageCount: number;
  createdAt: Date;
  // Never return the actual key
}

/**
 * BYOK (Bring Your Own Key) Manager
 * Securely stores and manages user API keys with AES-256 encryption
 */
export class KeyManagerService {
  /**
   * Create and encrypt a new API key
   */
  async createKey(input: CreateKeyInput): Promise<KeyInfo> {
    try {
      // Validate the key before storing (if possible)
      if (input.provider === 'openrouter') {
        await this.validateOpenRouterKey(input.apiKey);
      }

      // Encrypt the API key
      const encryptedData = encrypt(input.apiKey);

      // Store in database
      const userKey = await prisma.userAPIKey.create({
        data: {
          userId: input.userId,
          provider: input.provider,
          encryptedKey: JSON.stringify(encryptedData),
          name: input.name || `${input.provider} key`,
          description: input.description,
          isActive: true,
          usageCount: 0,
        },
      });

      logger.info('API key created', {
        userId: input.userId,
        provider: input.provider,
        keyId: userKey.id,
      });

      return this.toKeyInfo(userKey);
    } catch (error) {
      logger.error('Failed to create API key', {
        userId: input.userId,
        provider: input.provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get decrypted API key for use
   */
  async getDecryptedKey(userId: string, provider: string): Promise<string | null> {
    try {
      const userKey = await prisma.userAPIKey.findFirst({
        where: {
          userId,
          provider,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!userKey || !userKey.encryptedKey) {
        return null;
      }

      // Parse encrypted data
      const encryptedData = JSON.parse(userKey.encryptedKey);
      if (!validateEncryptedData(encryptedData)) {
        throw new Error('Invalid encrypted data format');
      }

      // Decrypt
      const decryptedKey = decrypt(encryptedData);

      // Update usage tracking
      await prisma.userAPIKey.update({
        where: { id: userKey.id },
        data: {
          usageCount: { increment: 1 },
          lastUsed: new Date(),
        },
      });

      return decryptedKey;
    } catch (error) {
      logger.error('Failed to decrypt API key', {
        userId,
        provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * List all keys for a user (without decrypted values)
   */
  async listKeys(userId: string, provider?: string): Promise<KeyInfo[]> {
    const keys = await prisma.userAPIKey.findMany({
      where: {
        userId,
        ...(provider && { provider }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return keys.map(key => this.toKeyInfo(key));
  }

  /**
   * Update key metadata
   */
  async updateKey(
    userId: string,
    keyId: string,
    input: UpdateKeyInput
  ): Promise<KeyInfo> {
    const userKey = await prisma.userAPIKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
    });

    if (!userKey) {
      throw new Error('API key not found');
    }

    const updated = await prisma.userAPIKey.update({
      where: { id: keyId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    logger.info('API key updated', {
      userId,
      keyId,
      changes: input,
    });

    return this.toKeyInfo(updated);
  }

  /**
   * Delete an API key
   */
  async deleteKey(userId: string, keyId: string): Promise<void> {
    const userKey = await prisma.userAPIKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
    });

    if (!userKey) {
      throw new Error('API key not found');
    }

    await prisma.userAPIKey.delete({
      where: { id: keyId },
    });

    logger.info('API key deleted', {
      userId,
      keyId,
      provider: userKey.provider,
    });
  }

  /**
   * Validate OpenRouter API key
   */
  private async validateOpenRouterKey(apiKey: string): Promise<void> {
    try {
      const client = OpenRouterClient.withKey(apiKey);
      const isValid = await client.validateKey();

      if (!isValid) {
        throw new Error('Invalid OpenRouter API key');
      }
    } catch (error) {
      logger.error('OpenRouter key validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Invalid OpenRouter API key');
    }
  }

  /**
   * Convert database model to KeyInfo (strips sensitive data)
   */
  private toKeyInfo(userKey: any): KeyInfo {
    return {
      id: userKey.id,
      provider: userKey.provider,
      name: userKey.name,
      description: userKey.description,
      isActive: userKey.isActive,
      lastUsed: userKey.lastUsed,
      usageCount: userKey.usageCount,
      createdAt: userKey.createdAt,
    };
  }

  /**
   * Get OpenRouter client with user's BYOK if available
   */
  async getOpenRouterClient(userId: string): Promise<OpenRouterClient> {
    const userKey = await this.getDecryptedKey(userId, 'openrouter');

    if (userKey) {
      logger.info('Using user BYOK for OpenRouter', { userId });
      return OpenRouterClient.withKey(userKey);
    }

    // Fall back to platform key
    logger.info('Using platform key for OpenRouter', { userId });
    return new OpenRouterClient();
  }
}

// Export singleton instance
export const keyManagerService = new KeyManagerService();
