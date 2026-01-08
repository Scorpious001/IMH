import { Item } from './item.types';
import { Location } from './location.types';

export type PhysicalChangeRequestType = 'ADJUST' | 'COUNT_ADJUST' | 'TRANSFER' | 'ISSUE' | 'RECEIVE';
export type PhysicalChangeRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED' | 'CANCELLED';

export interface PhysicalChangeRequestLine {
  id: number;
  item: number;
  item_name: string;
  item_short_code: string;
  qty: number;
  unit_cost?: number;
  line_cost: number;
  notes?: string;
}

export interface PhysicalChangeRequest {
  id: number;
  request_type: PhysicalChangeRequestType;
  location: number;
  location_name: string;
  requested_by: number;
  requested_by_name: string;
  status: PhysicalChangeRequestStatus;
  created_at: string;
  completed_at?: string;
  notes?: string;
  requires_approval: boolean;
  needs_approval: boolean;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  denied_by?: number;
  denied_by_name?: string;
  denied_at?: string;
  denial_reason?: string;
  total_cost: number;
  cost_threshold: number;
  printed_at?: string;
  printed_by?: number;
  printed_by_name?: string;
  lines: PhysicalChangeRequestLine[];
}
