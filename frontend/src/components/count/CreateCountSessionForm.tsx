import React, { useState, useEffect } from 'react';
import { locationsService } from '../../services/locationsService';
import { Location } from '../../types/location.types';
import './CreateCountSessionForm.css';

interface CreateCountSessionFormProps {
  onSubmit: (data: { location_id: number; notes?: string }) => Promise<void>;
  onCancel: () => void;
}

const CreateCountSessionForm: React.FC<CreateCountSessionFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    location_id: 0,
    notes: '',
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await locationsService.getAll();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location_id) {
      alert('Please select a location');
      return;
    }
    await onSubmit({
      location_id: formData.location_id,
      notes: formData.notes || undefined,
    });
  };

  if (loading) {
    return <div className="form-loading">Loading locations...</div>;
  }

  return (
    <div className="create-count-session-form">
      <h2>Start Count Session</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Location *</label>
          <select
            value={formData.location_id}
            onChange={(e) => setFormData({ ...formData, location_id: Number(e.target.value) })}
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
          <label>Notes (optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Additional notes for this count session..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Start Count
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCountSessionForm;

