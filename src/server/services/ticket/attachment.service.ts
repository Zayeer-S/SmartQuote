import { randomUUID } from 'crypto';
import type { TicketAttachmentsDAO } from '../../daos/children/ticket.attachments.dao.js';
import type { TransactionContext } from '../../daos/base/types.js';
import type { TicketAttachment } from '../../database/types/tables.js';
import type { TicketId, UserId } from '../../database/types/ids.js';
import type { StorageService } from '../storage/storage.service.js';
import type { IncomingFile } from '../storage/storage.service.types.js';
import { ATTACHMENT_CONFIG } from '../../../shared/constants/index.js';
import type { FileStorageType } from '../../../shared/constants/lookup-values.js';
import type { LookupResolver } from '../../lib/lookup-resolver.js';
import { StorageError } from '../storage/storage.errors.js';

export interface AttachmentMeta {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/** Validation error thrown by AttachmentService. Maps to HTTP 400 in the controller. */
class AttachmentValidationError extends Error {
  readonly name = 'ValidationError';
}

export class AttachmentService {
  private readonly attachmentsDAO: TicketAttachmentsDAO;
  private readonly storageService: StorageService;
  private readonly lookup: LookupResolver;
  private readonly storageTypeName: FileStorageType;

  constructor(
    attachmentsDAO: TicketAttachmentsDAO,
    storageService: StorageService,
    lookup: LookupResolver,
    storageTypeName: FileStorageType
  ) {
    this.attachmentsDAO = attachmentsDAO;
    this.storageService = storageService;
    this.lookup = lookup;
    this.storageTypeName = storageTypeName;
  }

  /**
   * Validate, persist DB records (inside the ticket's transaction), then
   * upload to storage after the transaction commits.
   *
   * Call order enforced by TicketService:
   *   1. Open trx
   *   2. Insert ticket row (inside trx)
   *   3. Call persistAttachmentRecords() (inside trx)
   *   4. Commit trx
   *   5. Call uploadAttachments() (outside trx, post-commit)
   *
   * If uploadAttachments() fails for a file, that attachment DB record is
   * deleted and the file cleanup is attempted. Partial success is acceptable
   * since attachments can be added via comments.
   *
   * @param files Validated incoming files
   * @param ticketId Newly created ticket ID
   * @param actorId Uploading user ID
   * @param options Transaction context - MUST be inside an open transaction
   * @returns Pending upload descriptors to pass to uploadAttachments()
   */
  async persistAttachmentRecords(
    files: IncomingFile[],
    ticketId: TicketId,
    actorId: UserId,
    options: TransactionContext
  ): Promise<PendingUpload[]> {
    if (files.length === 0) return [];

    const storageTypeId = this.lookup.fileStorageTypeId(this.storageTypeName);

    const pending: PendingUpload[] = files.map((file) => {
      const ext = file.originalName.split('.').pop() ?? '';
      const uuid = randomUUID();
      // Provider-agnostic key: tickets/:ticketId/:uuid[-originalName]
      const storageKey = `tickets/${ticketId}/${uuid}${ext ? `.${ext}` : ''}`;

      return { file, storageKey };
    });

    const records = pending.map(({ file, storageKey }) => ({
      uploaded_by_user_id: actorId,
      ticket_id: ticketId,
      storage_key: storageKey,
      original_name: file.originalName,
      storage_type_id: storageTypeId,
      size_bytes: file.sizeBytes,
      mime_type: file.mimeType,
    }));

    await this.attachmentsDAO.createMany(records, options);

    return pending;
  }

  /**
   * Upload files to storage after the DB transaction has committed.
   * Failures are handled per-file: the DB record is deleted and cleanup
   * of any written bytes is attempted. Does not throw.
   *
   * @param pending Descriptors returned by persistAttachmentRecords()
   */
  async uploadAttachments(pending: PendingUpload[]): Promise<void> {
    await Promise.allSettled(
      pending.map(async ({ file, storageKey }) => {
        try {
          await this.storageService.upload(file, storageKey);
        } catch (err) {
          console.error(
            `[AttachmentService] Upload failed for key "${storageKey}":`,
            (err as Error).message
          );

          // Best-effort DB cleanup - the ticket still exists
          try {
            await this.attachmentsDAO.deleteByStorageKey(storageKey);
          } catch (cleanupErr) {
            console.error(
              `[AttachmentService] DB cleanup failed for key "${storageKey}":`,
              (cleanupErr as Error).message
            );
          }

          // Re-throw so Promise.allSettled records this as rejected
          throw err instanceof StorageError ? err : new StorageError((err as Error).message);
        }
      })
    );
  }

  /**
   * Validate files against ATTACHMENT_CONFIG size and MIME type constraints.
   * Does NOT check the per-ticket count - use validateCountForTicket() for that.
   * Call this before opening the DB transaction.
   *
   * @throws AttachmentValidationError (name='ValidationError') on first violation
   */
  validateFiles(files: IncomingFile[]): void {
    for (const file of files) {
      if (file.sizeBytes > ATTACHMENT_CONFIG.MAX_SIZE_BYTES) {
        throw new AttachmentValidationError(
          `File "${file.originalName}" exceeds the maximum size of ${String(ATTACHMENT_CONFIG.MAX_SIZE_BYTES / (1024 * 1024))}MB`
        );
      }

      if (!(ATTACHMENT_CONFIG.ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimeType)) {
        throw new AttachmentValidationError(
          `File "${file.originalName}" has unsupported type "${file.mimeType}". ` +
            `Allowed: ${ATTACHMENT_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`
        );
      }
    }
  }

  /**
   * Check the current attachment count for a ticket and throw if adding
   * one more would exceed MAX_COUNT. Call this before uploading.
   *
   * @throws AttachmentValidationError (name='ValidationError') if at capacity
   */
  async validateCountForTicket(ticketId: TicketId): Promise<void> {
    const existing = await this.attachmentsDAO.countByTicket(ticketId);
    if (existing >= ATTACHMENT_CONFIG.MAX_COUNT) {
      throw new AttachmentValidationError(
        `Ticket already has the maximum of ${String(ATTACHMENT_CONFIG.MAX_COUNT)} attachments`
      );
    }
  }

  /**
   * Retrieve all attachments for a ticket, mapped to response shape.
   *
   * @param ticketId Ticket to fetch attachments for
   * @returns Array of TicketAttachment rows
   */
  async listAttachments(ticketId: TicketId): Promise<TicketAttachment[]> {
    return this.attachmentsDAO.findByTicket(ticketId);
  }

  async uploadAttachment(
    file: IncomingFile,
    ticketId: TicketId,
    actorId: UserId
  ): Promise<TicketAttachment> {
    // Validate size and MIME type first (cheap, no DB)
    this.validateFiles([file]);

    // Validate per-ticket count against live DB state
    await this.validateCountForTicket(ticketId);

    const ext = file.originalName.split('.').pop() ?? '';
    const uuid = randomUUID();
    const storageKey = `tickets/${ticketId}/${uuid}${ext ? `.${ext}` : ''}`;

    const storageTypeId = this.lookup.fileStorageTypeId(this.storageTypeName);

    await this.storageService.upload(file, storageKey);

    const [attachment] = await this.attachmentsDAO.createMany(
      [
        {
          uploaded_by_user_id: actorId,
          ticket_id: ticketId,
          storage_key: storageKey,
          original_name: file.originalName,
          storage_type_id: storageTypeId,
          size_bytes: file.sizeBytes,
          mime_type: file.mimeType,
        },
      ],
      {}
    );

    return attachment;
  }
  /**
   * Fetch a single attachment record and generate a presigned URL for it.
   *
   * @param attachmentId Attachment ID to resolve
   * @param expirySeconds TTL for the presigned URL
   * @returns Presigned URL string
   * @throws TicketError(404) if the attachment does not exist
   */
  async getAttachmentUrl(attachmentId: string, expirySeconds: number) {
    const attachment = await this.attachmentsDAO.getById(attachmentId as never);
    if (!attachment) {
      const err = new Error(`Attachment not found: ${attachmentId}`);
      err.name = 'TicketError';
      (err as Error & { statusCode: number }).statusCode = 404;
      throw err;
    }

    return await this.storageService.getSignedUrl(attachment.storage_key, expirySeconds);
  }
}

/** Internal descriptor linking an incoming file to its pre-computed storage key. */
export interface PendingUpload {
  file: IncomingFile;
  storageKey: string;
}
