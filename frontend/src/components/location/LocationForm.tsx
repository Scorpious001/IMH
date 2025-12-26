import React, { useState, useEffect } from 'react';
import { locationsService } from '../../services/locationsService';
import { Location, LocationType } from '../../types/location.types';
import './LocationForm.css';

interface LocationFormProps {
  location?: Location | null;
  locations: Location[]; // All locations for parent selection
  onSubmit: (location: {
    name: string;
    type: LocationType;
    parent_location?: number;
    property_id?: string;
    floorplan_id?: string;
    coordinates?: string;
    is_active: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

const LocationForm: React.FC<LocationFormProps> = ({
  location,
  locations,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'STOREROOM' as LocationType,
    parent_location: 0,
    property_id: '',
    floorplan_id: '',
    coordinates: '',
    is_active: true,
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        type: location.type,
        parent_location: location.parent_location || 0,
        property_id: location.property_id || '',
        floorplan_id: location.floorplan_id || '',
        coordinates: location.coordinates || '',
        is_active: location.is_active,
      });
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter a location name');
      return;
    }

    await onSubmit({
      name: formData.name,
      type: formData.type,
      parent_location: formData.parent_location || undefined,
      property_id: formData.property_id || undefined,
      floorplan_id: formData.floorplan_id || undefined,
      coordinates: formData.coordinates || undefined,
      is_active: formData.is_active,
    });
  };

  // Filter out the current location and its descendants from parent options
  const availableParents = location
    ? locations.filter((loc) => loc.id !== location.id && loc.parent_location !== location.id)
    : locations;

  return (
    <form className="location-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Type *</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as LocationType })}
          required
        >
          <option value="STOREROOM">Storeroom</option>
          <option value="CLOSET">Closet</option>
          <option value="CART">Cart</option>
          <option value="ROOM">Room</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Parent Location</label>
        <select
          value={formData.parent_location}
          onChange={(e) => setFormData({ ...formData, parent_location: Number(e.target.value) })}
        >
          <option value={0}>None (Top Level)</option>
          {availableParents.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} ({loc.type})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Property ID</label>
        <input
          type="text"
          value={formData.property_id}
          onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
          placeholder="Optional property identifier"
        />
      </div>

      <div className="form-group">
        <label>Floorplan ID</label>
        <input
          type="text"
          value={formData.floorplan_id}
          onChange={(e) => setFormData({ ...formData, floorplan_id: e.target.value })}
          placeholder="Optional floorplan link"
        />
      </div>

      <div className="form-group">
        <label>Coordinates</label>
        <input
          type="text"
          value={formData.coordinates}
          onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
          placeholder="Optional coordinates on floor plan"
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          Active
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {location ? 'Update' : 'Create'} Location
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default LocationForm;

