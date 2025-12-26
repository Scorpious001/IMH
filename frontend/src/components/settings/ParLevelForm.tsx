import React, { useState, useEffect } from 'react';
import { itemsService } from '../../services/itemsService';
import { locationsService } from '../../services/locationsService';
import { stockService } from '../../services/stockService';
import { Item } from '../../types/item.types';
import { Location } from '../../types/location.types';
import { StockLevel } from '../../types/stock.types';
import { settingsService } from '../../services/settingsService';
import QuantityStepper from '../shared/QuantityStepper';
import './ParLevelForm.css';

interface ParLevelFormProps {
  onSubmit: () => void;
  onCancel?: () => void;
}

interface ParLevelUpdate {
  item_id: number;
  location_id: number;
  par: number;
}

const ParLevelForm: React.FC<ParLevelFormProps> = ({ onSubmit, onCancel }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [par, setPar] = useState(0);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [updates, setUpdates] = useState<ParLevelUpdate[]>([]);

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
    if (selectedItem && selectedLocation) {
      loadStockLevel();
    }
  }, [selectedItem, selectedLocation]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, locationsData] = await Promise.all([
        itemsService.getAll(),
        locationsService.getAll(),
      ]);
      setItems(itemsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStockLevel = async () => {
    if (!selectedItem || !selectedLocation) return;
    try {
      const stockData = await stockService.getAll({
        item_id: selectedItem,
        location_id: selectedLocation,
      });
      if (stockData.length > 0) {
        setPar(Number(stockData[0].par) || 0);
        setStockLevels(stockData);
      } else {
        setPar(0);
        setStockLevels([]);
      }
    } catch (error) {
      console.error('Error loading stock level:', error);
    }
  };

  const handleAddUpdate = () => {
    if (!selectedItem || !selectedLocation) {
      alert('Please select both item and location');
      return;
    }
    const existingIndex = updates.findIndex(
      (u) => u.item_id === selectedItem && u.location_id === selectedLocation
    );
    const update: ParLevelUpdate = {
      item_id: selectedItem,
      location_id: selectedLocation,
      par: par,
    };
    if (existingIndex >= 0) {
      const newUpdates = [...updates];
      newUpdates[existingIndex] = update;
      setUpdates(newUpdates);
    } else {
      setUpdates([...updates, update]);
    }
    // Reset selection
    setSelectedItem(null);
    setSelectedLocation(null);
    setItemSearchTerm('');
    setPar(0);
  };

  const handleRemoveUpdate = (index: number) => {
    setUpdates(updates.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updates.length === 0) {
      alert('Please add at least one par level update');
      return;
    }
    try {
      await settingsService.updateParLevels(updates);
      setUpdates([]);
      onSubmit();
      alert('Par levels updated successfully!');
    } catch (error) {
      console.error('Error updating par levels:', error);
      alert('Failed to update par levels');
    }
  };

  if (loading) {
    return <div className="form-loading">Loading...</div>;
  }

  const selectedItemObj = items.find((i) => i.id === selectedItem);
  const selectedLocationObj = locations.find((l) => l.id === selectedLocation);

  return (
    <form className="par-level-form" onSubmit={handleSubmit}>
      <h3>Set Par Levels</h3>

      <div className="selection-section">
        <div className="form-group">
          <label>Item *</label>
          <div className="item-selector">
            <input
              type="text"
              placeholder="Search item..."
              value={
                selectedItem && selectedItemObj
                  ? `${selectedItemObj.name} (${selectedItemObj.short_code})`
                  : itemSearchTerm
              }
              onChange={(e) => {
                setItemSearchTerm(e.target.value);
                if (!e.target.value) {
                  setSelectedItem(null);
                }
              }}
              onFocus={() => {
                if (selectedItem && selectedItemObj) {
                  setItemSearchTerm(selectedItemObj.name);
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
                      setSelectedItem(item.id);
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
            value={selectedLocation || ''}
            onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {selectedItem && selectedLocation && (
          <>
            <div className="form-group">
              <label>Par Level</label>
              <QuantityStepper
                value={par}
                onChange={(val) => setPar(val)}
                min={0}
                step={0.01}
              />
            </div>

            <button type="button" className="btn-add" onClick={handleAddUpdate}>
              Add to Update List
            </button>
          </>
        )}
      </div>

      {updates.length > 0 && (
        <div className="updates-section">
          <h4>Updates to Apply ({updates.length})</h4>
          <div className="updates-list">
            {updates.map((update, index) => {
              const item = items.find((i) => i.id === update.item_id);
              const location = locations.find((l) => l.id === update.location_id);
              return (
                <div key={index} className="update-item">
                  <div className="update-info">
                    <div className="update-item-name">{item?.name || 'Unknown'}</div>
                    <div className="update-location">{location?.name || 'Unknown'}</div>
                    <div className="update-pars">
                      Par: {update.par}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => handleRemoveUpdate(index)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={updates.length === 0}>
          Apply Updates
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

export default ParLevelForm;

