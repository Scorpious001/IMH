import React, { useState, useEffect } from 'react';
import { reportsService } from '../../services/reportsService';
import { Alert, BelowParAlert, AtRiskAlert } from '../../types/report.types';
import AlertCard from './AlertCard';
import './AlertsSection.css';

const AlertsSection: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'below_par' | 'at_risk'>('below_par');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getAlerts();
      
      // Transform the data to match the expected structure
      // Backend returns StockLevel objects with 'item' (ID) and 'location' (ID) fields
      // Frontend expects 'item_id' and 'location_id'
      const transformedData: Alert = {
        below_par: (data.below_par || []).map((stockLevel: any) => ({
          item_id: Number(stockLevel.item) || 0,
          item_name: stockLevel.item_name || 'Unknown Item',
          item_short_code: stockLevel.item_short_code || '',
          location_id: Number(stockLevel.location) || 0,
          location_name: stockLevel.location_name || 'Unknown Location',
          on_hand_qty: Number(stockLevel.on_hand_qty) || 0,
          par: Number(stockLevel.par) || 0,
          stock_level: stockLevel,
        })),
        at_risk: (data.at_risk || []).map((stockLevel: any) => ({
          item_id: Number(stockLevel.item) || 0,
          item_name: stockLevel.item_name || 'Unknown Item',
          item_short_code: stockLevel.item_short_code || '',
          location_id: Number(stockLevel.location) || 0,
          location_name: stockLevel.location_name || 'Unknown Location',
          on_hand_qty: Number(stockLevel.on_hand_qty) || 0,
          par: Number(stockLevel.par) || 0,
          stock_level: stockLevel,
        })),
        below_par_count: Number(data.below_par_count) || 0,
        at_risk_count: Number(data.at_risk_count) || 0,
      };
      
      setAlerts(transformedData);
    } catch (error: any) {
      console.error('Error loading alerts:', error);
      // Set empty alerts structure on error so UI can still render
      setAlerts({
        below_par: [],
        at_risk: [],
        below_par_count: 0,
        at_risk_count: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="alerts-loading">Loading alerts...</div>;
  }

  if (!alerts) {
    return (
      <div className="alerts-error">
        <p>Failed to load alerts</p>
        <button className="btn-retry" onClick={loadAlerts}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="alerts-section">
      <div className="section-header">
        <h2>Alerts</h2>
        <div className="alert-tabs">
          <button
            className={`tab-button ${activeTab === 'below_par' ? 'active' : ''}`}
            onClick={() => setActiveTab('below_par')}
          >
            Below Par ({alerts.below_par_count})
          </button>
          <button
            className={`tab-button ${activeTab === 'at_risk' ? 'active' : ''}`}
            onClick={() => setActiveTab('at_risk')}
          >
            At Risk ({alerts.at_risk_count})
          </button>
        </div>
      </div>

      <div className="alerts-content">
        {activeTab === 'below_par' && (
          <div className="alerts-list">
            {alerts.below_par.length === 0 ? (
              <div className="empty-alerts">
                <p>No items below par level</p>
                <p className="empty-alerts-hint">
                  Items will appear here when their on-hand quantity is below the par level.
                  Make sure items have par levels set in their stock level settings.
                </p>
              </div>
            ) : (
              alerts.below_par.map((alert, index) => (
                <AlertCard key={`${alert.item_id}-${alert.location_id}-${index}`} alert={alert} type="below_par" />
              ))
            )}
          </div>
        )}

        {activeTab === 'at_risk' && (
          <div className="alerts-list">
            {alerts.at_risk.length === 0 ? (
              <div className="empty-alerts">
                <p>No items at risk</p>
                <p className="empty-alerts-hint">
                  Items will appear here when they are close to going below par level (80-110% of par).
                </p>
              </div>
            ) : (
              alerts.at_risk.map((alert, index) => (
                <AlertCard key={`${alert.item_id}-${alert.location_id}-${index}`} alert={alert} type="at_risk" />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsSection;

