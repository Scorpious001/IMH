import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Item } from '../../types/item.types';
import MobileTile from '../shared/MobileTile';
import StatusIndicator from '../shared/StatusIndicator';
import './TileView.css';

interface TileViewProps {
  items: Item[];
}

const TileView: React.FC<TileViewProps> = ({ items }) => {
  const navigate = useNavigate();

  const getStatus = (item: Item): 'good' | 'warning' | 'critical' => {
    if (item.is_below_par_anywhere) return 'critical';
    return 'good';
  };

  if (items.length === 0) {
    return <div className="tile-view-empty">No items found</div>;
  }

  return (
    <div className="tile-view">
      <div className="catalog-grid">
        {items.map((item) => (
          <MobileTile
            key={item.id}
            title={item.name}
            subtitle={`Code: ${item.short_code} | On Hand: ${item.property_on_hand || 0} ${item.unit_of_measure}`}
            imageUrl={item.photo_url}
            status={getStatus(item)}
            onClick={() => {
              navigate(`/catalog/${item.id}`);
            }}
          >
            <StatusIndicator status={getStatus(item)} />
          </MobileTile>
        ))}
      </div>
    </div>
  );
};

export default TileView;

