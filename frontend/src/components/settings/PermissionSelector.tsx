import React, { useState, useEffect } from 'react';
import { usersService, Permission } from '../../services/usersService';
import './PermissionSelector.css';

interface PermissionSelectorProps {
  selectedPermissionIds: number[];
  onChange: (permissionIds: number[]) => void;
}

const PermissionSelector: React.FC<PermissionSelectorProps> = ({
  selectedPermissionIds,
  onChange,
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const data = await usersService.getAvailablePermissions();
      setPermissions(data);
    } catch (error: any) {
      console.error('Error loading permissions:', error);
      // Don't show alert for permissions - it's not critical
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.warn('Cannot load permissions: Backend server may not be running');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (permissionId: number) => {
    const newSelection = selectedPermissionIds.includes(permissionId)
      ? selectedPermissionIds.filter(id => id !== permissionId)
      : [...selectedPermissionIds, permissionId];
    onChange(newSelection);
  };

  const handleModuleToggle = (module: string, checked: boolean) => {
    const modulePermissions = permissions.filter(p => p.module === module);
    const moduleIds = modulePermissions.map(p => p.id);
    
    if (checked) {
      // Add all permissions for this module
      const combined = [...selectedPermissionIds, ...moduleIds];
      const uniqueIds = Array.from(new Set(combined));
      onChange(uniqueIds);
    } else {
      // Remove all permissions for this module
      const newSelection = selectedPermissionIds.filter(id => !moduleIds.includes(id));
      onChange(newSelection);
    }
  };

  const getModulePermissions = (module: string) => {
    return permissions.filter(p => p.module === module).sort((a, b) => {
      const actionOrder = ['view', 'create', 'edit', 'delete'];
      return actionOrder.indexOf(a.action) - actionOrder.indexOf(b.action);
    });
  };

  const isModuleFullySelected = (module: string) => {
    const modulePerms = getModulePermissions(module);
    return modulePerms.length > 0 && modulePerms.every(p => selectedPermissionIds.includes(p.id));
  };

  const isModulePartiallySelected = (module: string) => {
    const modulePerms = getModulePermissions(module);
    const selectedCount = modulePerms.filter(p => selectedPermissionIds.includes(p.id)).length;
    return selectedCount > 0 && selectedCount < modulePerms.length;
  };

  const getModuleDisplayName = (module: string) => {
    const names: { [key: string]: string } = {
      catalog: 'Catalog',
      stock: 'Stock',
      vendors: 'Vendors',
      requisitions: 'Requisitions',
      receiving: 'Receiving',
      counts: 'Counts',
      reports: 'Reports',
    };
    return names[module] || module;
  };

  const getActionDisplayName = (action: string) => {
    const names: { [key: string]: string } = {
      view: 'View',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
    };
    return names[action] || action;
  };

  const modules = ['catalog', 'stock', 'vendors', 'requisitions', 'receiving', 'counts', 'reports'];

  if (loading) {
    return <div className="permission-selector-loading">Loading permissions...</div>;
  }

  return (
    <div className="permission-selector">
      <h4>Permissions</h4>
      <div className="permissions-list">
        {modules.map(module => {
          const modulePerms = getModulePermissions(module);
          if (modulePerms.length === 0) return null;

          const fullySelected = isModuleFullySelected(module);
          const partiallySelected = isModulePartiallySelected(module);

          return (
            <div key={module} className="permission-module">
              <div className="module-header">
                <label className="module-checkbox">
                  <input
                    type="checkbox"
                    checked={fullySelected}
                    ref={(input) => {
                      if (input) input.indeterminate = partiallySelected;
                    }}
                    onChange={(e) => handleModuleToggle(module, e.target.checked)}
                  />
                  <span className="module-name">{getModuleDisplayName(module)}</span>
                </label>
              </div>
              <div className="module-actions">
                {modulePerms.map(permission => (
                  <label key={permission.id} className="action-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedPermissionIds.includes(permission.id)}
                      onChange={() => handleToggle(permission.id)}
                    />
                    <span>{getActionDisplayName(permission.action)}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionSelector;

