import React, { useState, useEffect } from 'react';
import { Category } from '../../types/item.types';
import { settingsService } from '../../services/settingsService';
import QuantityStepper from '../shared/QuantityStepper';
import './CategoryParLevels.css';

interface CategoryParLevelsProps {
  category: Category;
  onUpdate?: () => void;
}

const CategoryParLevels: React.FC<CategoryParLevelsProps> = ({ category, onUpdate }) => {
  const [parMin, setParMin] = useState<number>(category.par_min || 0);
  const [parMax, setParMax] = useState<number>(category.par_max || 0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bulkResult, setBulkResult] = useState<any>(null);

  useEffect(() => {
    setParMin(category.par_min || 0);
    setParMax(category.par_max || 0);
  }, [category]);

  const handleSave = async () => {
    if (parMax < parMin) {
      setError('Par Max must be greater than or equal to Par Min');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await settingsService.updateCategoryParLevels(category.id, parMin, parMax);
      setSuccess('Category par levels saved successfully!');
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      console.error('Error saving category par levels:', err);
      setError(err.response?.data?.error || 'Failed to save category par levels');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkApply = async () => {
    if (!parMin && !parMax) {
      setError('Please set par levels before applying to items');
      return;
    }

    if (!window.confirm(
      `This will apply par levels (Min: ${parMin}, Max: ${parMax}) to all items in the "${category.name}" category across all locations. Continue?`
    )) {
      return;
    }

    setApplying(true);
    setError('');
    setSuccess('');
    setBulkResult(null);

    try {
      const result = await settingsService.bulkApplyCategoryParLevels(category.id);
      setBulkResult(result);
      setSuccess(`Successfully applied par levels to ${result.items_updated || result.updated_count || 0} item-location combinations`);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      console.error('Error applying category par levels:', err);
      setError(err.response?.data?.error || 'Failed to apply category par levels');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="category-par-levels">
      <h3>Category Par Levels</h3>
      <p className="description">
        Set default par levels for all items in this category. These can be applied to existing items using the bulk apply button.
      </p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="par-level-fields">
        <div className="field-group">
          <label>Par Min</label>
          <QuantityStepper
            value={parMin}
            onChange={setParMin}
            min={0}
            step={0.01}
          />
        </div>
        <div className="field-group">
          <label>Par Max</label>
          <QuantityStepper
            value={parMax}
            onChange={setParMax}
            min={parMin}
            step={0.01}
          />
        </div>
      </div>

      <div className="actions">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || applying}
        >
          {saving ? 'Saving...' : 'Save Par Levels'}
        </button>
        <button
          className="btn-secondary"
          onClick={handleBulkApply}
          disabled={saving || applying || (!parMin && !parMax)}
        >
          {applying ? 'Applying...' : 'Bulk Apply to All Items'}
        </button>
      </div>

      {bulkResult && (
        <div className="bulk-result">
          <h4>Bulk Apply Results</h4>
          <p>Items Updated: {bulkResult.items_updated || bulkResult.updated_count || 0}</p>
          {bulkResult.error_count > 0 && (
            <p className="error-text">Errors: {bulkResult.error_count}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryParLevels;

