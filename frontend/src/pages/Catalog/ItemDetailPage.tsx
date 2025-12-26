import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsService } from '../../services/itemsService';
import { transactionsService } from '../../services/transactionsService';
import { Item, StockByLocationData, StockByLocationItem } from '../../types/item.types';
import { InventoryTransaction } from '../../types/stock.types';
import StatusIndicator from '../../components/shared/StatusIndicator';
import PhotoUpload from '../../components/shared/PhotoUpload';
import StockLevelsList from '../../components/item/StockLevelsList';
import UsageChart from '../../components/item/UsageChart';
import TransactionHistory from '../../components/item/TransactionHistory';
import StockActions from '../../components/item/StockActions';
import EditItemForm from '../../components/item/EditItemForm';
import ParLevelsSummary from '../../components/item/ParLevelsSummary';
import './ItemDetailPage.css';

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [stockData, setStockData] = useState<StockByLocationData | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<string>('info');

  useEffect(() => {
    if (id) {
      loadItemData();
    }
  }, [id]);

  const loadItemData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      // Load item first - this is the most critical
      let itemData: Item;
      try {
        itemData = await itemsService.getById(Number(id));
        setItem(itemData);
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Item not found';
        setError(`Failed to load item: ${errorMsg}`);
        console.error('Error loading item:', err);
        return;
      }

      // Load stock and transactions in parallel - these are less critical
      try {
        const [stockDataRes, transactionsData] = await Promise.allSettled([
          itemsService.getStockByLocation(Number(id)),
          transactionsService.getByItem(Number(id), 50),
        ]);

        if (stockDataRes.status === 'fulfilled') {
          const stockData = stockDataRes.value;
          // Ensure stock_by_location is always an array
          if (!stockData.stock_by_location) {
            stockData.stock_by_location = [];
          }
          setStockData(stockData);
        } else {
          console.error('Error loading stock data:', stockDataRes.reason);
          // Set empty stock data instead of failing completely
          setStockData({ item_id: Number(id), item_name: itemData.name, property_on_hand: 0, stock_by_location: [] });
        }

        if (transactionsData.status === 'fulfilled') {
          setTransactions(transactionsData.value);
        } else {
          console.error('Error loading transactions:', transactionsData.reason);
          // Set empty transactions instead of failing completely
          setTransactions([]);
        }
      } catch (err: any) {
        console.error('Error loading additional data:', err);
        // Set defaults so the page can still render
        setStockData({ item_id: Number(id), item_name: itemData.name, property_on_hand: 0, stock_by_location: [] });
        setTransactions([]);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to load item details';
      setError(errorMsg);
      console.error('Error loading item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockActionComplete = () => {
    loadItemData();
  };

  const handleItemUpdate = (updatedItem: Item) => {
    setItem(updatedItem);
  };

  const handlePhotoUpload = async (file: File) => {
    // For now, we'll just update the photo_url with a placeholder
    // In a real app, you'd upload to a file service and get a URL
    // For now, we'll use a data URL or external service
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        // Update item with photo URL (using data URL for now)
        const photoUrl = reader.result as string;
        const updatedItem = await itemsService.update(item!.id, {
          photo_url: photoUrl,
        });
        setItem(updatedItem);
      } catch (err) {
        console.error('Error updating photo:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = async () => {
    try {
      const updatedItem = await itemsService.update(item!.id, {
        photo_url: '',
      });
      setItem(updatedItem);
    } catch (err) {
      console.error('Error removing photo:', err);
    }
  };

  if (loading) {
    return (
      <div className="item-detail-page">
        <div className="page-loading">Loading item details...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="item-detail-page">
        <div className="page-error">
          <p>{error || 'Item not found'}</p>
          <button onClick={() => navigate('/catalog')} className="back-button">
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  const getStatus = (): 'good' | 'warning' | 'critical' => {
    if (item.is_below_par_anywhere) return 'critical';
    return 'good';
  };

  const stockLevels: StockByLocationItem[] = stockData?.stock_by_location || [];

  return (
    <div className="item-detail-page">
      <div className="item-detail-header">
        <button onClick={() => navigate('/catalog')} className="back-button">
          ← Back to Catalog
        </button>
        <div className="item-header-info">
          <h1>{item.name}</h1>
          <div className="item-header-meta">
            <span className="item-code">Code: {item.short_code}</span>
            <StatusIndicator status={getStatus()} />
          </div>
        </div>
      </div>

      <div className="item-detail-sections">
        <div className="section-tabs">
          <button
            className={`tab ${activeSection === 'info' ? 'active' : ''}`}
            onClick={() => setActiveSection('info')}
          >
            Info
          </button>
          <button
            className={`tab ${activeSection === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveSection('stock')}
          >
            Stock
          </button>
          <button
            className={`tab ${activeSection === 'usage' ? 'active' : ''}`}
            onClick={() => setActiveSection('usage')}
          >
            Usage
          </button>
          <button
            className={`tab ${activeSection === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveSection('transactions')}
          >
            Transactions
          </button>
          <button
            className={`tab ${activeSection === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveSection('actions')}
          >
            Actions
          </button>
          <button
            className={`tab ${activeSection === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveSection('locations')}
          >
            Locations
          </button>
        </div>

        <div className="section-content">
          {activeSection === 'info' && (
            <div className="detail-section">
              <h2>Item Information</h2>
              <div className="item-photo-section">
                <PhotoUpload
                  currentUrl={item.photo_url}
                  onUpload={handlePhotoUpload}
                  onRemove={handlePhotoRemove}
                />
              </div>
              <div className="item-info-grid">
                <div className="info-item">
                  <span className="info-label">Category:</span>
                  <span className="info-value">{item.category_name || 'None'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Vendor:</span>
                  <span className="info-value">{item.default_vendor_name || 'None'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Cost:</span>
                  <span className="info-value">
                    {item.cost != null ? `$${Number(item.cost).toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Unit of Measure:</span>
                  <span className="info-value">{item.unit_of_measure}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Lead Time:</span>
                  <span className="info-value">{item.lead_time_days} days</span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    On Hand {item.property_id ? `(Property: ${item.property_id})` : '(Property)'}:
                    <span className="info-help-text"> (Sum of quantities across all locations)</span>
                  </span>
                  <span className="info-value">
                    {item.property_on_hand || 0} {item.unit_of_measure}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value">
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created:</span>
                  <span className="info-value">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ParLevelsSummary 
                stockLevels={stockLevels.map(s => ({ 
                  ...s, 
                  item: s.item || s.item_id || item.id,
                  item_id: s.item_id || s.item || item.id,
                  location_id: s.location_id || s.location
                }))}
                unitOfMeasure={item.unit_of_measure}
                onUpdate={loadItemData}
              />
              <div className="edit-section">
                <EditItemForm item={item} onUpdate={handleItemUpdate} />
              </div>
            </div>
          )}

          {activeSection === 'stock' && (
            <div className="detail-section">
              <h2>Stock Levels by Location</h2>
              {stockData && (
                <div className="stock-summary">
                  <p>
                    <strong>On Hand {stockData.property_id ? `(Property: ${stockData.property_id})` : '(Property)'}:</strong> {stockData.property_on_hand || 0}{' '}
                    {item.unit_of_measure}
                    <span className="info-help-text"> (Sum of quantities across all locations)</span>
                  </p>
                  <p>
                    <strong>Locations with Stock:</strong> {stockLevels.length}
                  </p>
                </div>
              )}
              <StockLevelsList 
                stockLevels={stockLevels.map(s => ({ ...s, item_id: item.id, item_name: item.name, item_short_code: item.short_code, location_id: s.location }))} 
                loading={false} 
                editable={true}
                onParLevelUpdate={loadItemData}
              />
            </div>
          )}

          {activeSection === 'usage' && (
            <div className="detail-section">
              <h2>Usage History</h2>
              <UsageChart itemId={item.id} />
            </div>
          )}

          {activeSection === 'transactions' && (
            <div className="detail-section">
              <h2>Recent Transactions</h2>
              <TransactionHistory transactions={transactions} loading={false} />
            </div>
          )}

          {activeSection === 'actions' && (
            <div className="detail-section">
              <h2>Stock Actions</h2>
              <StockActions itemId={item.id} onActionComplete={handleStockActionComplete} />
            </div>
          )}

          {activeSection === 'locations' && (
            <div className="detail-section">
              <h2>Stock by Location</h2>
              {stockData && (
                <div className="stock-summary">
                  <p>
                    <strong>On Hand {stockData.property_id ? `(Property: ${stockData.property_id})` : '(Property)'}:</strong> {stockData.property_on_hand || 0}{' '}
                    {item.unit_of_measure}
                    <span className="info-help-text"> (Sum of quantities across all locations)</span>
                  </p>
                  <p>
                    <strong>Locations with Stock:</strong> {stockLevels.length}
                  </p>
                </div>
              )}
              <StockLevelsList 
                stockLevels={stockLevels.map(s => ({ ...s, item_id: item.id, item_name: item.name, item_short_code: item.short_code, location_id: s.location }))} 
                loading={false} 
                editable={true}
                onParLevelUpdate={loadItemData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;

