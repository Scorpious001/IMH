import React, { useState, useEffect } from 'react';
import { Item, Category, Vendor } from '../../types/item.types';
import { itemsService } from '../../services/itemsService';
import api from '../../services/api';
import './EditItemForm.css';

interface EditItemFormProps {
  item: Item;
  onUpdate: (updatedItem: Item) => void;
}

const EditItemForm: React.FC<EditItemFormProps> = ({ item, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [formData, setFormData] = useState({
    name: item.name,
    short_code: item.short_code,
    category: item.category || '',
    default_vendor: item.default_vendor || '',
    cost: item.cost || '',
    unit_of_measure: item.unit_of_measure,
    lead_time_days: item.lead_time_days,
    is_active: item.is_active,
  });

  useEffect(() => {
    loadCategoriesAndVendors();
  }, []);

  const loadCategoriesAndVendors = async () => {
    try {
      const [categoriesRes, vendorsRes] = await Promise.all([
        api.get('/settings/categories/'),
        api.get('/settings/vendors/'),
      ]);
      setCategories(categoriesRes.data.results || categoriesRes.data || []);
      setVendors(vendorsRes.data.results || vendorsRes.data || []);
    } catch (error) {
      console.error('Error loading categories/vendors:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData: any = {
        name: formData.name,
        short_code: formData.short_code,
        unit_of_measure: formData.unit_of_measure,
        lead_time_days: Number(formData.lead_time_days),
        is_active: formData.is_active,
      };

      if (formData.category) {
        updateData.category = Number(formData.category);
      } else {
        updateData.category = null;
      }

      if (formData.default_vendor) {
        updateData.default_vendor = Number(formData.default_vendor);
      } else {
        updateData.default_vendor = null;
      }

      if (formData.cost) {
        updateData.cost = Number(formData.cost);
      } else {
        updateData.cost = null;
      }

      const updatedItem = await itemsService.update(item.id, updateData);
      setSuccess('Item updated successfully');
      onUpdate(updatedItem);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: item.name,
      short_code: item.short_code,
      category: item.category || '',
      default_vendor: item.default_vendor || '',
      cost: item.cost || '',
      unit_of_measure: item.unit_of_measure,
      lead_time_days: item.lead_time_days,
      is_active: item.is_active,
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const onHandLabel = item.property_id 
    ? `On Hand (Property: ${item.property_id})`
    : 'On Hand (Property)';
  const onHandValue = `${item.property_on_hand || 0} ${item.unit_of_measure}`;

  if (!isEditing) {
    return (
      <div className="edit-item-form">
        <div className="read-only-info">
          <div className="read-only-field">
            <label>{onHandLabel}</label>
            <div className="read-only-value">{onHandValue}</div>
            <div className="read-only-help">Sum of quantities across all locations</div>
          </div>
        </div>
        <button onClick={() => setIsEditing(true)} className="edit-button">
          Edit Item
        </button>
      </div>
    );
  }

  return (
    <div className="edit-item-form">
      <h3>Edit Item</h3>
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <form onSubmit={handleSubmit} className="item-edit-form">
        <div className="form-row">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Short Code *</label>
            <input
              type="text"
              name="short_code"
              value={formData.short_code}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Default Vendor</label>
            <select
              name="default_vendor"
              value={formData.default_vendor}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">None</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cost</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Unit of Measure *</label>
            <input
              type="text"
              name="unit_of_measure"
              value={formData.unit_of_measure}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Lead Time (days) *</label>
            <input
              type="number"
              min="0"
              name="lead_time_days"
              value={formData.lead_time_days}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{onHandLabel}</label>
            <input
              type="text"
              value={onHandValue}
              disabled
              className="read-only-input"
            />
            <div className="read-only-help">Sum of quantities across all locations</div>
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={loading}
            />
            Active
          </label>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="cancel-button" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="save-button" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditItemForm;

