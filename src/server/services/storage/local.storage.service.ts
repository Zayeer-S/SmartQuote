import fs from 'fs/promises';
import path from 'path';
import type { StorageService } from './storage.service.js';
import type { IncomingFile, StoredFile } from './storage.service.types.js';
import { STORAGE_ERROR_MSGS, StorageError } from './storage.errors.js';

/**
 * Local filesystem StorageService.
 * Files are written to: {uploadRoot}/{storageKey}
 * where storageKey is "tickets/:ticketId/:uuid-originalName".
 *
 * uploadRoot defaults to {cwd}/uploads and is injected via the constructor
 * so it can be overridden in tests without touching the filesystem.
 */
export class LocalStorageService implements StorageService {
  private readonly uploadRoot: string;

  constructor(uploadRoot?: string) {
    this.uploadRoot = uploadRoot ?? path.join(process.cwd(), 'uploads');
  }

  async upload(file: IncomingFile, storageKey: string): Promise<StoredFile> {
    const absPath = this.resolve(storageKey);

    try {
      await fs.mkdir(path.dirname(absPath), { recursive: true });
      await fs.writeFile(absPath, file.buffer);
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
    const absPath = this.resolve(storageKey);

    try {
      await fs.unlink(absPath);
    } catch (err) {
      // ENOENT means the file is already gone - that is acceptable
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw new StorageError(`${STORAGE_ERROR_MSGS.DELETE_FAILED}: ${(err as Error).message}`);
    }
  }

  getUrl(storageKey: string): string {
    return this.resolve(storageKey);
  }

  private resolve(storageKey: string): string {
    // Guard against path traversal
    const resolved = path.resolve(this.uploadRoot, storageKey);
    if (!resolved.startsWith(this.uploadRoot)) {
      throw new StorageError(STORAGE_ERROR_MSGS.INVALID_KEY, 400);
    }
    return resolved;
  }
}
