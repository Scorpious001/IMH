export interface Permission {
  id: number;
  module: 'catalog' | 'stock' | 'vendors' | 'requisitions' | 'receiving' | 'counts' | 'reports';
  action: 'view' | 'create' | 'edit' | 'delete';
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  role?: 'SUPERVISOR' | 'MANAGER' | 'ADMIN';
  permissions?: string[]; // Array of permission names like ['catalog.view', 'catalog.create']
  profile?: {
    id: number;
    role: 'SUPERVISOR' | 'MANAGER' | 'ADMIN';
    department?: {
      id: number;
      name: string;
      code?: string;
    };
  };
}

