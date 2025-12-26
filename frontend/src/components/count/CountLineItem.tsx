import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CountLine } from '../../types/count.types';
import './CountLineItem.css';

interface CountLineItemProps {
  line: CountLine;
}

const CountLineItem: React.FC<CountLineItemProps> = ({ line }) => {
  const navigate = useNavigate();

  const handleItemClick = () => {
    navigate(`/catalog/${line.item}`);
  };

  const varianceClass = line.variance > 0 ? 'variance-positive' : line.variance < 0 ? 'variance-negative' : 'variance-zero';

  return (
    <div className="count-line-item">
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
      <div className="line-counts">
        <div className="count-item">
          <span className="count-label">Expected:</span>
          <span className="count-value">{line.expected_qty}</span>
        </div>
        <div className="count-item">
          <span className="count-label">Counted:</span>
          <span className="count-value">{line.counted_qty}</span>
        </div>
        <div className="count-item">
          <span className="count-label">Variance:</span>
          <span className={`count-value variance ${varianceClass}`}>
            {line.variance > 0 ? '+' : ''}{line.variance}
          </span>
        </div>
      </div>
      {line.reason_code && (
        <div className="line-reason">
          <strong>Reason:</strong> {line.reason_code}
        </div>
      )}
      {line.notes && (
        <div className="line-notes">
          <strong>Notes:</strong> {line.notes}
        </div>
      )}
    </div>
  );
};

export default CountLineItem;

