import React, { useState, useEffect } from 'react';
import { vendorsService } from '../../services/vendorsService';
import { useAuth } from '../../contexts/AuthContext';
import { Vendor } from '../../types/vendor.types';
import MobileTile from '../../components/shared/MobileTile';
import StatusIndicator from '../../components/shared/StatusIndicator';
import './VendorsPage.css';

const VendorsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('vendors', 'create');
  const canEdit = hasPermission('vendors', 'edit');
  const canDelete = hasPermission('vendors', 'delete');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    phone: '',
    email: '',
    is_active: true,
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorsService.getAll();
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter is handled in render
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      contact_info: '',
      phone: '',
      email: '',
      is_active: true,
    });
    setEditingVendor(null);
    setShowAddForm(true);
  };

  const handleEdit = (vendor: Vendor) => {
    setFormData({
      name: vendor.name,
      contact_info: vendor.contact_info || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      is_active: vendor.is_active,
    });
    setEditingVendor(vendor);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await vendorsService.delete(id);
        loadVendors();
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Failed to delete vendor');
      }
    }
  };

  const handleToggleActive = async (vendor: Vendor) => {
    try {
      await vendorsService.update(vendor.id, {
        is_active: !vendor.is_active,
      });
      loadVendors();
    } catch (error) {
      console.error('Error updating vendor:', error);
      alert('Failed to update vendor status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await vendorsService.update(editingVendor.id, formData);
      } else {
        await vendorsService.create(formData);
      }
      setShowAddForm(false);
      setEditingVendor(null);
      loadVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Failed to save vendor');
    }
  };

  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vendor.phone && vendor.phone.includes(searchTerm))
  );

  if (loading) {
    return <div className="page-loading">Loading vendors...</div>;
  }

  return (
    <div className="vendors-page">
      <div className="page-header">
        <h1>Vendors</h1>
        {canCreate && (
          <button className="btn-primary" onClick={handleAdd}>
            Add Vendor
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Info</label>
                <textarea
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingVendor ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingVendor(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="vendors-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>
      </div>

      <div className="vendors-grid">
        {filteredVendors.length === 0 ? (
          <div className="empty-state">
            <p>No vendors found</p>
            {searchTerm && (
              <button className="btn-link" onClick={() => setSearchTerm('')}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredVendors.map((vendor) => (
            <div key={vendor.id} className="vendor-card">
              <div className="vendor-header">
                <h3>{vendor.name}</h3>
                <StatusIndicator
                  status={vendor.is_active ? 'good' : 'critical'}
                  label={vendor.is_active ? 'Active' : 'Inactive'}
                />
              </div>
              <div className="vendor-details">
                {vendor.email && (
                  <div className="vendor-detail">
                    <strong>Email:</strong> {vendor.email}
                  </div>
                )}
                {vendor.phone && (
                  <div className="vendor-detail">
                    <strong>Phone:</strong> {vendor.phone}
                  </div>
                )}
                {vendor.contact_info && (
                  <div className="vendor-detail">
                    <strong>Contact:</strong> {vendor.contact_info}
                  </div>
                )}
              </div>
              <div className="vendor-actions">
                {canEdit && (
                  <button
                    className="btn-small btn-primary"
                    onClick={() => handleEdit(vendor)}
                  >
                    Edit
                  </button>
                )}
                {canEdit && (
                  <button
                    className="btn-small btn-secondary"
                    onClick={() => handleToggleActive(vendor)}
                  >
                    {vendor.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
                {canDelete && (
                  <button
                    className="btn-small btn-danger"
                    onClick={() => handleDelete(vendor.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorsPage;

