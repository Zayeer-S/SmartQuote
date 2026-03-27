import type { TicketSeverity, BusinessImpact } from '../../../shared/constants/index.js';

export interface PriorityEngineInput {
  ticketSeverity: TicketSeverity;
  businessImpact: BusinessImpact;
  usersImpacted: number;
  deadline: Date;
  description: string;
}

export interface PriorityRule {
  dimension: string;
  value_name: string;
  points: number;
}

export interface PriorityThreshold {
  ticket_priority_id: number;
  min_score: number;
  max_score: number;
}
