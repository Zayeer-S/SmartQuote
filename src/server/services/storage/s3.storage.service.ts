import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
 * getUrl() returns a public object URL - switch to presigned URLs if the
 * bucket is private (recommended for prod).
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

  /**
   * Generate a presigned PUT URL for direct browser-to-S3 uploads.
   *
   * The command is locked to the exact ContentType and ContentLength so S3
   * will reject any PUT that deviates from what was authorized. The browser
   * must send matching Content-Type and Content-Length headers on the PUT.
   *
   * @param storageKey      S3 object key to write to
   * @param mimeType        Content-Type the browser PUT must declare
   * @param sizeBytes       Content-Length the browser PUT must declare
   * @param expiresInSeconds TTL for the presigned URL
   */
  async getPresignedUploadUrl(
    storageKey: string,
    mimeType: string,
    sizeBytes: number,
    expiresInSeconds: number
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        ContentType: mimeType,
        ContentLength: sizeBytes,
      });

      return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    } catch (err) {
      throw new StorageError(
        `${STORAGE_ERROR_MSGS.UPLOAD_FAILED}: failed to generate presigned URL: ${(err as Error).message}`
      );
    }
  }
}
