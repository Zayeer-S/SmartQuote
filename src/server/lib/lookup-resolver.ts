import type { LookupMaps } from './lookup-maps.js';
import type {
  TicketStatus,
  TicketType,
  TicketSeverity,
  BusinessImpact,
  TicketPriority,
  CommentType,
  QuoteEffortLevel,
  QuoteConfidenceLevel,
  QuoteCreator,
  QuoteApprovalStatus,
} from '../../shared/constants/lookup-values.js';
import type {
  TicketStatusId,
  TicketTypeId,
  TicketSeverityId,
  BusinessImpactId,
  TicketPriorityId,
  CommentTypeId,
  QuoteEffortLevelId,
  QuoteConfidenceId,
  QuoteCreatorId,
  QuoteApprovalStatusId,
} from '../database/types/ids.js';

export class LookupResolver {
  private maps: LookupMaps;

  constructor(maps: LookupMaps) {
    this.maps = maps;
  }

  ticketStatusId(name: TicketStatus): TicketStatusId {
    return this.nameToId(this.maps.ticketStatuses, name) as TicketStatusId;
  }

  ticketTypeId(name: TicketType): TicketTypeId {
    return this.nameToId(this.maps.ticketTypes, name) as TicketTypeId;
  }

  ticketSeverityId(name: TicketSeverity): TicketSeverityId {
    return this.nameToId(this.maps.ticketSeverities, name) as TicketSeverityId;
  }

  businessImpactId(name: BusinessImpact): BusinessImpactId {
    return this.nameToId(this.maps.businessImpacts, name) as BusinessImpactId;
  }

  ticketPriorityId(name: TicketPriority): TicketPriorityId {
    return this.nameToId(this.maps.ticketPriorities, name) as TicketPriorityId;
  }

  commentTypeId(name: CommentType): CommentTypeId {
    return this.nameToId(this.maps.commentTypes, name) as CommentTypeId;
  }

  quoteEffortLevelId(name: QuoteEffortLevel): QuoteEffortLevelId {
    return this.nameToId(this.maps.quoteEffortLevels, name) as QuoteEffortLevelId;
  }

  quoteConfidenceLevelId(name: QuoteConfidenceLevel): QuoteConfidenceId {
    return this.nameToId(this.maps.quoteConfidenceLevels, name) as QuoteConfidenceId;
  }

  quoteCreatorId(name: QuoteCreator): QuoteCreatorId {
    return this.nameToId(this.maps.quoteCreators, name) as QuoteCreatorId;
  }

  quoteApprovalStatusId(name: QuoteApprovalStatus): QuoteApprovalStatusId {
    return this.nameToId(this.maps.quoteApprovalStatuses, name) as QuoteApprovalStatusId;
  }

  ticketStatusName(id: number): TicketStatus {
    return this.idToName(this.maps.ticketStatuses, id) as TicketStatus;
  }

  ticketTypeName(id: number): TicketType {
    return this.idToName(this.maps.ticketTypes, id) as TicketType;
  }

  ticketSeverityName(id: number): TicketSeverity {
    return this.idToName(this.maps.ticketSeverities, id) as TicketSeverity;
  }

  businessImpactName(id: number): BusinessImpact {
    return this.idToName(this.maps.businessImpacts, id) as BusinessImpact;
  }

  ticketPriorityName(id: number): TicketPriority {
    return this.idToName(this.maps.ticketPriorities, id) as TicketPriority;
  }

  commentTypeName(id: number): CommentType {
    return this.idToName(this.maps.commentTypes, id) as CommentType;
  }

  quoteEffortLevelName(id: number): QuoteEffortLevel {
    return this.idToName(this.maps.quoteEffortLevels, id) as QuoteEffortLevel;
  }

  quoteConfidenceLevelName(id: number | null): QuoteConfidenceLevel | null {
    if (id === null) return null;
    return this.idToName(this.maps.quoteConfidenceLevels, id) as QuoteConfidenceLevel;
  }

  quoteCreatorName(id: number): QuoteCreator {
    return this.idToName(this.maps.quoteCreators, id) as QuoteCreator;
  }

  quoteApprovalStatusName(id: number | null): QuoteApprovalStatus | null {
    if (id === null) return null;
    return this.idToName(this.maps.quoteApprovalStatuses, id) as QuoteApprovalStatus;
  }

  private nameToId(map: Record<string, number>, name: string): number {
    const id = map[name];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (id === undefined) throw new Error(`LookupResolver: unknown name "${name}"`);
    return id;
  }

  private idToName(map: Record<string, number>, id: number): string {
    const entry = Object.entries(map).find(([, v]) => v === id);
    if (!entry) throw new Error(`LookupResolver: unknown id "${String(id)}"`);
    return entry[0];
  }
}
