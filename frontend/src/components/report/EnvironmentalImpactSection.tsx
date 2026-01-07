import React, { useState, useEffect } from 'react';
import { reportsService } from '../../services/reportsService';
import './EnvironmentalImpactSection.css';

interface EnvironmentalImpact {
  system_start_date: string;
  days_active: number;
  paper_savings: {
    total_transactions: number;
    pages_saved: number;
    trees_saved: number;
    co2_saved_kg: number;
  };
  waste_reduction: {
    total_items_tracked: number;
    below_par_alerts_prevented: number;
    waste_reduction_percentage: number;
    estimated_value_saved: number;
    waste_weight_kg: number;
    co2_saved_kg: number;
  };
  transportation: {
    total_receipts: number;
    trips_saved: number;
    km_saved: number;
    co2_saved_kg: number;
  };
  carbon_footprint: {
    total_co2_saved_kg: number;
    total_co2_saved_tons: number;
    equivalent_cars_off_road_days: number;
  };
  energy_savings: {
    kwh_saved: number;
    equivalent_homes_powered_days: number;
  };
  summary: {
    trees_saved: number;
    total_co2_tons: number;
    waste_avoided_kg: number;
  };
}

const EnvironmentalImpactSection: React.FC = () => {
  const [data, setData] = useState<EnvironmentalImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const impact = await reportsService.getEnvironmentalImpact();
      setData(impact);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load environmental impact data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="environmental-impact-section loading">Loading environmental impact data...</div>;
  }

  if (error || !data) {
    return (
      <div className="environmental-impact-section error">
        {error || 'No data available'}
      </div>
    );
  }

  return (
    <div className="environmental-impact-section">
      <div className="section-header">
        <h2>🌱 Environmental Impact</h2>
        <p className="subtitle">Your sustainability metrics since {new Date(data.system_start_date).toLocaleDateString()}</p>
      </div>

      {/* Summary Cards */}
      <div className="impact-summary">
        <div className="impact-card trees">
          <div className="icon">🌳</div>
          <div className="value">{data.summary.trees_saved}</div>
          <div className="label">Trees Saved</div>
        </div>
        <div className="impact-card co2">
          <div className="icon">💨</div>
          <div className="value">{data.summary.total_co2_tons.toFixed(3)}</div>
          <div className="label">Tons CO₂ Saved</div>
        </div>
        <div className="impact-card waste">
          <div className="icon">♻️</div>
          <div className="value">{data.summary.waste_avoided_kg.toFixed(0)}</div>
          <div className="label">kg Waste Avoided</div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="impact-details">
        <div className="detail-section">
          <h3>📄 Paper Savings</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Pages Saved:</span>
              <span className="metric-value">{data.paper_savings.pages_saved.toLocaleString()}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Transactions:</span>
              <span className="metric-value">{data.paper_savings.total_transactions.toLocaleString()}</span>
            </div>
            <div className="metric">
              <span className="metric-label">CO₂ Saved:</span>
              <span className="metric-value">{data.paper_savings.co2_saved_kg.toFixed(2)} kg</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>🚛 Transportation Impact</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Delivery Trips Saved:</span>
              <span className="metric-value">{data.transportation.trips_saved.toFixed(1)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Kilometers Saved:</span>
              <span className="metric-value">{data.transportation.km_saved.toFixed(0)} km</span>
            </div>
            <div className="metric">
              <span className="metric-label">CO₂ Saved:</span>
              <span className="metric-value">{data.transportation.co2_saved_kg.toFixed(2)} kg</span>
            </div>
            <div className="metric">
              <span className="metric-label">Equivalent to:</span>
              <span className="metric-value">{data.carbon_footprint.equivalent_cars_off_road_days.toFixed(1)} car-days off road</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>🗑️ Waste Reduction</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Items Tracked:</span>
              <span className="metric-value">{data.waste_reduction.total_items_tracked}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Waste Reduction:</span>
              <span className="metric-value">{data.waste_reduction.waste_reduction_percentage.toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Value Saved:</span>
              <span className="metric-value">${data.waste_reduction.estimated_value_saved.toLocaleString()}</span>
            </div>
            <div className="metric">
              <span className="metric-label">CO₂ Saved:</span>
              <span className="metric-value">{data.waste_reduction.co2_saved_kg.toFixed(2)} kg</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>⚡ Energy Savings</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Energy Saved:</span>
              <span className="metric-value">{data.energy_savings.kwh_saved.toFixed(2)} kWh</span>
            </div>
            <div className="metric">
              <span className="metric-label">Equivalent to:</span>
              <span className="metric-value">{data.energy_savings.equivalent_homes_powered_days.toFixed(1)} home-days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalImpactSection;
