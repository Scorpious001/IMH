import React from 'react';
import './ViewSelector.css';

export type ViewMode = 'category' | 'list' | 'tile';

interface ViewSelectorProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onAddCategory?: () => void;
  onAddItem?: () => void;
  showAddCategory?: boolean;
  showAddItem?: boolean;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({
  currentView,
  onViewChange,
  onAddCategory,
  onAddItem,
  showAddCategory = false,
  showAddItem = false,
}) => {
  return (
    <div className="view-selector">
      <div className="view-buttons">
        <button
          className={`view-button ${currentView === 'category' ? 'active' : ''}`}
          onClick={() => onViewChange('category')}
          title="Category View"
        >
          <span className="view-icon">📁</span>
          <span className="view-label">Category</span>
        </button>
        <button
          className={`view-button ${currentView === 'list' ? 'active' : ''}`}
          onClick={() => onViewChange('list')}
          title="List View"
        >
          <span className="view-icon">☰</span>
          <span className="view-label">List</span>
        </button>
        <button
          className={`view-button ${currentView === 'tile' ? 'active' : ''}`}
          onClick={() => onViewChange('tile')}
          title="Tile View"
        >
          <span className="view-icon">⊞</span>
          <span className="view-label">Tile</span>
        </button>
      </div>
      <div className="add-buttons">
        {showAddCategory && onAddCategory && (
          <button className="add-button add-category" onClick={onAddCategory} title="Add Category">
            <span className="add-icon">+</span>
            <span className="add-label">Add Category</span>
          </button>
        )}
        {showAddItem && onAddItem && (
          <button className="add-button add-item" onClick={onAddItem} title="Add Item">
            <span className="add-icon">+</span>
            <span className="add-label">Add Item</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ViewSelector;

