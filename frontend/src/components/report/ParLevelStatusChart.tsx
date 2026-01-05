import React, { useState, useEffect } from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { reportsService } from '../../services/reportsService';
import './ParLevelStatusChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ParLevelStatusChart: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParStatusData();
  }, []);

  const loadParStatusData = async () => {
    try {
      setLoading(true);
      const alerts = await reportsService.getAlerts();
      
      // Transform and calculate statistics
      const belowPar = (alerts.below_par || []).map((stockLevel: any) => ({
        item_id: Number(stockLevel.item) || 0,
        location_id: Number(stockLevel.location) || 0,
        location_name: stockLevel.location_name || 'Unknown Location',
        par: Number(stockLevel.par) || 0,
        on_hand_qty: Number(stockLevel.on_hand_qty) || 0,
      }));
      
      const atRisk = (alerts.at_risk || []).map((stockLevel: any) => ({
        item_id: Number(stockLevel.item) || 0,
        location_id: Number(stockLevel.location) || 0,
        location_name: stockLevel.location_name || 'Unknown Location',
        par: Number(stockLevel.par) || 0,
        on_hand_qty: Number(stockLevel.on_hand_qty) || 0,
      }));
      
      const totalItems = belowPar.length + atRisk.length;
      
      // Calculate average deficit for below par items
      const belowParDeficit = belowPar.reduce((sum: number, alert: any) => {
        const par = alert.par || 0;
        const onHand = alert.on_hand_qty || 0;
        return sum + Math.max(0, par - onHand);
      }, 0);
      const avgDeficit = belowPar.length > 0 ? belowParDeficit / belowPar.length : 0;
      
      // Group by location
      const locationGroups: { [key: string]: { below: number; atRisk: number } } = {};
      [...belowPar, ...atRisk].forEach((alert: any) => {
        const loc = alert.location_name || 'Unknown';
        if (!locationGroups[loc]) {
          locationGroups[loc] = { below: 0, atRisk: 0 };
        }
        if (belowPar.some((b: any) => b.item_id === alert.item_id && b.location_id === alert.location_id)) {
          locationGroups[loc].below++;
        } else {
          locationGroups[loc].atRisk++;
        }
      });
      
      setChartData({
        totalItems,
        belowParCount: belowPar.length,
        atRiskCount: atRisk.length,
        avgDeficit,
        locationGroups,
      });
    } catch (error: any) {
      console.error('Error loading par status data:', error);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="par-status-loading">Loading par level status...</div>;
  }

  if (!chartData) {
    return <div className="par-status-empty">No par level data available</div>;
  }

  // Pie chart data for overall status
  const pieData = {
    labels: ['Below Par', 'At Risk', 'OK'],
    datasets: [
      {
        data: [
          chartData.belowParCount,
          chartData.atRiskCount,
          Math.max(0, chartData.totalItems - chartData.belowParCount - chartData.atRiskCount),
        ],
        backgroundColor: [
          'rgba(220, 53, 69, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(40, 167, 69, 0.8)',
        ],
        borderColor: [
          'rgb(220, 53, 69)',
          'rgb(255, 193, 7)',
          'rgb(40, 167, 69)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Bar chart data for locations
  const locations = Object.keys(chartData.locationGroups);
  const barData = {
    labels: locations.length > 0 ? locations : ['No Data'],
    datasets: [
      {
        label: 'Below Par',
        data: locations.map((loc) => chartData.locationGroups[loc].below),
        backgroundColor: 'rgba(220, 53, 69, 0.6)',
      },
      {
        label: 'At Risk',
        data: locations.map((loc) => chartData.locationGroups[loc].atRisk),
        backgroundColor: 'rgba(255, 193, 7, 0.6)',
      },
    ],
  };

  return (
    <div className="par-level-status-chart">
      <h3>Par Level Status Overview</h3>
      
      <div className="par-status-summary">
        <div className="summary-card critical">
          <div className="summary-label">Below Par</div>
          <div className="summary-value">{chartData.belowParCount}</div>
          {chartData.avgDeficit > 0 && (
            <div className="summary-detail">Avg Deficit: {chartData.avgDeficit.toFixed(1)}</div>
          )}
        </div>
        <div className="summary-card warning">
          <div className="summary-label">At Risk</div>
          <div className="summary-value">{chartData.atRiskCount}</div>
        </div>
        <div className="summary-card success">
          <div className="summary-label">Total Items</div>
          <div className="summary-value">{chartData.totalItems}</div>
        </div>
      </div>

      <div className="par-charts-grid">
        <div className="chart-container">
          <h4>Status Distribution</h4>
          <Chart type="doughnut" data={pieData} options={{
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom' as const,
              },
              title: {
                display: false,
              },
            },
          }} />
        </div>

        {locations.length > 0 && (
          <div className="chart-container">
            <h4>Alerts by Location</h4>
            <Chart type="bar" data={barData} options={{
              responsive: true,
              maintainAspectRatio: true,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Items',
                  },
                },
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ParLevelStatusChart;

