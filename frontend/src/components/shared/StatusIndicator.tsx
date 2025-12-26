import React from 'react';
import './StatusIndicator.css';

interface StatusIndicatorProps {
  status: 'good' | 'warning' | 'critical';
  label?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label }) => {
  return (
    <div className={`status-indicator status-${status}`}>
      <span className="status-dot"></span>
      {label && <span className="status-label">{label}</span>}
    </div>
  );
};

export default StatusIndicator;

