import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SuggestedOrder } from '../../types/report.types';
import './SuggestedOrderCard.css';

interface SuggestedOrderCardProps {
  suggestion: SuggestedOrder;
}

const SuggestedOrderCard: React.FC<SuggestedOrderCardProps> = ({ suggestion }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/catalog/${suggestion.item_id}`);
  };

  return (
    <div className="suggested-order-card" onClick={handleClick}>
      <div className="suggestion-header">
        <div className="suggestion-item-info">
          <div className="suggestion-item-name">{suggestion.item_name}</div>
          <div className="suggestion-item-code">{suggestion.item_short_code}</div>
        </div>
        <div className="suggestion-qty">
          <span className="qty-label">Suggested:</span>
          <span className="qty-value">{suggestion.suggested_qty}</span>
        </div>
      </div>
      <div className="suggestion-details">
        {suggestion.location_name && (
          <div className="detail-row">
            <strong>Location:</strong> {suggestion.location_name}
          </div>
        )}
        <div className="detail-row">
          <strong>Current Stock:</strong> {suggestion.current_on_hand ?? suggestion.current_stock}
        </div>
        <div className="detail-row">
          <strong>Par Level:</strong> {suggestion.par}
        </div>
        <div className="detail-row">
          <strong>Suggested Order:</strong> {suggestion.suggested_qty} units
        </div>
        {suggestion.days_until_below_par !== null && suggestion.days_until_below_par !== undefined && (
          <div className="detail-row">
            <strong>Days Until Below Par:</strong> {suggestion.days_until_below_par}
          </div>
        )}
        {suggestion.vendor_name && (
          <div className="detail-row">
            <strong>Vendor:</strong> {suggestion.vendor_name}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedOrderCard;


