import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { DashboardStats, TopItemUsed, OverallInventoryUsage } from '../../types/dashboard.types';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadStats();
  }, [days]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats(days);
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-page">
        <div className="error">Failed to load dashboard stats</div>
      </div>
    );
  }

  const { top_5_items_used, overall_inventory_usage } = stats;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="period-selector">
          <label>Period:</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {/* Top 5 Items Used */}
      <section className="dashboard-section">
        <h2>Top 5 Items Used</h2>
        {top_5_items_used.length > 0 ? (
          <div className="top-items-list">
            {top_5_items_used.map((item, index) => (
              <div key={item.item_id} className="top-item-card">
                <div className="item-rank">#{index + 1}</div>
                <div className="item-info">
                  <div className="item-name">{item.item_name}</div>
                  <div className="item-code">{item.item_short_code}</div>
                </div>
                <div className="item-stats">
                  <div className="stat-value">
                    {item.total_qty_used.toLocaleString()} {item.unit_of_measure}
                  </div>
                  <div className="stat-label">{item.transaction_count} transactions</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No items used in this period</div>
        )}
      </section>

      {/* Overall Inventory Usage */}
      <section className="dashboard-section">
        <h2>Overall Inventory Usage</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">
              {overall_inventory_usage.total_qty_used.toLocaleString()}
            </div>
            <div className="stat-label">Total Quantity Used</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{overall_inventory_usage.unique_items_used}</div>
            <div className="stat-label">Unique Items Used</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{overall_inventory_usage.total_transactions}</div>
            <div className="stat-label">Total Transactions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {overall_inventory_usage.avg_qty_per_transaction.toFixed(2)}
            </div>
            <div className="stat-label">Avg Qty per Transaction</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              ${overall_inventory_usage.current_inventory_value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="stat-label">Current Inventory Value</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{overall_inventory_usage.total_items_in_stock}</div>
            <div className="stat-label">Items in Stock</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{overall_inventory_usage.items_below_par}</div>
            <div className="stat-label">Items Below Par</div>
          </div>
        </div>
      </section>

      {stats.department_filter && (
        <div className="department-filter-info">
          Showing data for: <strong>{stats.department_filter}</strong>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
