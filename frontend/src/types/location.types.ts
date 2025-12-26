export type LocationType = 'STOREROOM' | 'CLOSET' | 'CART' | 'ROOM' | 'OTHER';

export interface Location {
  id: number;
  property_id?: string;
  name: string;
  type: LocationType;
  parent_location?: number;
  parent_location_name?: string;
  floorplan_id?: string;
  coordinates?: string;
  is_active: boolean;
  full_path?: string;
  child_locations?: Location[];
  created_at: string;
  updated_at: string;
}

