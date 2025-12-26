import React, { useState } from 'react';
import { StockByLocationItem } from '../../types/item.types';
import { StockLevel } from '../../types/stock.types';
import ParLevelEditor from './ParLevelEditor';
import { useAuth } from '../../contexts/AuthContext';
import './ParLevelsSummary.css';

interface ParLevelsSummaryProps {
  stockLevels: StockByLocationItem[];
  unitOfMeasure: string;
  onUpdate?: () => void;
}

const ParLevelsSummary: React.FC<ParLevelsSummaryProps> = ({ 
  stockLevels, 
  unitOfMeasure,
  onUpdate 
}) => {
  const { hasPermission } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const canEdit = hasPermission('par', 'edit');

  if (stockLevels.length === 0) {
    return (
      <div className="par-levels-summary">
        <div className="par-levels-empty">
          No par levels set for this item at any location.
        </div>
      </div>
    );
  }

  const handleEdit = (id: number) => {
    if (canEdit) {
      setEditingId(id);
    }
  };

  const handleUpdate = () => {
    setEditingId(null);
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const getStockLevelForEditor = (stock: StockByLocationItem): StockLevel => {
    // The serializer returns 'item' and 'location' as IDs, but the type might have item_id/location_id
    // Check both to be safe
    const itemId = (stock as any).item !== undefined ? (stock as any).item : stock.item_id;
    const locationId = (stock as any).location !== undefined ? (stock as any).location : (stock.location_id !== undefined ? stock.location_id : stock.location);
    
    if (!itemId || locationId === undefined || locationId === null) {
      console.error('Invalid stock level data:', stock);
      console.error('itemId:', itemId, 'locationId:', locationId);
    }

    return {
      id: stock.id,
      item: itemId || 0,
      item_name: stock.item_name || '',
      item_short_code: stock.item_short_code || '',
      location: locationId || 0,
      location_name: stock.location_name,
      on_hand_qty: stock.on_hand_qty,
      reserved_qty: stock.reserved_qty,
      available_qty: stock.available_qty,
      par: stock.par,
      is_below_par: stock.is_below_par,
      is_at_risk: stock.is_at_risk,
      created_at: '',
      updated_at: '',
    };
  };

  return (
    <div className="par-levels-summary">
      <h3>Par Levels by Location</h3>
      <div className="par-levels-list">
        {stockLevels.map((stock) => {
          const isEditing = editingId === stock.id;
          const status = stock.is_below_par ? 'critical' : stock.is_at_risk ? 'warning' : 'good';

          if (isEditing && canEdit) {
            return (
              <div key={stock.id} className="par-level-item editing">
                <ParLevelEditor
                  stockLevel={getStockLevelForEditor(stock)}
                  onUpdate={handleUpdate}
                  onCancel={handleCancel}
                />
              </div>
            );
          }

          return (
            <div key={stock.id} className={`par-level-item par-level-${status}`}>
              <div className="par-level-header">
                <span className="par-level-location">{stock.location_name}</span>
                {canEdit && (
                  <button
                    className="btn-edit-small"
                    onClick={() => handleEdit(stock.id)}
                    title="Edit par levels"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="par-level-details">
                <div className="par-level-row">
                  <span className="par-level-label">Par Level:</span>
                  <span className="par-level-value">
                    {stock.par || 0} {unitOfMeasure}
                  </span>
                </div>
                <div className="par-level-row">
                  <span className="par-level-label">On Hand:</span>
                  <span className="par-level-value">
                    {stock.on_hand_qty} {unitOfMeasure}
                  </span>
                </div>
                {stock.is_below_par && (
                  <div className="par-level-warning">
                    ⚠️ Below par level
                  </div>
                )}
                {stock.is_at_risk && !stock.is_below_par && (
                  <div className="par-level-warning warning">
                    ⚠️ At risk (approaching par level)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParLevelsSummary;

