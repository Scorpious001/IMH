export type RequisitionStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'PICKED' | 'COMPLETED' | 'CANCELLED';

export interface RequisitionLine {
  id: number;
  item: number;
  item_name: string;
  item_short_code: string;
  item_photo_url?: string;
  qty_requested: number;
  qty_picked: number;
  available_qty?: number;
}

export interface Requisition {
  id: number;
  from_location: number;
  from_location_name: string;
  to_location: number;
  to_location_name: string;
  requested_by: number;
  requested_by_name: string;
  status: RequisitionStatus;
  created_at: string;
  needed_by?: string;
  completed_at?: string;
  notes?: string;
  lines: RequisitionLine[];
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  denied_by?: number;
  denied_by_name?: string;
  denied_at?: string;
  denial_reason?: string;
}

