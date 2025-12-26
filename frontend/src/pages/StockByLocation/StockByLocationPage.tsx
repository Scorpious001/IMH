import React, { useState, useEffect } from 'react';
import { locationsService } from '../../services/locationsService';
import { useAuth } from '../../contexts/AuthContext';
import { Location, LocationType } from '../../types/location.types';
import LocationForm from '../../components/location/LocationForm';
import './StockByLocationPage.css';

const StockByLocationPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('stock', 'create');
  const canEdit = hasPermission('stock', 'edit');
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await locationsService.getTree();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (locationData: {
    name: string;
    type: LocationType;
    parent_location?: number;
    property_id?: string;
    floorplan_id?: string;
    coordinates?: string;
    is_active: boolean;
  }) => {
    try {
      await locationsService.create(locationData);
      setShowAddLocationForm(false);
      loadLocations();
    } catch (error: any) {
      console.error('Error creating location:', error);
      alert(error.response?.data?.error || 'Failed to create location');
    }
  };

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  // Flatten locations for parent selection in form
  const flattenLocations = (locList: Location[]): Location[] => {
    const result: Location[] = [];
    locList.forEach((loc) => {
      result.push(loc);
      if (loc.child_locations && loc.child_locations.length > 0) {
        result.push(...flattenLocations(loc.child_locations));
      }
    });
    return result;
  };

  const allLocations = flattenLocations(locations);

  return (
    <div className="stock-by-location-page">
      <div className="page-header">
        <h1>Stock by Location</h1>
        {canCreate && (
          <button className="btn-primary" onClick={() => setShowAddLocationForm(true)}>
            Add Location
          </button>
        )}
      </div>
      
      <div className="location-view">
        <div className="location-tree">
          <h2>Locations</h2>
          {locations.length === 0 ? (
            <p>No locations found</p>
          ) : (
            <LocationTree
              locations={locations}
              selectedId={selectedLocation?.id}
              onSelect={(location) => setSelectedLocation(location)}
            />
          )}
        </div>
        
        {selectedLocation && (
          <div className="location-stock">
            <h2>{selectedLocation.name}</h2>
            <LocationStockList locationId={selectedLocation.id} />
          </div>
        )}
      </div>

      {showAddLocationForm && (
        <div className="modal-overlay" onClick={() => setShowAddLocationForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Location</h2>
            <LocationForm
              location={null}
              locations={allLocations}
              onSubmit={handleAddLocation}
              onCancel={() => setShowAddLocationForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface LocationTreeProps {
  locations: Location[];
  selectedId?: number;
  onSelect: (location: Location) => void;
}

const LocationTree: React.FC<LocationTreeProps> = ({ locations, selectedId, onSelect }) => {
  return (
    <ul className="location-tree-list">
      {locations.map((location) => (
        <li key={location.id}>
          <button
            className={`location-tree-item ${selectedId === location.id ? 'selected' : ''}`}
            onClick={() => onSelect(location)}
          >
            {location.name} ({location.type})
          </button>
          {location.child_locations && location.child_locations.length > 0 && (
            <LocationTree
              locations={location.child_locations}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
        </li>
      ))}
    </ul>
  );
};

interface LocationStockListProps {
  locationId: number;
}

const LocationStockList: React.FC<LocationStockListProps> = ({ locationId }) => {
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStock();
  }, [locationId]);

  const loadStock = async () => {
    try {
      setLoading(true);
      const data = await locationsService.getStock(locationId);
      setStock(data);
    } catch (error) {
      console.error('Error loading stock:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading stock...</div>;
  }

  return (
    <div>
      <p>Total items: {stock?.total_items || 0}</p>
      <p>Below par: {stock?.below_par_count || 0}</p>
      {/* TODO: Display stock list */}
    </div>
  );
};

export default StockByLocationPage;

