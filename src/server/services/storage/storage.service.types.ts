/** A file received from a multipart request, before it is written to storage */
export interface IncomingFile {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
}

/** Metadata returned by StorageService after a successful upload */
export interface StoredFile {
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}
