/**
 * Encryption Service
 * Handles encryption and decryption of sensitive data using Supabase Vault
 */

import crypto from 'crypto'
import { createServerSupabaseClient } from '@/lib/database/clients'
import { IntegrationCredentials, CustomMcpCredentials } from '@/lib/types/integrations'
import { logger } from '@/lib/utils/logger'

// Type for encrypted data structure
interface EncryptedData extends PrismaJson.EncryptedCredentials {
  encrypted: string
  iv: string
  tag: string
  algorithm: string
  keyVersion?: number
}

// Type guard for encrypted data
function isEncryptedData(data: unknown): data is EncryptedData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'encrypted' in data &&
    'iv' in data &&
    'tag' in data &&
    'algorithm' in data &&
    typeof (data as EncryptedData).encrypted === 'string' &&
    typeof (data as EncryptedData).iv === 'string' &&
    typeof (data as EncryptedData).tag === 'string' &&
    typeof (data as EncryptedData).algorithm === 'string'
  )
}

export class EncryptionService {
  private supabase = createServerSupabaseClient()
  private algorithm = 'aes-256-gcm'
  private keyVersion = 1
  private secretName = process.env.SUPABASE_VAULT_SECRET_NAME || 'integration_encryption_key'
  private cachedKey: Buffer | null = null
  private keyExpiresAt: number = 0

  /**
   * Get or create encryption key from Supabase Vault
   */
  private async getEncryptionKey(): Promise<Buffer> {
    try {
      // Check if we have a valid cached key
      if (this.cachedKey && Date.now() < this.keyExpiresAt) {
        return this.cachedKey
      }

      // First, try to read existing secret using RPC
      const { data: existingSecret, error: fetchError } = await this.supabase
        .rpc('read_secret', { secret_name: this.secretName })

      logger.info('Vault read attempt', { 
        secretName: this.secretName, 
        fetchError: fetchError?.message,
        hasData: !!existingSecret 
      })

      if (!fetchError && existingSecret) {
        // Secret exists, use it
        logger.info('✅ ENCRYPTION DEBUG - Retrieved key from Vault successfully', {
          secretName: this.secretName,
          keyLength: existingSecret.length,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        });
        this.cachedKey = Buffer.from(existingSecret, 'base64')
        this.keyExpiresAt = Date.now() + 3600000 // Cache for 1 hour
        return this.cachedKey
      }

      // Key doesn't exist, create a new one
      const newKey = crypto.randomBytes(32)
      const keyBase64 = newKey.toString('base64')

      logger.info('Creating new vault secret', { secretName: this.secretName })

      // Create the secret using Supabase Vault RPC function
      const { data: createData, error: createError } = await this.supabase.rpc('create_secret', {
        new_secret: keyBase64,
        new_name: this.secretName,
        new_description: 'Encryption key for integration credentials'
      })

      logger.info('Vault create result', { 
        createError: createError?.message,
        createData,
        secretName: this.secretName 
      })

      if (createError) {
        throw new Error(`Failed to create encryption key: ${createError.message}`)
      }

      this.cachedKey = newKey
      this.keyExpiresAt = Date.now() + 3600000 // Cache for 1 hour
      return newKey
    } catch (error) {
      logger.error('❌ ENCRYPTION DEBUG - Failed to get encryption key from Vault', { 
        error: error instanceof Error ? error.message : String(error),
        secretName: this.secretName,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      })
      
      // Fallback: Use a derived key from environment (for development)
      const fallbackSeed = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-key-seed'
      const fallbackKey = crypto.createHash('sha256').update(fallbackSeed + this.secretName).digest()
      
      logger.warn('🔄 ENCRYPTION DEBUG - Using fallback encryption key due to Vault error', {
        fallbackSeedLength: fallbackSeed.length,
        secretName: this.secretName,
        fallbackKeyGenerated: !!fallbackKey,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      })
      this.cachedKey = fallbackKey
      this.keyExpiresAt = Date.now() + 3600000 // Cache for 1 hour
      return fallbackKey
    }
  }

  /**
   * Encrypt integration credentials
   */
  async encryptCredentials(
    credentials: IntegrationCredentials | CustomMcpCredentials
  ): Promise<EncryptedData> {
    try {
      const key = await this.getEncryptionKey()
      
      // Generate random IV
      const iv = crypto.randomBytes(16)
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM
      
      // Encrypt the credentials
      const credentialsString = JSON.stringify(credentials)
      const encrypted = Buffer.concat([
        cipher.update(credentialsString, 'utf8'),
        cipher.final()
      ])
      
      // Get the auth tag
      const tag = cipher.getAuthTag()
      
      return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        algorithm: this.algorithm,
        keyVersion: this.keyVersion
      }
    } catch (error) {
      logger.error('Failed to encrypt credentials', { error })
      throw new Error('Failed to encrypt credentials')
    }
  }

  /**
   * Decrypt integration credentials
   */
  async decryptCredentials<T extends IntegrationCredentials | CustomMcpCredentials>(
    encryptedData: unknown
  ): Promise<T> {
    try {
      logger.info('🔍 ENCRYPTION DEBUG - Starting decryption', {
        hasEncryptedData: !!encryptedData,
        encryptedDataType: typeof encryptedData,
        encryptedDataStructure: encryptedData,
        secretName: this.secretName,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });

      // Validate encrypted data structure
      if (!isEncryptedData(encryptedData)) {
        logger.error('❌ ENCRYPTION DEBUG - Invalid encrypted data format', {
          encryptedData,
          encryptedDataType: typeof encryptedData,
          timestamp: new Date().toISOString()
        });
        throw new Error('Invalid encrypted data format')
      }

      logger.info('✅ ENCRYPTION DEBUG - Encrypted data validation passed', {
        algorithm: encryptedData.algorithm,
        keyVersion: encryptedData.keyVersion,
        hasEncrypted: !!encryptedData.encrypted,
        hasIv: !!encryptedData.iv,
        hasTag: !!encryptedData.tag,
        timestamp: new Date().toISOString()
      });

      const key = await this.getEncryptionKey()
      
      // Decode from base64
      const encrypted = Buffer.from(encryptedData.encrypted, 'base64')
      const iv = Buffer.from(encryptedData.iv, 'base64')
      const tag = Buffer.from(encryptedData.tag, 'base64')
      
      // Create decipher
      const decipher = crypto.createDecipheriv(encryptedData.algorithm || this.algorithm, key, iv) as crypto.DecipherGCM
      decipher.setAuthTag(tag)
      
      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ])
      
      return JSON.parse(decrypted.toString('utf8')) as T
    } catch (error) {
      logger.error('Failed to decrypt credentials', { error })
      throw new Error('Failed to decrypt credentials')
    }
  }

  /**
   * Check if data is encrypted
   */
  isEncrypted(data: unknown): boolean {
    return isEncryptedData(data)
  }

  /**
   * Rotate encryption key (for future use)
   */
  async rotateKey(): Promise<void> {
    // Implementation for key rotation
    // This would involve:
    // 1. Creating a new key with incremented version
    // 2. Re-encrypting all existing data
    // 3. Updating keyVersion
    throw new Error('Key rotation not implemented yet')
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService()