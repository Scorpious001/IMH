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
  const { hasPermission, user, isLoading } = useAuth();
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
    // Wait for auth to finish loading before checking permissions
    if (isLoading) {
      return;
    }
    
    // If user is authenticated, try to load items - let the backend handle permission checks
    // This is more reliable than frontend permission checks
    if (user && user.id) {
      loadItems();
      loadCategories();
    } else if (!user && !isLoading) {
      // Only show error if we're sure user isn't logged in
      setError('Please log in to view the catalog.');
      setLoading(false);
    }
  }, [filterBelowPar, selectedCategory, canView, isLoading, user]);

  const loadItems = async () => {
    // Don't check permissions here - let the backend API handle it
    // If the user doesn't have permission, the API will return 403 and we'll show the error

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
      console.log('📋 CatalogPage: Items loaded:', data.length, 'items');
      console.log('📋 CatalogPage: First few items:', data.slice(0, 3));
      console.log('📋 CatalogPage: All items:', data);
      
      if (data.length === 0) {
        console.warn('📋 CatalogPage: No items returned from API. This could mean:');
        console.warn('  1. No items exist in the database (run seed data)');
        console.warn('  2. User does not have permission to view items');
        console.warn('  3. Filters are too restrictive');
        console.warn('  4. API returned empty results');
      }
      
      setItems(data);
      // Clear any previous errors on success
      setError(null);
    } catch (error: any) {
      console.error('Error loading items:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      if (error.response?.status === 403) {
        setError('You do not have permission to view the catalog. Please contact an administrator. (Error 403 from API)');
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

  // REMOVED: Frontend permission check - let the backend API handle permissions
  // This way authenticated users can try to load items, and the backend will enforce permissions

  if (loading && items.length === 0 && !error) {
    return <div className="page-loading">Loading...</div>;
  }

  // Filter items based on selected category if in tile/list view
  let displayItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;
  
  // Apply search filter if search term exists
  if (searchTerm && searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    displayItems = displayItems.filter((item) => 
      item.name.toLowerCase().includes(searchLower) ||
      item.short_code.toLowerCase().includes(searchLower)
    );
  }
  
  // Debug logging
  console.log('CatalogPage render:', {
    totalItems: items.length,
    displayItemsCount: displayItems.length,
    selectedCategory,
    searchTerm,
    viewMode,
    loading,
    hasError: !!error
  });

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

      {viewMode === 'list' && (
        displayItems.length > 0 ? (
          <ListView items={displayItems} />
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No items found</p>
            {items.length === 0 && !loading && !error && (
              <p>Items are loading or there are no items in the catalog.</p>
            )}
            {items.length > 0 && displayItems.length === 0 && (
              <>
                <p>No items match your current filters.</p>
                {(searchTerm || selectedCategory) && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory(null);
                    }}
                    style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
                  >
                    Clear Filters
                  </button>
                )}
              </>
            )}
          </div>
        )
      )}

      {viewMode === 'tile' && (
        displayItems.length > 0 ? (
          <TileView items={displayItems} />
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No items found</p>
            {items.length === 0 && !loading && !error && (
              <p>Items are loading or there are no items in the catalog.</p>
            )}
            {items.length > 0 && displayItems.length === 0 && (
              <>
                <p>No items match your current filters.</p>
                {(searchTerm || selectedCategory) && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory(null);
                    }}
                    style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
                  >
                    Clear Filters
                  </button>
                )}
              </>
            )}
          </div>
        )
      )}

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
