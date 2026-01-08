import { Item } from './item.types';
import { Department } from './department.types';

export type RequestedItemStatus = 'REQUESTED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface RequestedItem {
  id: number;
  user: number;
  user_name: string;
  item: number;
  item_name: string;
  item_short_code: string;
  item_cost?: number;
  department?: number;
  department_name?: string;
  status: RequestedItemStatus;
  requested_at: string;
  requested_qty: number;
  notes?: string;
  priority: number;
  ordered_at?: string;
  received_at?: string;
  cancelled_at?: string;
  cancelled_by?: number;
  cancelled_by_name?: string;
}
