import crypto from 'crypto';
import { logger } from './logger';

/**
 * AES-256-GCM encryption utilities for BYOK (Bring Your Own Key)
 * Provides secure encryption/decryption of API keys
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Master encryption key from environment
const MASTER_KEY = process.env.ENCRYPTION_KEY || '';

if (!MASTER_KEY && process.env.NODE_ENV === 'production') {
  logger.error('ENCRYPTION_KEY not set in production environment!');
  throw new Error('ENCRYPTION_KEY must be set in production');
}

/**
 * Derive encryption key from master key using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    MASTER_KEY,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );
}

export interface EncryptedData {
  encrypted: string; // Base64 encoded
  iv: string; // Base64 encoded
  salt: string; // Base64 encoded
  tag: string; // Base64 encoded
}

/**
 * Encrypt sensitive data (API keys)
 */
export function encrypt(plaintext: string): EncryptedData {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from master key
    const key = deriveKey(salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      tag: tag.toString('base64'),
    };
  } catch (error) {
    logger.error('Encryption failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data (API keys)
 */
export function decrypt(encryptedData: EncryptedData): string {
  try {
    // Convert from base64
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');
    const encrypted = encryptedData.encrypted;

    // Derive key from master key
    const key = deriveKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash data (for storing hashed versions)
 */
export function hash(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Generate random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate encrypted data structure
 */
export function validateEncryptedData(data: any): data is EncryptedData {
  return (
    typeof data === 'object' &&
    typeof data.encrypted === 'string' &&
    typeof data.iv === 'string' &&
    typeof data.salt === 'string' &&
    typeof data.tag === 'string'
  );
}
