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
   * For S3 this is a public object URL (use getSignedUrl for private buckets).
   *
   * @param storageKey The key returned by upload()
   */
  getUrl(storageKey: string): string;

  /**
   * Generate a short-lived presigned URL for downloading a file.
   * For S3 this is a presigned GET URL valid for expirySeconds.
   * For local storage this falls back to getUrl() since there is no
   * bucket ACL to work around.
   *
   * @param storageKey The key returned by upload()
   * @param expirySeconds TTL for the presigned URL (default: 300)
   */
  getSignedUrl(storageKey: string, expirySeconds?: number): Promise<string>;
}
