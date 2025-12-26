import React, { useState, useEffect } from 'react';
import { itemsService } from '../../services/itemsService';
import { settingsService } from '../../services/settingsService';
import { vendorsService } from '../../services/vendorsService';
import { Category } from '../../types/item.types';
import { Vendor } from '../../types/vendor.types';
import './AddItemForm.css';

interface AddItemFormProps {
  onSubmit: (item: {
    name: string;
    short_code: string;
    category?: number;
    unit_of_measure: string;
    cost?: number;
    lead_time_days: number;
    default_vendor?: number;
    photo_url?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onSubmit, onCancel }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    short_code: '',
    category: 0,
    unit_of_measure: 'ea',
    cost: '',
    lead_time_days: 0,
    default_vendor: 0,
    photo_url: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, vendorsData] = await Promise.all([
        settingsService.getCategories(),
        vendorsService.getAll(),
      ]);
      setCategories(categoriesData.filter((c) => c.is_active));
      setVendors(vendorsData.filter((v) => v.is_active));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.short_code) {
      alert('Please fill in name and short code');
      return;
    }

    await onSubmit({
      name: formData.name,
      short_code: formData.short_code,
      category: formData.category || undefined,
      unit_of_measure: formData.unit_of_measure,
      cost: formData.cost ? Number(formData.cost) : undefined,
      lead_time_days: formData.lead_time_days,
      default_vendor: formData.default_vendor || undefined,
      photo_url: formData.photo_url || undefined,
    });
  };

  if (loading) {
    return <div className="form-loading">Loading...</div>;
  }

  return (
    <div className="add-item-form">
      <h2>Add New Item</h2>
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
          <label>Short Code *</label>
          <input
            type="text"
            value={formData.short_code}
            onChange={(e) => setFormData({ ...formData, short_code: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: Number(e.target.value) })}
          >
            <option value={0}>No Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Unit of Measure *</label>
          <input
            type="text"
            value={formData.unit_of_measure}
            onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
            placeholder="ea, case, roll, etc."
            required
          />
        </div>

        <div className="form-group">
          <label>Cost</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label>Lead Time (Days)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={formData.lead_time_days}
            onChange={(e) => setFormData({ ...formData, lead_time_days: Number(e.target.value) })}
            required
          />
        </div>

        <div className="form-group">
          <label>Default Vendor</label>
          <select
            value={formData.default_vendor}
            onChange={(e) => setFormData({ ...formData, default_vendor: Number(e.target.value) })}
          >
            <option value={0}>No Vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Photo URL</label>
          <input
            type="url"
            value={formData.photo_url}
            onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Create Item
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddItemForm;

