import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { BUSINESS_HOURS } from '../../../shared/constants';
import { TicketEmbeddingsDAO } from '../../daos/children/ticket-nlp.dao';
import { Ticket } from '../../database/types/tables';

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
  const msPerDays = 1000 * 60 * 60 * 24;
  return (deadline.getTime() - now.getTime()) / msPerDays;
}

function isAfterHours(date: Date): 0 | 1 {
  const hour = date.getHours();
  return hour >= BUSINESS_HOURS.START_HOUR && hour < BUSINESS_HOURS.END_HOUR ? 0 : 1;
}

export class MLQuoteService {
  private ticketEmbeddingsDAO: TicketEmbeddingsDAO;
  private lambdaFunctionName: string;
  private clock: () => Date;
  private _client: LambdaClient | null = null;

  constructor(
    ticketEmbeddingsDAO: TicketEmbeddingsDAO,
    lambdaFunctionName: string,
    clock: () => Date = () => new Date()
  ) {
    this.ticketEmbeddingsDAO = ticketEmbeddingsDAO;
    this.lambdaFunctionName = lambdaFunctionName;
    this.clock = clock;
  }

  private get client(): LambdaClient {
    this._client ??= new LambdaClient({});
    return this._client;
  }

  /**
   * Generates an ML-derived quote estimate by:
   *  1. Fetching the pre-computed Titan embedding via findByTicketIds.
   *  2. Building the tabular feature vector from the ticket row.
   *  3. Invoking the ML Lambda with both.
   *  4. Returning the structured result.
   *
   * Returns null (never throws) if no embedding exists yet or if the Lambda
   * invocation fails. Callers should treat null as "ML estimate unavailable"
   * and surface the rule-based result only.
   */
  async generateMLQuote(ticket: Ticket): Promise<MLQuoteResult | null> {
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
      const cmd = new InvokeCommand({
        FunctionName: this.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify({ embedding: embedding, features })),
      });

      const res = await this.client.send(cmd);
      if (!res.Payload) return null;

      const raw = JSON.parse(Buffer.from(res.Payload).toString('utf-8')) as {
        statusCode: number;
        body: string;
      };
      if (raw.statusCode !== 200) {
        console.error('[MLQuoteService] Lambda returned non-200:', raw.body);
        return null;
      }

      return JSON.parse(raw.body) as MLQuoteResult;
    } catch (err) {
      console.error('[MLQuoteService] Lambda invocation failed:', err);
      return null;
    }
  }
}
