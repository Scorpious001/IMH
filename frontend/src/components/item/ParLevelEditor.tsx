import React, { useState } from 'react';
import { StockLevel } from '../../types/stock.types';
import QuantityStepper from '../shared/QuantityStepper';
import { settingsService } from '../../services/settingsService';
import './ParLevelEditor.css';

interface ParLevelEditorProps {
  stockLevel: StockLevel;
  onUpdate: () => void;
  onCancel?: () => void;
}

const ParLevelEditor: React.FC<ParLevelEditorProps> = ({ stockLevel, onUpdate, onCancel }) => {
  const [par, setPar] = useState(stockLevel.par);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!stockLevel.item || !stockLevel.location) {
        setError('Item ID and Location ID are required');
        setLoading(false);
        return;
      }

      const updateData = {
        item_id: stockLevel.item,
        location_id: stockLevel.location,
        par: par,
      };

      console.log('Updating par levels with data:', updateData);

      const response = await settingsService.updateParLevels([updateData]);
      
      // Check for errors in the response (even if HTTP status was 200/207)
      if (response && (response.error_count > 0 || (response.errors && response.errors.length > 0))) {
        const errorMsg = response.errors?.[0]?.error || 'Failed to update par levels';
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      // Success - refresh data
      onUpdate();
    } catch (err: any) {
      console.error('Error updating par levels:', err);
      console.error('Error response data:', err.response?.data);
      const errorMsg = err.response?.data?.error || 
                       err.response?.data?.detail || 
                       err.response?.data?.message ||
                       err.message || 
                       'Failed to update par levels';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="par-level-editor">
      {error && <div className="error-message">{error}</div>}
      <div className="editor-fields">
        <div className="editor-field">
          <label>Par Level</label>
          <QuantityStepper
            value={par}
            onChange={setPar}
            min={0}
            step={0.01}
          />
        </div>
      </div>
      <div className="editor-actions">
        <button
          className="btn-primary btn-small"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        {onCancel && (
          <button
            className="btn-secondary btn-small"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default ParLevelEditor;

