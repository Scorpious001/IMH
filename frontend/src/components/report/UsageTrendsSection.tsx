import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { itemsService } from '../../services/itemsService';
import { Item } from '../../types/item.types';
import { UsageData } from '../../types/item.types';
import './UsageTrendsSection.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const UsageTrendsSection: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (itemSearchTerm) {
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
          item.short_code.toLowerCase().includes(itemSearchTerm.toLowerCase())
      );
      setFilteredItems(filtered.slice(0, 10));
    } else {
      setFilteredItems([]);
    }
  }, [itemSearchTerm, items]);

  useEffect(() => {
    if (selectedItemId) {
      loadUsageTrend();
    }
  }, [selectedItemId, days]);

  const loadItems = async () => {
    try {
      const data = await itemsService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const loadUsageTrend = async () => {
    if (!selectedItemId) return;
    try {
      setLoading(true);
      const data = await itemsService.getUsage(selectedItemId, days);
      setUsageData(data);
    } catch (error) {
      console.error('Error loading usage trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <div className="usage-trends-section">
      <div className="section-header">
        <h2>Usage Trends</h2>
      </div>

      <div className="trends-controls">
        <div className="control-group">
          <label>Select Item:</label>
          <div className="item-selector">
            <input
              type="text"
              placeholder="Search item..."
              value={
                selectedItemId && selectedItem
                  ? `${selectedItem.name} (${selectedItem.short_code})`
                  : itemSearchTerm
              }
              onChange={(e) => {
                setItemSearchTerm(e.target.value);
                if (!e.target.value) {
                  setSelectedItemId(null);
                  setUsageData(null);
                }
              }}
              onFocus={() => {
                if (selectedItemId && selectedItem) {
                  setItemSearchTerm(selectedItem.name);
                }
              }}
            />
            {filteredItems.length > 0 && (
              <div className="item-dropdown">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="item-option"
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setItemSearchTerm('');
                      setFilteredItems([]);
                    }}
                  >
                    {item.photo_url && (
                      <img src={item.photo_url} alt={item.name} className="item-option-photo" />
                    )}
                    <div className="item-option-details">
                      <div className="item-option-name">{item.name}</div>
                      <div className="item-option-code">{item.short_code}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="control-group">
          <label>Period:</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="trends-loading">Loading usage trends...</div>
      )}

      {usageData && !loading && (
        <div className="trends-content">
          <div className="trends-summary">
            {usageData.usage_by_day && usageData.usage_by_day.length > 0 && (
              <>
                <div className="summary-item">
                  <span className="summary-label">Total Usage:</span>
                  <span className="summary-value">
                    {usageData.usage_by_day
                      .reduce((sum, day) => sum + (Number(day.total_qty) || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Average Daily:</span>
                  <span className="summary-value">
                    {(
                      usageData.usage_by_day.reduce(
                        (sum, day) => sum + (Number(day.total_qty) || 0),
                        0
                      ) / usageData.usage_by_day.length
                    ).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
          {usageData.usage_by_day && usageData.usage_by_day.length > 0 && (
            <div className="trends-chart">
              <div className="chart-container">
                <Line
                  data={{
                    labels: usageData.usage_by_day.map((entry) => {
                      const date = new Date(entry.day);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }),
                    datasets: [
                      {
                        label: 'Daily Usage',
                        data: usageData.usage_by_day.map((entry) =>
                          Number(entry.total_qty) || 0
                        ),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.1,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: `Usage History (${days} days)`,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Quantity',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedItemId && !loading && (
        <div className="trends-placeholder">
          <p>Select an item to view usage trends</p>
        </div>
      )}
    </div>
  );
};

export default UsageTrendsSection;

