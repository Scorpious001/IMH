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
import { UsageData } from '../../types/item.types';
import './UsageChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface UsageChartProps {
  itemId: number;
}

const UsageChart: React.FC<UsageChartProps> = ({ itemId }) => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadUsageData();
  }, [itemId, days]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const data = await itemsService.getUsage(itemId, days);
      setUsageData(data);
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="usage-chart-loading">Loading usage data...</div>;
  }

  if (!usageData || !usageData.usage_by_day || usageData.usage_by_day.length === 0) {
    return <div className="usage-chart-empty">No usage data available for this period</div>;
  }

  const chartData = {
    labels: usageData.usage_by_day.map((entry) => {
      const date = new Date(entry.day);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Daily Usage',
        data: usageData.usage_by_day.map((entry) => parseFloat(entry.total_qty.toString())),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true,
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
  };

  return (
    <div className="usage-chart">
      <div className="usage-chart-controls">
        <label>
          Period:
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </label>
      </div>
      <div className="usage-chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default UsageChart;

