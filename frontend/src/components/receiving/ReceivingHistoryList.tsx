import React, { useState } from 'react';
import { InventoryTransaction } from '../../types/stock.types';
import ReceivingHistoryItem from './ReceivingHistoryItem';
import './ReceivingHistoryList.css';

interface ReceivingHistoryListProps {
  transactions: InventoryTransaction[];
  loading?: boolean;
}

const ReceivingHistoryList: React.FC<ReceivingHistoryListProps> = ({
  transactions,
  loading,
}) => {
  const [filterItem, setFilterItem] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');

  const filteredTransactions = transactions.filter((t) => {
    const matchesItem =
      !filterItem ||
      t.item_name.toLowerCase().includes(filterItem.toLowerCase()) ||
      t.item.toString().includes(filterItem);
    const matchesLocation =
      !filterLocation ||
      (t.to_location_name &&
        t.to_location_name.toLowerCase().includes(filterLocation.toLowerCase()));
    return matchesItem && matchesLocation;
  });

  if (loading) {
    return <div className="history-loading">Loading history...</div>;
  }

  return (
    <div className="receiving-history-list">
      <div className="history-filters">
        <input
          type="text"
          placeholder="Filter by item..."
          value={filterItem}
          onChange={(e) => setFilterItem(e.target.value)}
          className="filter-input"
        />
        <input
          type="text"
          placeholder="Filter by location..."
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="history-header">
        <h3>Receiving History ({filteredTransactions.length})</h3>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="empty-history">
          <p>No receiving transactions found</p>
        </div>
      ) : (
        <div className="history-items">
          {filteredTransactions.map((transaction) => (
            <ReceivingHistoryItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceivingHistoryList;

