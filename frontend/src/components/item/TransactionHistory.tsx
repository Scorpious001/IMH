import React, { useState } from 'react';
import { InventoryTransaction } from '../../types/stock.types';
import './TransactionHistory.css';

interface TransactionHistoryProps {
  transactions: InventoryTransaction[];
  loading?: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, loading }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (loading) {
    return <div className="transaction-history-loading">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return <div className="transaction-history-empty">No transactions found for this item</div>;
  }

  const getTransactionTypeColor = (type: string): string => {
    switch (type) {
      case 'RECEIVE':
        return '#10b981'; // green
      case 'ISSUE':
        return '#ef4444'; // red
      case 'TRANSFER':
        return '#3b82f6'; // blue
      case 'ADJUST':
        return '#f59e0b'; // amber
      case 'COUNT_ADJUST':
        return '#8b5cf6'; // purple
      default:
        return '#6b7280'; // gray
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="transaction-history">
      <div className="transaction-history-list">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="transaction-item"
            onClick={() => setExpandedId(expandedId === transaction.id ? null : transaction.id)}
          >
            <div className="transaction-header">
              <div className="transaction-type-badge" style={{ backgroundColor: getTransactionTypeColor(transaction.type) }}>
                {transaction.type}
              </div>
              <div className="transaction-main-info">
                <div className="transaction-qty">
                  {transaction.qty > 0 ? '+' : ''}{transaction.qty}
                </div>
                <div className="transaction-locations">
                  {transaction.from_location_name && (
                    <span className="transaction-location">
                      From: {transaction.from_location_name}
                    </span>
                  )}
                  {transaction.to_location_name && (
                    <span className="transaction-location">
                      To: {transaction.to_location_name}
                    </span>
                  )}
                </div>
              </div>
              <div className="transaction-date">{formatDate(transaction.timestamp)}</div>
            </div>
            {expandedId === transaction.id && (
              <div className="transaction-details">
                <div className="transaction-detail-row">
                  <span className="detail-label">User:</span>
                  <span>{transaction.user_name || 'N/A'}</span>
                </div>
                {transaction.cost && (
                  <div className="transaction-detail-row">
                    <span className="detail-label">Cost:</span>
                    <span>${transaction.cost.toFixed(2)}</span>
                  </div>
                )}
                {transaction.work_order_id && (
                  <div className="transaction-detail-row">
                    <span className="detail-label">Work Order:</span>
                    <span>{transaction.work_order_id}</span>
                  </div>
                )}
                {transaction.receipt_id && (
                  <div className="transaction-detail-row">
                    <span className="detail-label">Receipt ID:</span>
                    <span>{transaction.receipt_id}</span>
                  </div>
                )}
                {transaction.notes && (
                  <div className="transaction-detail-row">
                    <span className="detail-label">Notes:</span>
                    <span>{transaction.notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;

