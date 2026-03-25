export interface RateProfileResponse {
  id: number;
  ticketTypeId: number;
  ticketSeverityId: number;
  businessImpactId: number;
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
  ticketTypeId: number;
  ticketSeverityId: number;
  businessImpactId: number;
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
