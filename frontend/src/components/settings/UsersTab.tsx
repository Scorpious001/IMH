import React, { useState, useEffect } from 'react';
import { usersService, User, CreateUserData, UpdateUserData } from '../../services/usersService';
import { useAuth } from '../../contexts/AuthContext';
import PermissionSelector from './PermissionSelector';
import './UsersTab.css';

const UsersTab: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, [searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll(searchTerm || undefined);
      setUsers(data);
    } catch (error: any) {
      console.error('Error loading users:', error);
      let errorMessage = 'Failed to load users';
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'Network Error: Cannot connect to server. Please ensure the backend server is running on http://localhost:8000';
      } else if (error.response) {
        errorMessage = error.response.data?.error || 
                      error.response.data?.detail ||
                      `Server Error: ${error.response.status} ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersService.delete(id);
        loadUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        alert(error.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingUser(null);
    loadUsers();
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'SUPERVISOR': 'Supervisor',
      'MANAGER': 'Manager',
      'ADMIN': 'Admin',
    };
    return roleMap[role] || role;
  };

  const getPermissionDisplay = (user: User) => {
    if (user.role === 'ADMIN') {
      return { text: 'All Permissions', badge: 'permission-all' };
    }
    const count = user.permissions?.length || 0;
    return { 
      text: `${count} permission${count !== 1 ? 's' : ''}`, 
      badge: 'permission-count' 
    };
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="users-tab">
        <div className="access-denied">
          <p>You must be an administrator to manage users.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="tab-loading">Loading users...</div>;
  }

  return (
    <div className="users-tab">
      <div className="tab-header">
        <h2>Users</h2>
        <button className="btn-primary" onClick={handleAdd}>
          Add User
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {showForm && (
        <div className="form-modal">
          <UserForm
            user={editingUser}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
          />
        </div>
      )}

      <div className="users-list">
        {users.length === 0 ? (
          <div className="empty-state">
            <p>No users found</p>
            <button className="btn-primary" onClick={handleAdd}>
              Create First User
            </button>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email || '-'}</td>
                  <td>
                    {user.first_name || user.last_name
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : '-'}
                  </td>
                  <td>
                    <span className={`role-badge role-${(user.role || 'SUPERVISOR').toLowerCase()}`}>
                      {getRoleDisplay(user.role || 'SUPERVISOR')}
                    </span>
                  </td>
                  <td>
                    <span className={`permission-badge ${getPermissionDisplay(user).badge}`}>
                      {getPermissionDisplay(user).text}
                    </span>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button
                        className="btn-small btn-primary"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          className="btn-small btn-danger"
                          onClick={() => handleDelete(user.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

interface UserFormProps {
  user: User | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  // Form data type that includes all fields for form handling
  type FormData = {
    username?: string;
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    role: 'SUPERVISOR' | 'MANAGER' | 'ADMIN';
  };

  const [formData, setFormData] = useState<FormData>({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    role: (user?.role as 'SUPERVISOR' | 'MANAGER' | 'ADMIN') || 'SUPERVISOR',
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load user permissions when editing
    if (user) {
      loadUserPermissions();
    } else {
      setSelectedPermissionIds([]);
      setLoadingPermissions(false);
    }
  }, [user]);

  const loadUserPermissions = async () => {
    if (!user) return;
    setLoadingPermissions(true);
    setError(''); // Clear any previous errors
    try {
      // Fetch user data and available permissions in parallel
      const [userData, allPermissions] = await Promise.all([
        usersService.getById(user.id),
        usersService.getAvailablePermissions()
      ]);
      
      // Extract permission IDs from permission names
      const userPermissionNames = userData.permissions || [];
      const ids = allPermissions
        .filter(p => userPermissionNames.includes(p.name))
        .map(p => p.id);
      
      setSelectedPermissionIds(ids);
      console.log('Loaded permissions for user:', user.username, 'Permission IDs:', ids);
      console.log('User permission names:', userPermissionNames);
      console.log('All available permissions:', allPermissions);
    } catch (error: any) {
      console.error('Error loading user permissions:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.detail || 
                       error.message || 
                       'Failed to load user permissions. Please try again.';
      setError(errorMsg);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (user) {
        // Update existing user
        const updateData: UpdateUserData = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          permission_ids: selectedPermissionIds,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersService.update(user.id, updateData);
      } else {
        // Create new user
        if (!formData.password || !formData.username) {
          setError('Username and password are required for new users');
          return;
        }
        await usersService.create({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          permission_ids: selectedPermissionIds,
        });
      }
      onSubmit();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.error || 'Failed to save user');
    }
  };

  return (
    <div className="user-form">
      <h3>{user ? 'Edit User' : 'Add User'}</h3>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        {!user && (
          <div className="form-group">
            <label>
              Username <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.username || ''}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={!!user}
            />
          </div>
        )}
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>
            Password {!user && <span className="required">*</span>}
          </label>
          <input
            type="password"
            value={formData.password || ''}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!user}
            placeholder={user ? 'Leave blank to keep current password' : ''}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={formData.first_name || ''}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={formData.last_name || ''}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label>
            Role <span className="required">*</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as 'SUPERVISOR' | 'MANAGER' | 'ADMIN',
              })
            }
            required
          >
            <option value="SUPERVISOR">Supervisor</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {loadingPermissions ? (
          <div className="form-group">
            <label>Permissions</label>
            <div className="permission-loading">Loading permissions...</div>
          </div>
        ) : (
          <PermissionSelector
            selectedPermissionIds={selectedPermissionIds}
            onChange={setSelectedPermissionIds}
          />
        )}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {user ? 'Update' : 'Create'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsersTab;

