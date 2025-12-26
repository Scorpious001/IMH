import React, { useState, useEffect } from 'react';
import { itemsService } from '../../services/itemsService';
import { locationsService } from '../../services/locationsService';
import { stockService } from '../../services/stockService';
import { Item } from '../../types/item.types';
import { Location } from '../../types/location.types';
import { ReasonCode } from '../../types/count.types';
import QuantityStepper from '../shared/QuantityStepper';
import './SpotCheck.css';

interface SpotCheckProps {
  onSubmit: (data: {
    item_id: number;
    location_id: number;
    counted_qty: number;
    reason_code?: ReasonCode;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const SpotCheck: React.FC<SpotCheckProps> = ({ onSubmit, onCancel }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [currentQty, setCurrentQty] = useState<number | null>(null);
  const [loadingQty, setLoadingQty] = useState(false);
  const [formData, setFormData] = useState({
    item_id: 0,
    location_id: 0,
    counted_qty: 0,
    reason_code: '' as ReasonCode | '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (formData.item_id && formData.location_id) {
      loadCurrentQuantity();
    } else {
      setCurrentQty(null);
      setFormData((prev) => ({ ...prev, counted_qty: 0 }));
    }
  }, [formData.item_id, formData.location_id]);

  const loadData = async () => {
    try {
      const [itemsData, locationsData] = await Promise.all([
        itemsService.getAll(),
        locationsService.getAll(),
      ]);
      setItems(itemsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load items or locations');
    }
  };

  const loadCurrentQuantity = async () => {
    try {
      setLoadingQty(true);
      const stockLevels = await stockService.getAll({
        item_id: formData.item_id,
        location_id: formData.location_id,
      });
      if (stockLevels.length > 0) {
        const qty = Number(stockLevels[0].on_hand_qty);
        setCurrentQty(qty);
        setFormData((prev) => ({ ...prev, counted_qty: qty }));
      } else {
        setCurrentQty(0);
        setFormData((prev) => ({ ...prev, counted_qty: 0 }));
      }
    } catch (error) {
      console.error('Error loading current quantity:', error);
      setCurrentQty(null);
    } finally {
      setLoadingQty(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.item_id || !formData.location_id) {
      setError('Please select both item and location');
      return;
    }

    if (formData.counted_qty < 0) {
      setError('Counted quantity cannot be negative');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        item_id: formData.item_id,
        location_id: formData.location_id,
        counted_qty: formData.counted_qty,
        reason_code: formData.reason_code || undefined,
        notes: formData.notes || undefined,
      });
      // Reset form on success
      setFormData({
        item_id: 0,
        location_id: 0,
        counted_qty: 0,
        reason_code: '',
        notes: '',
      });
      setItemSearchTerm('');
      setCurrentQty(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit spot check');
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = items.find((i) => i.id === formData.item_id);
  const selectedLocation = locations.find((l) => l.id === formData.location_id);
  const variance = currentQty !== null
    ? formData.counted_qty - currentQty
    : 0;

  return (
    <div className="spot-check">
      <h2>Spot Check</h2>
      {error && <div className="form-error">{error}</div>}

      <form className="spot-check-form" onSubmit={handleSubmit}>
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
              disabled={loading}
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
            value={formData.location_id}
            onChange={(e) =>
              setFormData({ ...formData, location_id: Number(e.target.value) })
            }
            required
            disabled={loading}
          >
            <option value="0">Select location...</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} ({location.type})
              </option>
            ))}
          </select>
        </div>

        {loadingQty && (
          <div className="form-group">
            <div className="loading-indicator">Loading current quantity...</div>
          </div>
        )}

        {currentQty !== null && !loadingQty && (
          <div className="form-group">
            <label>Current Quantity</label>
            <div className="current-qty-display">
              {currentQty} {selectedItem?.unit_of_measure || ''}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>New Quantity *</label>
          <QuantityStepper
            value={formData.counted_qty}
            onChange={(qty) => setFormData({ ...formData, counted_qty: qty })}
            min={0}
            step={0.01}
            disabled={loading || loadingQty}
          />
        </div>

        {currentQty !== null && variance !== 0 && (
          <div className="form-group">
            <label>Variance</label>
            <div className={`variance-display ${variance > 0 ? 'positive' : 'negative'}`}>
              {variance > 0 ? '+' : ''}{variance.toFixed(2)}
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
              disabled={loading}
            >
              <option value="">Select reason (optional)</option>
              <option value="ADJUST">Adjust</option>
              <option value="CORRECTION">Correction</option>
              <option value="SPOT_CHECK">Spot Check</option>
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
            rows={3}
            placeholder="Additional notes..."
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading || loadingQty}>
            {loading ? 'Submitting...' : 'Submit Spot Check'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SpotCheck;

