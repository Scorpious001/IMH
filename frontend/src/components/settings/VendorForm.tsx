import React, { useState, useEffect } from 'react';
import { Vendor } from '../../types/vendor.types';
import { vendorsService } from '../../services/vendorsService';
import './VendorForm.css';

interface VendorFormProps {
  vendor?: Vendor | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const VendorForm: React.FC<VendorFormProps> = ({ vendor, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    phone: '',
    email: '',
    is_active: true,
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name,
        contact_info: vendor.contact_info || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        is_active: vendor.is_active,
      });
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (vendor) {
        await vendorsService.update(vendor.id, formData);
      } else {
        await vendorsService.create(formData);
      }
      onSubmit();
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Failed to save vendor');
    }
  };

  return (
    <form className="vendor-form" onSubmit={handleSubmit}>
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
          {vendor ? 'Update' : 'Create'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default VendorForm;

