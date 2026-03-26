import { BusinessImpact, TicketSeverity, TicketType } from '../constants';

export interface RateProfileResponse {
  id: number;
  ticketType: TicketType;
  ticketSeverity: TicketSeverity;
  businessImpact: BusinessImpact;
  businessHoursRate: number;
  afterHoursRate: number;
  multiplier: number;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListRateProfilesResponse {
  rateProfiles: RateProfileResponse[];
}

export interface CreateRateProfileRequest {
  ticketType: TicketType;
  ticketSeverity: TicketSeverity;
  businessImpact: BusinessImpact;
  businessHoursRate: number;
  afterHoursRate: number;
  multiplier: number;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface UpdateRateProfileRequest {
  businessHoursRate?: number;
  afterHoursRate?: number;
  multiplier?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
}
