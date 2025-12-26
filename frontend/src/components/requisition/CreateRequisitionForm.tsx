import React, { useState, useEffect } from 'react';
import { locationsService } from '../../services/locationsService';
import { itemsService } from '../../services/itemsService';
import { Location } from '../../types/location.types';
import { Item } from '../../types/item.types';
import QuantityStepper from '../shared/QuantityStepper';
import './CreateRequisitionForm.css';

interface CreateRequisitionFormProps {
  onSubmit: (data: {
    from_location_id: number;
    to_location_id: number;
    lines: Array<{ item_id: number; qty: number }>;
    needed_by?: string;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

interface RequisitionLineForm {
  item_id: number | null;
  qty: number;
}

const CreateRequisitionForm: React.FC<CreateRequisitionFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    from_location_id: 0,
    to_location_id: 0,
    needed_by: '',
    notes: '',
  });
  const [lines, setLines] = useState<RequisitionLineForm[]>([
    { item_id: null, qty: 1 },
  ]);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

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
      const [locationsData, itemsData] = await Promise.all([
        locationsService.getAll(),
        itemsService.getAll(),
      ]);
      setLocations(locationsData);
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLine = () => {
    setLines([...lines, { item_id: null, qty: 1 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof RequisitionLineForm, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.from_location_id === formData.to_location_id) {
      alert('From and To locations must be different');
      return;
    }

    const validLines = lines.filter((line) => line.item_id !== null && line.qty > 0);
    if (validLines.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    await onSubmit({
      from_location_id: formData.from_location_id,
      to_location_id: formData.to_location_id,
      lines: validLines.map((line) => ({
        item_id: line.item_id!,
        qty: line.qty,
      })),
      needed_by: formData.needed_by || undefined,
      notes: formData.notes || undefined,
    });
  };

  if (loading) {
    return <div className="form-loading">Loading...</div>;
  }

  return (
    <div className="create-requisition-form">
      <h2>Create Requisition</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>From Location *</label>
          <select
            value={formData.from_location_id}
            onChange={(e) =>
              setFormData({ ...formData, from_location_id: Number(e.target.value) })
            }
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
          <label>To Location *</label>
          <select
            value={formData.to_location_id}
            onChange={(e) =>
              setFormData({ ...formData, to_location_id: Number(e.target.value) })
            }
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
          <label>Needed By</label>
          <input
            type="datetime-local"
            value={formData.needed_by}
            onChange={(e) => setFormData({ ...formData, needed_by: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>

        <div className="lines-section">
          <div className="lines-header">
            <h3>Line Items</h3>
            <button type="button" className="btn-add-line" onClick={handleAddLine}>
              Add Line
            </button>
          </div>

          {lines.map((line, index) => (
            <div key={index} className="line-form">
              <div className="line-form-item">
                <label>Item *</label>
                <div className="item-selector">
                  <input
                    type="text"
                    placeholder="Search item..."
                    value={
                      line.item_id
                        ? items.find((i) => i.id === line.item_id)?.name || ''
                        : itemSearchTerm
                    }
                    onChange={(e) => {
                      setItemSearchTerm(e.target.value);
                      if (!e.target.value) {
                        handleLineChange(index, 'item_id', null);
                      }
                    }}
                    onFocus={() => {
                      if (line.item_id) {
                        const item = items.find((i) => i.id === line.item_id);
                        setItemSearchTerm(item?.name || '');
                      }
                    }}
                  />
                  {filteredItems.length > 0 && (
                    <div className="item-dropdown">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className="item-option"
                          onClick={() => {
                            handleLineChange(index, 'item_id', item.id);
                            setItemSearchTerm('');
                            setFilteredItems([]);
                          }}
                        >
                          <div className="item-option-name">{item.name}</div>
                          <div className="item-option-code">{item.short_code}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="line-form-qty">
                <label>Quantity *</label>
                <QuantityStepper
                  value={line.qty}
                  onChange={(qty) => handleLineChange(index, 'qty', qty)}
                  min={0.01}
                  step={0.01}
                />
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  className="btn-remove-line"
                  onClick={() => handleRemoveLine(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Create Requisition
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequisitionForm;

