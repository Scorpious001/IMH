import React, { useState, useEffect } from 'react';
import { itemsService } from '../../services/itemsService';
import { settingsService } from '../../services/settingsService';
import { useAuth } from '../../contexts/AuthContext';
import { Item } from '../../types/item.types';
import { Category } from '../../types/item.types';
import ViewSelector, { ViewMode } from '../../components/catalog/ViewSelector';
import CategoryView from '../../components/catalog/CategoryView';
import ListView from '../../components/catalog/ListView';
import TileView from '../../components/catalog/TileView';
import AddItemForm from '../../components/catalog/AddItemForm';
import CategoryForm from '../../components/settings/CategoryForm';
import CategoryParLevels from '../../components/catalog/CategoryParLevels';
import './CatalogPage.css';

const CatalogPage: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const canView = hasPermission('catalog', 'view');
  const canCreate = hasPermission('catalog', 'create');
  const canEdit = hasPermission('catalog', 'edit');
  const canDelete = hasPermission('catalog', 'delete');
  const [viewMode, setViewMode] = useState<ViewMode>('tile');
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBelowPar, setFilterBelowPar] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [showCategoryParLevels, setShowCategoryParLevels] = useState(false);

  useEffect(() => {
    if (canView) {
      loadItems();
      loadCategories();
    } else {
      setError('You do not have permission to view the catalog.');
      setLoading(false);
    }
  }, [filterBelowPar, selectedCategory, canView]);

  const loadItems = async () => {
    if (!canView) {
      setError('You do not have permission to view the catalog.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filterBelowPar) {
        params.below_par = true;
      }
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const data = await itemsService.getAll(params);
      setItems(data);
    } catch (error: any) {
      console.error('Error loading items:', error);
      if (error.response?.status === 403) {
        setError('You do not have permission to view the catalog. Please contact an administrator.');
      } else if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(error.response?.data?.error || error.response?.data?.detail || 'Failed to load items. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await settingsService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadItems();
  };

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setViewMode('tile');
  };

  const handleClearCategoryFilter = () => {
    setSelectedCategory(null);
  };

  const handleAddItem = async (itemData: {
    name: string;
    short_code: string;
    category?: number;
    unit_of_measure: string;
    cost?: number;
    lead_time_days: number;
    default_vendor?: number;
    photo_url?: string;
  }) => {
    try {
      await itemsService.create(itemData);
      setShowAddItemForm(false);
      loadItems();
      loadCategories();
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item');
    }
  };

  const handleAddCategory = async () => {
    setShowAddCategoryForm(false);
    loadCategories();
    loadItems();
  };

  // Show access denied if user doesn't have view permission
  if (!canView) {
    return (
      <div className="catalog-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to view the catalog.</p>
          <p>Required permission: <code>catalog.view</code></p>
          <p>Your current permissions: {user?.permissions?.join(', ') || 'None'}</p>
          <p>Please contact an administrator to request access.</p>
        </div>
      </div>
    );
  }

  if (loading && items.length === 0 && !error) {
    return <div className="page-loading">Loading...</div>;
  }

  // Filter items based on selected category if in tile/list view
  const displayItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  return (
    <div className="catalog-page">
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => loadItems()}>Retry</button>
        </div>
      )}
      <div className="catalog-header">
        <h1>Catalog</h1>
        <ViewSelector
          currentView={viewMode}
          onViewChange={setViewMode}
          onAddCategory={() => setShowAddCategoryForm(true)}
          onAddItem={() => setShowAddItemForm(true)}
          showAddCategory={viewMode === 'category' && canCreate}
          showAddItem={(viewMode === 'list' || viewMode === 'tile') && canCreate}
        />
      </div>

      {selectedCategory && viewMode !== 'category' && (
        <>
          <div className="category-filter-banner">
            <span>
              Showing items in category: {categories.find((c) => c.id === selectedCategory)?.name}
            </span>
            <div className="category-actions">
              {canEdit && (
                <button 
                  className="manage-par-levels-btn" 
                  onClick={() => setShowCategoryParLevels(!showCategoryParLevels)}
                >
                  {showCategoryParLevels ? 'Hide' : 'Manage'} Par Levels
                </button>
              )}
              <button className="clear-filter-btn" onClick={handleClearCategoryFilter}>
                Clear Filter
              </button>
            </div>
          </div>
          {showCategoryParLevels && canEdit && (
            <CategoryParLevels
              category={categories.find((c) => c.id === selectedCategory)!}
              onUpdate={() => {
                loadCategories();
                loadItems();
              }}
            />
          )}
        </>
      )}

      {(viewMode === 'list' || viewMode === 'tile') && (
        <div className="catalog-filters">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">Search</button>
          </form>

          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filterBelowPar}
              onChange={(e) => setFilterBelowPar(e.target.checked)}
            />
            Show only below par
          </label>
        </div>
      )}

      {viewMode === 'category' && (
        <CategoryView onCategorySelect={handleCategorySelect} />
      )}

      {viewMode === 'list' && <ListView items={displayItems} />}

      {viewMode === 'tile' && <TileView items={displayItems} />}

      {showAddItemForm && (
        <div className="modal-overlay" onClick={() => setShowAddItemForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <AddItemForm
              onSubmit={handleAddItem}
              onCancel={() => setShowAddItemForm(false)}
            />
          </div>
        </div>
      )}

      {showAddCategoryForm && (
        <div className="modal-overlay" onClick={() => setShowAddCategoryForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <CategoryForm
              category={null}
              categories={categories}
              onSubmit={handleAddCategory}
              onCancel={() => setShowAddCategoryForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
