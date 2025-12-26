import React, { useState, useEffect } from 'react';
import { vendorsService } from '../../services/vendorsService';
import { Vendor } from '../../types/vendor.types';
import VendorForm from './VendorForm';
import './VendorsTab.css';

const VendorsTab: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

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

  const handleAdd = () => {
    setEditingVendor(null);
    setShowForm(true);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setShowForm(true);
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

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingVendor(null);
    loadVendors();
  };

  if (loading) {
    return <div className="tab-loading">Loading vendors...</div>;
  }

  return (
    <div className="vendors-tab">
      <div className="tab-header">
        <h2>Vendors</h2>
        <button className="btn-primary" onClick={handleAdd}>
          Add Vendor
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <VendorForm
            vendor={editingVendor}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingVendor(null);
            }}
          />
        </div>
      )}

      <div className="vendors-list">
        {vendors.length === 0 ? (
          <div className="empty-state">
            <p>No vendors found</p>
            <button className="btn-primary" onClick={handleAdd}>
              Create First Vendor
            </button>
          </div>
        ) : (
          vendors.map((vendor) => (
            <div key={vendor.id} className="vendor-item">
              <div className="vendor-header">
                <div className="vendor-info">
                  <span className="vendor-name">{vendor.name}</span>
                  {!vendor.is_active && (
                    <span className="vendor-inactive">(Inactive)</span>
                  )}
                </div>
                <div className="vendor-actions">
                  <button className="btn-small btn-primary" onClick={() => handleEdit(vendor)}>
                    Edit
                  </button>
                  <button
                    className="btn-small btn-secondary"
                    onClick={() => handleToggleActive(vendor)}
                  >
                    {vendor.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn-small btn-danger" onClick={() => handleDelete(vendor.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <div className="vendor-details">
                {vendor.email && (
                  <div className="detail-item">
                    <strong>Email:</strong> {vendor.email}
                  </div>
                )}
                {vendor.phone && (
                  <div className="detail-item">
                    <strong>Phone:</strong> {vendor.phone}
                  </div>
                )}
                {vendor.contact_info && (
                  <div className="detail-item">
                    <strong>Contact:</strong> {vendor.contact_info}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorsTab;

