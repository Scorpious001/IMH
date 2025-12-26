import React, { useState, useEffect } from 'react';
import { itemsService } from '../../services/itemsService';
import { locationsService } from '../../services/locationsService';
import { vendorsService } from '../../services/vendorsService';
import { Item } from '../../types/item.types';
import { Location } from '../../types/location.types';
import { Vendor } from '../../types/vendor.types';
import QuantityStepper from '../shared/QuantityStepper';
import './ReceiveForm.css';

interface ReceiveFormProps {
  onSubmit: (data: {
    item_id: number;
    to_location_id: number;
    qty: number;
    cost?: number;
    vendor_id?: number;
    po_number?: string;
    notes?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

const ReceiveForm: React.FC<ReceiveFormProps> = ({ onSubmit, onCancel }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [formData, setFormData] = useState({
    item_id: 0,
    to_location_id: 0,
    qty: 1,
    cost: '',
    vendor_id: 0,
    po_number: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (itemSearchTerm) {
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
          item.short_code.toLowerCase().includes(itemSearchTerm.toLowerCase())
      );
      setFilteredItems(filtered.slice(0, 10));
    } else {
      setFilteredItems([]);
    }
  }, [itemSearchTerm, items]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, locationsData, vendorsData] = await Promise.all([
        itemsService.getAll(),
        locationsService.getAll(),
        vendorsService.getAll(),
      ]);
      setItems(itemsData);
      setLocations(locationsData);
      setVendors(vendorsData.filter((v) => v.is_active));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id || !formData.to_location_id || formData.qty <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    await onSubmit({
      item_id: formData.item_id,
      to_location_id: formData.to_location_id,
      qty: formData.qty,
      cost: formData.cost ? Number(formData.cost) : undefined,
      vendor_id: formData.vendor_id || undefined,
      po_number: formData.po_number || undefined,
      notes: formData.notes || undefined,
    });
  };

  const selectedItem = items.find((i) => i.id === formData.item_id);

  if (loading) {
    return <div className="form-loading">Loading...</div>;
  }

  return (
    <div className="receive-form">
      <h2>Receive Items</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Item *</label>
          <div className="item-selector">
            <input
              type="text"
              placeholder="Search item..."
              value={
                formData.item_id && selectedItem
                  ? `${selectedItem.name} (${selectedItem.short_code})`
                  : itemSearchTerm
              }
              onChange={(e) => {
                setItemSearchTerm(e.target.value);
                if (!e.target.value) {
                  setFormData({ ...formData, item_id: 0 });
                }
              }}
              onFocus={() => {
                if (formData.item_id && selectedItem) {
                  setItemSearchTerm(selectedItem.name);
                }
              }}
              required
            />
            {filteredItems.length > 0 && (
              <div className="item-dropdown">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="item-option"
                    onClick={() => {
                      setFormData({ ...formData, item_id: item.id });
                      setItemSearchTerm('');
                      setFilteredItems([]);
                    }}
                  >
                    {item.photo_url && (
                      <img src={item.photo_url} alt={item.name} className="item-option-photo" />
                    )}
                    <div className="item-option-details">
                      <div className="item-option-name">{item.name}</div>
                      <div className="item-option-code">{item.short_code}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Location *</label>
          <select
            value={formData.to_location_id}
            onChange={(e) => setFormData({ ...formData, to_location_id: Number(e.target.value) })}
            required
          >
            <option value={0}>Select location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quantity *</label>
          <QuantityStepper
            value={formData.qty}
            onChange={(qty) => setFormData({ ...formData, qty })}
            min={0.01}
            step={0.01}
          />
        </div>

        <div className="form-group">
          <label>Cost (optional)</label>
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
          <label>Vendor (optional)</label>
          <select
            value={formData.vendor_id}
            onChange={(e) => setFormData({ ...formData, vendor_id: Number(e.target.value) })}
          >
            <option value={0}>No vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>PO Number (optional)</label>
          <input
            type="text"
            value={formData.po_number}
            onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
            placeholder="PO-12345"
          />
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Additional notes..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Receive Items
          </button>
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReceiveForm;

