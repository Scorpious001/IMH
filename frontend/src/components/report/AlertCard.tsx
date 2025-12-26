import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BelowParAlert, AtRiskAlert } from '../../types/report.types';
import StatusIndicator from '../shared/StatusIndicator';
import './AlertCard.css';

interface AlertCardProps {
  alert: BelowParAlert | AtRiskAlert;
  type: 'below_par' | 'at_risk';
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, type }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/catalog/${alert.item_id}`);
  };

  const status = type === 'below_par' ? 'critical' : 'warning';
  const par = alert.par || 0;
  const onHand = alert.on_hand_qty || 0;
  const percentage = par > 0 ? ((onHand / par) * 100).toFixed(0) : '0';
  const deficit = Math.max(0, par - onHand);
  const fillPercentage = Math.min(100, Math.max(0, (onHand / par) * 100));

  return (
    <div className="alert-card" onClick={handleClick}>
      <div className="alert-header">
        <div className="alert-item-info">
          <div className="alert-item-name">{alert.item_name}</div>
          <div className="alert-item-code">{alert.item_short_code}</div>
        </div>
        <StatusIndicator status={status} label={type === 'below_par' ? 'Below Par' : 'At Risk'} />
      </div>
      <div className="alert-location">
        <strong>Location:</strong> {alert.location_name}
      </div>
      
      {/* Visual Par Level Indicator */}
      <div className="par-level-indicator">
        <div className="par-indicator-header">
          <span className="par-label">Stock Level vs Par</span>
          <span className="par-percentage">{percentage}%</span>
        </div>
        <div className="par-progress-bar">
          <div 
            className={`par-fill ${type === 'below_par' ? 'critical' : 'warning'}`}
            style={{ width: `${fillPercentage}%` }}
          />
          <div className="par-marker" style={{ left: `${Math.min(100, (par / Math.max(par, onHand * 1.2)) * 100)}%` }} />
        </div>
        <div className="par-values">
          <span className="par-value">On Hand: {onHand}</span>
          <span className="par-value">Par: {par}</span>
          {deficit > 0 && (
            <span className="par-deficit">Need: {deficit.toFixed(0)}</span>
          )}
        </div>
      </div>

      <div className="alert-stock-info">
        <div className="stock-item">
          <span className="stock-label">On Hand:</span>
          <span className="stock-value">{onHand}</span>
        </div>
        <div className="stock-item">
          <span className="stock-label">Par Level:</span>
          <span className="stock-value">{par}</span>
        </div>
        {deficit > 0 && (
          <div className="stock-item">
            <span className="stock-label">Deficit:</span>
            <span className="stock-value critical">{deficit.toFixed(0)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCard;

