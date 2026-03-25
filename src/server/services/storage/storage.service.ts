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
}
