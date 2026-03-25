import type { IncomingFile, StoredFile } from './storage.service.types.js';

export interface StorageService {
  /**
   * Write a file to the backing store.
   *
   * @param file Incoming file buffer and metadata
   * @param storageKey Provider-agnostic key: "tickets/:ticketId/:uuid-originalName"
   * @returns StoredFile with the confirmed key and metadata
   * @throws StorageError on failure
   */
  upload(file: IncomingFile, storageKey: string): Promise<StoredFile>;

  /**
   * Remove a file from the backing store.
   * Should not throw if the key does not exist - deletion is idempotent.
   *
   * @param storageKey The key returned by upload()
   * @throws StorageError on genuine failures (not on missing key)
   */
  delete(storageKey: string): Promise<void>;

  /**
   * Resolve a storage key to a URL or absolute path suitable for serving.
   * For local storage this is a filesystem path.
   * For S3 this is a presigned URL or a public object URL.
   *
   * @param storageKey The key returned by upload()
   */
  getUrl(storageKey: string): string;

  /**
   * Generate a short-lived presigned URL that allows the holder to PUT a
   * single file directly to the backing store without routing through Lambda.
   *
   * The URL is scoped to the exact storageKey, mimeType, and sizeBytes
   * provided - the backing store should reject PUTs that deviate from these.
   *
   * Not supported by LocalStorageService (no public URL server exists locally).
   * Callers should only invoke this on the S3 implementation.
   *
   * @param storageKey The key the file should be stored under
   * @param mimeType   The Content-Type the PUT request must declare
   * @param sizeBytes  The Content-Length the PUT request must declare
   * @param expiresInSeconds TTL for the presigned URL
   * @returns A presigned URL the browser can PUT to directly
   * @throws StorageError if not supported or on signing failure
   */
  getPresignedUploadUrl(
    storageKey: string,
    mimeType: string,
    sizeBytes: number,
    expiresInSeconds: number
  ): Promise<string>;
}
