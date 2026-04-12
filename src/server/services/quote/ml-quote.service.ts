import { BUSINESS_HOURS } from '../../../shared/constants/index.js';
import { TicketEmbeddingsDAO } from '../../daos/children/ticket-nlp.dao.js';
import type { Ticket } from '../../database/types/tables.js';

export interface MLQuoteFeatures {
  ticket_type_id: number;
  ticket_severity_id: number;
  business_impact_id: number;
  users_impacted: number;
  deadline_offset_days: number;
  is_after_hours: number;
}

export interface MLQuoteResult {
  estimated_hours_minimum: number;
  estimated_hours_maximum: number;
  estimated_cost: number;
  suggested_ticket_priority_id: number;
  priority_confidence: number;
}

function deadlineOffsetDays(deadline: Date, now: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return (deadline.getTime() - now.getTime()) / msPerDay;
}

function isAfterHours(date: Date): 0 | 1 {
  const hour = date.getHours();
  return hour >= BUSINESS_HOURS.START_HOUR && hour < BUSINESS_HOURS.END_HOUR ? 0 : 1;
}

export class MLQuoteService {
  private ticketEmbeddingsDAO: TicketEmbeddingsDAO;
  private serviceUrl: string | undefined;
  private clock: () => Date;

  constructor(
    ticketEmbeddingsDAO: TicketEmbeddingsDAO,
    serviceUrl: string | undefined,
    clock: () => Date = () => new Date()
  ) {
    this.ticketEmbeddingsDAO = ticketEmbeddingsDAO;
    this.serviceUrl = serviceUrl;
    this.clock = clock;
  }

  /**
   * Generates an ML-derived quote estimate by:
   *  1. Fetching the pre-computed embedding via findByTicketIds.
   *  2. Building the tabular feature vector from the ticket row.
   *  3. POSTing both to the ML quote microservice.
   *  4. Returning the structured result.
   *
   * Returns null (never throws) when:
   *  - ML_QUOTE_SERVICE_URL is not configured
   *  - No embedding exists for the ticket yet
   *  - The service call fails for any reason
   *
   * Callers should treat null as "ML estimate unavailable" and fall back
   * to the rule-based quote engine result only.
   */
  async generateMLQuote(ticket: Ticket): Promise<MLQuoteResult | null> {
    if (!this.serviceUrl) return null;

    const rows = await this.ticketEmbeddingsDAO.findByTicketIds([ticket.id]);
    const embedding = rows[0];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!embedding) return null;

    const now = this.clock();

    const features: MLQuoteFeatures = {
      ticket_type_id: ticket.ticket_type_id as unknown as number,
      ticket_severity_id: ticket.ticket_severity_id as unknown as number,
      business_impact_id: ticket.business_impact_id as unknown as number,
      users_impacted: ticket.users_impacted,
      deadline_offset_days: deadlineOffsetDays(ticket.deadline, now),
      is_after_hours: isAfterHours(now),
    };

    try {
      const res = await fetch(`${this.serviceUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding: embedding.embedding, features }),
      });

      if (!res.ok) {
        console.error(`[MLQuoteService] Service returned ${String(res.status)}`);
        return null;
      }

      return (await res.json()) as MLQuoteResult;
    } catch (err) {
      console.error('[MLQuoteService] Request failed:', err);
      return null;
    }
  }
}
