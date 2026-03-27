import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageService } from './storage.service.js';
import type { IncomingFile, StoredFile } from './storage.service.types.js';
import { STORAGE_ERROR_MSGS, StorageError } from './storage.errors.js';

export interface S3StorageConfig {
  region: string;
  bucket: string;
  /** Omit in Lambda - the execution role is used via the credential provider chain. */
  accessKeyId?: string;
  /** Omit in Lambda - the execution role is used via the credential provider chain. */
  secretAccessKey?: string;
}

/**
 * AWS S3 implementation of StorageService.
 * The storageKey is used directly as the S3 object key.
 * getUrl() returns a public object URL.
 * getSignedUrl() returns a presigned GET URL for private buckets (recommended for prod).
 */
export class S3StorageService implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      // Only pass explicit credentials when both keys are present.
      // Omitting this block lets the SDK fall back to the credential provider
      // chain (execution role in Lambda, env vars or ~/.aws locally).
      ...(config.accessKeyId && config.secretAccessKey
        ? {
            credentials: {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            },
          }
        : {}),
    });
  }

  async upload(file: IncomingFile, storageKey: string): Promise<StoredFile> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Body: file.buffer,
          ContentType: file.mimeType,
          ContentLength: file.sizeBytes,
        })
      );
    } catch (err) {
      throw new StorageError(`${STORAGE_ERROR_MSGS.UPLOAD_FAILED}: ${(err as Error).message}`);
    }

    return {
      storageKey,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    };
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        })
      );
      // S3 DeleteObject is idempotent - no error on missing key
    } catch (err) {
      throw new StorageError(`${STORAGE_ERROR_MSGS.DELETE_FAILED}: ${(err as Error).message}`);
    }
  }

  getUrl(storageKey: string): string {
    return `https://${this.bucket}.s3.amazonaws.com/${storageKey}`;
  }

  async getSignedUrl(storageKey: string, expirySeconds = 300): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      });

      return await awsGetSignedUrl(this.client, command, { expiresIn: expirySeconds });
    } catch (err) {
      throw new StorageError(
        `${STORAGE_ERROR_MSGS.UPLOAD_FAILED}: failed to generate presigned URL: ${(err as Error).message}`
      );
    }
  }
}
