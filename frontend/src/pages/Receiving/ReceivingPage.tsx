import React, { useState, useEffect } from 'react';
import { receivingService } from '../../services/receivingService';
import { useAuth } from '../../contexts/AuthContext';
import { InventoryTransaction } from '../../types/stock.types';
import ReceiveForm from '../../components/receiving/ReceiveForm';
import ReceivingHistoryList from '../../components/receiving/ReceivingHistoryList';
import './ReceivingPage.css';

const ReceivingPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('receiving', 'create');
  const [history, setHistory] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await receivingService.getHistory();
      // Filter to only RECEIVE transactions
      const receiveTransactions = data.filter((t) => t.type === 'RECEIVE');
      setHistory(receiveTransactions);
    } catch (error) {
      console.error('Error loading receiving history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (data: {
    item_id: number;
    to_location_id: number;
    qty: number;
    cost?: number;
    vendor_id?: number;
    po_number?: string;
    notes?: string;
  }) => {
    try {
      await receivingService.receive(data);
      setShowForm(false);
      loadHistory();
      alert('Items received successfully!');
    } catch (error: any) {
      console.error('Error receiving items:', error);
      alert(error.response?.data?.error || 'Failed to receive items');
    }
  };

  return (
    <div className="receiving-page">
      <div className="page-header">
        <h1>Receiving</h1>
        {canCreate && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            Receive Items
          </button>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ReceiveForm
              onSubmit={handleReceive}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      <ReceivingHistoryList transactions={history} loading={loading} />
    </div>
  );
};

export default ReceivingPage;
