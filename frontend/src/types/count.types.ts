export type CountStatus = 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'CANCELLED';

export type ReasonCode = 'LOST' | 'DAMAGED' | 'VENDOR_ERROR' | 'DATA_ERROR' | 'THEFT' | 'OTHER';

export interface CountLine {
  id: number;
  item: number;
  item_name: string;
  item_short_code: string;
  item_photo_url?: string;
  expected_qty: number;
  counted_qty: number;
  variance: number;
  reason_code?: ReasonCode;
  notes?: string;
}

export interface CountSession {
  id: number;
  location: number;
  location_name: string;
  counted_by: number;
  counted_by_name: string;
  status: CountStatus;
  started_at: string;
  completed_at?: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  notes?: string;
  lines: CountLine[];
}

