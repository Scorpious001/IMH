import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RequisitionLine } from '../../types/requisition.types';
import './RequisitionLineItem.css';

interface RequisitionLineItemProps {
  line: RequisitionLine;
}

const RequisitionLineItem: React.FC<RequisitionLineItemProps> = ({ line }) => {
  const navigate = useNavigate();

  const handleItemClick = () => {
    navigate(`/catalog/${line.item}`);
  };

  const isFullyPicked = line.qty_picked >= line.qty_requested;
  const hasAvailability = line.available_qty !== undefined;

  return (
    <div className="requisition-line-item">
      <div className="line-header" onClick={handleItemClick}>
        <div className="line-item-info">
          {line.item_photo_url && (
            <img
              src={line.item_photo_url}
              alt={line.item_name}
              className="line-item-photo"
            />
          )}
          <div className="line-item-details">
            <div className="line-item-name">{line.item_name}</div>
            <div className="line-item-code">{line.item_short_code}</div>
          </div>
        </div>
      </div>
      <div className="line-quantities">
        <div className="quantity-item">
          <span className="quantity-label">Requested:</span>
          <span className="quantity-value">{line.qty_requested}</span>
        </div>
        <div className="quantity-item">
          <span className="quantity-label">Picked:</span>
          <span
            className={`quantity-value ${isFullyPicked ? 'picked-complete' : 'picked-partial'}`}
          >
            {line.qty_picked}
          </span>
        </div>
        {hasAvailability && (
          <div className="quantity-item">
            <span className="quantity-label">Available:</span>
            <span
              className={`quantity-value ${
                line.available_qty! >= line.qty_requested ? 'available-ok' : 'available-low'
              }`}
            >
              {line.available_qty}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequisitionLineItem;

