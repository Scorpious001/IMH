import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryTransaction } from '../../types/stock.types';
import './ReceivingHistoryItem.css';

interface ReceivingHistoryItemProps {
  transaction: InventoryTransaction;
}

const ReceivingHistoryItem: React.FC<ReceivingHistoryItemProps> = ({ transaction }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleItemClick = () => {
    navigate(`/catalog/${transaction.item}`);
  };

  return (
    <div className="receiving-history-item">
      <div className="history-item-header" onClick={handleItemClick}>
        <div className="item-info">
          <div className="item-name">{transaction.item_name}</div>
          <div className="transaction-meta">
            <span className="transaction-date">{formatDate(transaction.timestamp)}</span>
            {transaction.user_name && (
              <span className="transaction-user">by {transaction.user_name}</span>
            )}
          </div>
        </div>
        <div className="transaction-qty">
          <span className="qty-value">+{transaction.qty}</span>
        </div>
      </div>
      <div className="history-item-details">
        {transaction.to_location_name && (
          <div className="detail-item">
            <strong>Location:</strong> {transaction.to_location_name}
          </div>
        )}
        {transaction.cost !== undefined && transaction.cost !== null && (
          <div className="detail-item">
            <strong>Cost:</strong> ${Number(transaction.cost).toFixed(2)}
          </div>
        )}
        {transaction.receipt_id && (
          <div className="detail-item">
            <strong>PO/Receipt:</strong> {transaction.receipt_id}
          </div>
        )}
        {transaction.notes && (
          <div className="detail-item">
            <strong>Notes:</strong> {transaction.notes}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivingHistoryItem;

