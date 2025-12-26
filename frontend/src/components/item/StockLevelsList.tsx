import React, { useState } from 'react';
import { StockByLocationItem } from '../../types/item.types';
import { StockLevel } from '../../types/stock.types';
import StatusIndicator from '../shared/StatusIndicator';
import ParLevelEditor from './ParLevelEditor';
import './StockLevelsList.css';

interface StockLevelsListProps {
  stockLevels: StockByLocationItem[];
  loading?: boolean;
  onParLevelUpdate?: () => void;
  editable?: boolean;
}

const StockLevelsList: React.FC<StockLevelsListProps> = ({ 
  stockLevels, 
  loading, 
  onParLevelUpdate,
  editable = false 
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);

  if (loading) {
    return <div className="stock-levels-loading">Loading stock levels...</div>;
  }

  if (stockLevels.length === 0) {
    return <div className="stock-levels-empty">No stock levels found for this item</div>;
  }

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleUpdate = () => {
    setEditingId(null);
    if (onParLevelUpdate) {
      onParLevelUpdate();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const getStockLevelForEditor = (stock: StockByLocationItem): StockLevel => {
    return {
      id: stock.id,
      item: stock.item_id || 0,
      item_name: stock.item_name || '',
      item_short_code: stock.item_short_code || '',
      location: stock.location_id || 0,
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
    <div className="stock-levels-list">
      <table className="stock-levels-table">
        <thead>
          <tr>
            <th>Location</th>
            <th>On Hand</th>
            <th>Reserved</th>
            <th>Available</th>
            <th>Par Level</th>
            <th>Status</th>
            {editable && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {stockLevels.map((stock) => {
            const status = stock.is_below_par ? 'critical' : stock.is_at_risk ? 'warning' : 'good';
            const isEditing = editingId === stock.id;

            if (isEditing && editable) {
              return (
                <tr key={stock.id} className="stock-level-row editing">
                  <td colSpan={editable ? 7 : 6}>
                    <ParLevelEditor
                      stockLevel={getStockLevelForEditor(stock)}
                      onUpdate={handleUpdate}
                      onCancel={handleCancel}
                    />
                  </td>
                </tr>
              );
            }

            return (
              <tr key={stock.id} className={`stock-level-row stock-level-${status}`}>
                <td>{stock.location_name}</td>
                <td>{stock.on_hand_qty}</td>
                <td>{stock.reserved_qty}</td>
                <td>{stock.available_qty}</td>
                <td>{stock.par}</td>
                <td>
                  <StatusIndicator status={status} />
                </td>
                {editable && (
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(stock.id)}
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockLevelsList;

