import React, { useState, useEffect } from 'react';
import { itemsService } from '../../services/itemsService';
import { Item } from '../../types/item.types';
import { ReasonCode } from '../../types/count.types';
import QuantityStepper from '../shared/QuantityStepper';
import './CountLineForm.css';

interface CountLineFormProps {
  onSubmit: (data: {
    item_id: number;
    counted_qty: number;
    reason_code?: ReasonCode;
    notes?: string;
  }) => void;
  onCancel?: () => void;
  expectedQty?: number;
}

const CountLineForm: React.FC<CountLineFormProps> = ({
  onSubmit,
  onCancel,
  expectedQty,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [formData, setFormData] = useState({
    item_id: 0,
    counted_qty: expectedQty || 0,
    reason_code: '' as ReasonCode | '',
    notes: '',
  });

  useEffect(() => {
    loadItems();
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

  useEffect(() => {
    if (expectedQty !== undefined) {
      setFormData((prev) => ({ ...prev, counted_qty: expectedQty }));
    }
  }, [expectedQty]);

  const loadItems = async () => {
    try {
      const data = await itemsService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id || formData.counted_qty < 0) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit({
      item_id: formData.item_id,
      counted_qty: formData.counted_qty,
      reason_code: formData.reason_code || undefined,
      notes: formData.notes || undefined,
    });
    // Reset form
    setFormData({
      item_id: 0,
      counted_qty: expectedQty || 0,
      reason_code: '',
      notes: '',
    });
    setItemSearchTerm('');
  };

  const selectedItem = items.find((i) => i.id === formData.item_id);
  const variance = selectedItem && expectedQty !== undefined
    ? formData.counted_qty - expectedQty
    : 0;

  return (
    <form className="count-line-form" onSubmit={handleSubmit}>
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

      {expectedQty !== undefined && (
        <div className="form-group">
          <label>Expected Quantity</label>
          <div className="expected-qty">{expectedQty}</div>
        </div>
      )}

      <div className="form-group">
        <label>Counted Quantity *</label>
        <QuantityStepper
          value={formData.counted_qty}
          onChange={(qty) => setFormData({ ...formData, counted_qty: qty })}
          min={0}
          step={0.01}
        />
      </div>

      {expectedQty !== undefined && variance !== 0 && (
        <div className="form-group">
          <label>Variance</label>
          <div className={`variance-display ${variance > 0 ? 'positive' : 'negative'}`}>
            {variance > 0 ? '+' : ''}{variance}
          </div>
        </div>
      )}

      {variance !== 0 && (
        <div className="form-group">
          <label>Reason Code</label>
          <select
            value={formData.reason_code}
            onChange={(e) =>
              setFormData({ ...formData, reason_code: e.target.value as ReasonCode | '' })
            }
          >
            <option value="">Select reason (optional)</option>
            <option value="LOST">Lost</option>
            <option value="DAMAGED">Damaged</option>
            <option value="VENDOR_ERROR">Vendor Error</option>
            <option value="DATA_ERROR">Data Error</option>
            <option value="THEFT">Theft</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      )}

      <div className="form-group">
        <label>Notes (optional)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          placeholder="Additional notes..."
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Add Line
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default CountLineForm;

