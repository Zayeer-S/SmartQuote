import type { Knex } from 'knex';
import { TicketsDAO } from '../daos/children/tickets.dao.js';
import { TicketCommentsDAO } from '../daos/children/ticket.comments.dao.js';
import { TicketAttachmentsDAO } from '../daos/children/ticket.attachments.dao.js';
import { UsersDAO } from '../daos/children/users.dao.js';
import { TicketService } from '../services/ticket/ticket.service.js';
import { CommentService } from '../services/ticket/comment.service.js';
import { AttachmentService } from '../services/ticket/attachment.service.js';
import { TicketPriorityEngine } from '../services/ticket/ticket.priority.engine.js';
import { TicketController } from '../controllers/ticket.controller.js';
import { RBACService } from '../services/rbac/rbac.service.js';
import { LookupResolver } from '../lib/lookup-resolver.js';
import type { BertEmbedder } from '../lib/nlp/bert-embedder.js';
import {
  TicketPriorityRulesDAO,
  TicketPriorityThresholdsDAO,
} from '../daos/children/ticket.priority.dao.js';
import { OrganizationMembersDAO } from '../daos/children/organizations.domain.dao.js';
import type { StorageService } from '../services/storage/storage.service.js';
import { LocalStorageService } from '../services/storage/local.storage.service.js';
import { S3StorageService } from '../services/storage/s3.storage.service.js';
import { FILE_STORAGE_TYPES } from '../../shared/constants/index.js';
import type { FileStorageType } from '../../shared/constants/lookup-values.js';
import { backEnv } from '../config/env.backend.js';

export class TicketContainer {
  public readonly ticketsDAO: TicketsDAO;
  public readonly ticketCommentsDAO: TicketCommentsDAO;
  public readonly ticketAttachmentsDAO: TicketAttachmentsDAO;
  public readonly usersDAO: UsersDAO;
  public readonly priorityRulesDAO: TicketPriorityRulesDAO;
  public readonly priorityThresholdsDAO: TicketPriorityThresholdsDAO;

  public readonly storageService: StorageService;
  public readonly priorityEngine: TicketPriorityEngine;
  public readonly attachmentService: AttachmentService;
  public readonly ticketService: TicketService;
  public readonly commentService: CommentService;

  public readonly ticketController: TicketController;

  constructor(
    db: Knex,
    rbacService: RBACService,
    orgMembersDAO: OrganizationMembersDAO,
    lookupResolver: LookupResolver,
    embedder: BertEmbedder | null
  ) {
    this.ticketsDAO = new TicketsDAO(db);
    this.ticketCommentsDAO = new TicketCommentsDAO(db);
    this.ticketAttachmentsDAO = new TicketAttachmentsDAO(db);
    this.usersDAO = new UsersDAO(db);
    this.priorityRulesDAO = new TicketPriorityRulesDAO(db);
    this.priorityThresholdsDAO = new TicketPriorityThresholdsDAO(db);

    // S3 is active when region and bucket are configured. Explicit credentials
    // are optional - Lambda uses its execution role via the provider chain.
    const isS3 = backEnv.AWS_REGION !== undefined && backEnv.AWS_S3_BUCKET !== undefined;

    let storageTypeName: FileStorageType;

    if (isS3) {
      this.storageService = new S3StorageService({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        region: backEnv.AWS_REGION!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        bucket: backEnv.AWS_S3_BUCKET!,
        // Passed only when explicitly set (local dev pointing at real S3). Omitted in Lambda so the execution role is used instead.
        ...(backEnv.AWS_ACCESS_KEY_ID && backEnv.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: backEnv.AWS_ACCESS_KEY_ID,
              secretAccessKey: backEnv.AWS_SECRET_ACCESS_KEY,
            }
          : {}),
      });
      storageTypeName = FILE_STORAGE_TYPES.S3;
    } else {
      this.storageService = new LocalStorageService();
      storageTypeName = FILE_STORAGE_TYPES.LOCAL;
    }

    this.priorityEngine = new TicketPriorityEngine(
      this.priorityRulesDAO,
      this.priorityThresholdsDAO,
      embedder,
      db
    );

    this.attachmentService = new AttachmentService(
      this.ticketAttachmentsDAO,
      this.storageService,
      lookupResolver,
      storageTypeName
    );

    this.ticketService = new TicketService(
      db,
      this.ticketsDAO,
      this.usersDAO,
      orgMembersDAO,
      rbacService,
      lookupResolver,
      this.priorityEngine,
      this.attachmentService
    );

    this.commentService = new CommentService(
      this.ticketCommentsDAO,
      this.ticketService,
      rbacService,
      lookupResolver
    );

    this.ticketController = new TicketController(
      this.ticketService,
      this.commentService,
      this.attachmentService,
      lookupResolver
    );
  }
}
