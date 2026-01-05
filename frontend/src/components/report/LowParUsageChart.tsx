import React, { useState, useEffect } from 'react';
import { Chart } from 'react-chartjs-2';
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
import './LowParUsageChart.css';

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

const LowParUsageChart: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLowParData();
  }, []);

  const loadLowParData = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getLowParTrends();
      setChartData(data);
    } catch (error) {
      console.error('Error loading low par trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="chart-loading">Loading low par trends...</div>;
  }

  if (!chartData) {
    return <div className="chart-empty">No low par trend data available</div>;
  }

  if (!chartData.trends || chartData.trends.length === 0) {
    return (
      <div className="chart-empty">
        <p>No low par trend data available</p>
        <p className="chart-empty-hint">Trend data will appear here once par levels are set and items are tracked.</p>
      </div>
    );
  }

  const data = {
    labels: chartData.trends.map((entry: any) => {
      try {
        // Handle both "YYYY-MM" format and full date strings
        let dateStr = entry.period;
        if (dateStr && !dateStr.includes('-')) {
          dateStr = dateStr + '-01';
        } else if (dateStr && dateStr.match(/^\d{4}-\d{2}$/)) {
          dateStr = dateStr + '-01';
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return entry.period || 'Unknown';
        }
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch (e) {
        return entry.period || 'Unknown';
      }
    }),
    datasets: [
      {
        label: 'Items Below Par',
        data: chartData.trends.map((entry: any) => entry.below_par_count),
        borderColor: 'rgb(220, 53, 69)',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Items At Risk',
        data: chartData.trends.map((entry: any) => entry.at_risk_count),
        borderColor: 'rgb(255, 193, 7)',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        tension: 0.1,
        fill: true,
      },
      {
        type: 'bar' as const,
        label: 'Total Alerts',
        data: chartData.trends.map((entry: any) => entry.total_alerts),
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
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
        text: 'Low Par Usage Trends (Annual Timeline)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Items',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Total Alerts',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="low-par-usage-chart">
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">Current Below Par:</span>
          <span className="summary-value critical">
            {chartData.current_below_par || 0}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Current At Risk:</span>
          <span className="summary-value warning">
            {chartData.current_at_risk || 0}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Average Below Par (Year):</span>
          <span className="summary-value">
            {chartData.average_below_par
              ? Number(chartData.average_below_par).toFixed(1)
              : '0'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Peak Below Par:</span>
          <span className="summary-value">
            {chartData.peak_below_par || 0}
          </span>
        </div>
      </div>
      <div className="chart-container">
        <Chart type="line" data={data} options={options} />
      </div>
    </div>
  );
};

export default LowParUsageChart;

