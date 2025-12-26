import React from 'react';
import './CategoryTile.css';

interface CategoryTileProps {
  category: {
    id: number;
    name: string;
    icon?: string;
  };
  totalItems: number;
  lowCountItems: number;
  onClick: () => void;
}

const CategoryTile: React.FC<CategoryTileProps> = ({
  category,
  totalItems,
  lowCountItems,
  onClick,
}) => {
  return (
    <div className="category-tile" onClick={onClick}>
      <div className="category-header">
        {category.icon && <span className="category-icon">{category.icon}</span>}
        <h3 className="category-name">{category.name}</h3>
      </div>
      <div className="category-stats">
        <div className="stat-item">
          <span className="stat-label">Total Items:</span>
          <span className="stat-value">{totalItems}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Low Count:</span>
          <span className={`stat-value ${lowCountItems > 0 ? 'low-count-warning' : ''}`}>
            {lowCountItems}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CategoryTile;

