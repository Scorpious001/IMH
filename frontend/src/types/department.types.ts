export interface Department {
  id: number;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  member_count?: number;
  created_at: string;
  updated_at: string;
}
