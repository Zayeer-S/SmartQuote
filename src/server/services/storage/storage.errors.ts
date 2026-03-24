export class StorageError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'StorageError';
    this.statusCode = statusCode;
  }
}

export const STORAGE_ERROR_MSGS = {
  UPLOAD_FAILED: 'Failed to upload file to storage',
  DELETE_FAILED: 'Failed to delete file from storage',
  INVALID_KEY: 'Invalid storage key',
} as const;
