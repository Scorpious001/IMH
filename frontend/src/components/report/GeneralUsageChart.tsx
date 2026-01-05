import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { reportsService } from '../../services/reportsService';
import './GeneralUsageChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Filler,
  Title,
  Tooltip,
  Legend
);

interface GeneralUsageChartProps {
  period?: 'month' | 'quarter' | 'year';
}

const GeneralUsageChart: React.FC<GeneralUsageChartProps> = ({ period = 'year' }) => {
  const [usageData, setUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>(period);

  useEffect(() => {
    loadUsageData();
  }, [selectedPeriod]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getGeneralUsage(selectedPeriod);
      setUsageData(data);
    } catch (error) {
      console.error('Error loading general usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="chart-loading">Loading usage data...</div>;
  }

  if (!usageData) {
    return <div className="chart-empty">No usage data available</div>;
  }

  if (!usageData.usage_by_period || usageData.usage_by_period.length === 0) {
    return (
      <div className="chart-empty">
        <p>No usage data available for the selected period</p>
        <p className="chart-empty-hint">Usage data will appear here once items are issued from inventory.</p>
      </div>
    );
  }

  const chartData = {
    labels: usageData.usage_by_period.map((entry: any) => {
      if (selectedPeriod === 'quarter') {
        return `Q${entry.quarter} ${entry.year}`;
      } else {
        // For year or month, use period field (e.g., "2024-01")
        try {
          const date = new Date(entry.period + '-01');
          if (isNaN(date.getTime())) {
            return entry.period || 'Unknown';
          }
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch (e) {
          return entry.period || 'Unknown';
        }
      }
    }),
    datasets: [
      {
        label: 'Total Usage',
        data: usageData.usage_by_period.map((entry: any) => Number(entry.total_qty)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Items Issued',
        data: usageData.usage_by_period.map((entry: any) => entry.item_count || 0),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `General Usage Trends (${selectedPeriod === 'year' ? 'Monthly' : selectedPeriod === 'quarter' ? 'Quarterly' : 'Monthly'})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Quantity',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Items Issued',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="general-usage-chart">
      <div className="chart-controls">
        <label>
          Period:
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year')}
          >
            <option value="month">Last 12 Months</option>
            <option value="quarter">Last 4 Quarters</option>
            <option value="year">Last Year (Monthly)</option>
          </select>
        </label>
      </div>
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">Total Usage:</span>
          <span className="summary-value">
            {usageData.total_usage ? Number(usageData.total_usage).toFixed(2) : '0'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Average per Period:</span>
          <span className="summary-value">
            {usageData.average_per_period
              ? Number(usageData.average_per_period).toFixed(2)
              : '0'}
          </span>
        </div>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default GeneralUsageChart;

