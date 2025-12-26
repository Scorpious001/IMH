import React, { useState, useEffect } from 'react';
import { stockService } from '../../services/stockService';
import { locationsService } from '../../services/locationsService';
import { Location } from '../../types/location.types';
import './StockActions.css';

interface StockActionsProps {
  itemId: number;
  onActionComplete: () => void;
}

const StockActions: React.FC<StockActionsProps> = ({ itemId, onActionComplete }) => {
  const [activeTab, setActiveTab] = useState<'transfer' | 'issue' | 'adjust'>('transfer');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Transfer form state
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Issue form state
  const [issueFrom, setIssueFrom] = useState('');
  const [issueQty, setIssueQty] = useState('');
  const [issueWorkOrder, setIssueWorkOrder] = useState('');
  const [issueNotes, setIssueNotes] = useState('');

  // Adjust form state
  const [adjustLocation, setAdjustLocation] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await locationsService.getAll();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const resetForms = () => {
    setTransferFrom('');
    setTransferTo('');
    setTransferQty('');
    setTransferNotes('');
    setIssueFrom('');
    setIssueQty('');
    setIssueWorkOrder('');
    setIssueNotes('');
    setAdjustLocation('');
    setAdjustQty('');
    setAdjustReason('');
    setAdjustNotes('');
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await stockService.transfer({
        item_id: itemId,
        from_location_id: Number(transferFrom),
        to_location_id: Number(transferTo),
        qty: Number(transferQty),
        notes: transferNotes,
      });
      setSuccess('Stock transferred successfully');
      resetForms();
      onActionComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to transfer stock');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await stockService.issue({
        item_id: itemId,
        from_location_id: Number(issueFrom),
        qty: Number(issueQty),
        work_order_id: issueWorkOrder || undefined,
        notes: issueNotes,
      });
      setSuccess('Stock issued successfully');
      resetForms();
      onActionComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to issue stock');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await stockService.adjust({
        item_id: itemId,
        location_id: Number(adjustLocation),
        qty: Number(adjustQty),
        reason: adjustReason || undefined,
        notes: adjustNotes,
      });
      setSuccess('Stock adjusted successfully');
      resetForms();
      onActionComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-actions">
      <div className="stock-actions-tabs">
        <button
          className={`tab-button ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          Transfer
        </button>
        <button
          className={`tab-button ${activeTab === 'issue' ? 'active' : ''}`}
          onClick={() => setActiveTab('issue')}
        >
          Issue
        </button>
        <button
          className={`tab-button ${activeTab === 'adjust' ? 'active' : ''}`}
          onClick={() => setActiveTab('adjust')}
        >
          Adjust
        </button>
      </div>

      {error && <div className="action-error">{error}</div>}
      {success && <div className="action-success">{success}</div>}

      <div className="stock-actions-content">
        {activeTab === 'transfer' && (
          <form onSubmit={handleTransfer} className="action-form">
            <div className="form-group">
              <label>From Location *</label>
              <select
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>To Location *</label>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select location</option>
                {locations
                  .filter((loc) => loc.id.toString() !== transferFrom)
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
            <button type="submit" className="action-submit" disabled={loading}>
              {loading ? 'Processing...' : 'Transfer Stock'}
            </button>
          </form>
        )}

        {activeTab === 'issue' && (
          <form onSubmit={handleIssue} className="action-form">
            <div className="form-group">
              <label>From Location *</label>
              <select
                value={issueFrom}
                onChange={(e) => setIssueFrom(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={issueQty}
                onChange={(e) => setIssueQty(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Work Order ID</label>
              <input
                type="text"
                value={issueWorkOrder}
                onChange={(e) => setIssueWorkOrder(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={issueNotes}
                onChange={(e) => setIssueNotes(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
            <button type="submit" className="action-submit" disabled={loading}>
              {loading ? 'Processing...' : 'Issue Stock'}
            </button>
          </form>
        )}

        {activeTab === 'adjust' && (
          <form onSubmit={handleAdjust} className="action-form">
            <div className="form-group">
              <label>Location *</label>
              <select
                value={adjustLocation}
                onChange={(e) => setAdjustLocation(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity Adjustment *</label>
              <input
                type="number"
                step="0.01"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
                disabled={loading}
                placeholder="Positive to add, negative to subtract"
              />
            </div>
            <div className="form-group">
              <label>Reason</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                disabled={loading}
                placeholder="e.g., Damage, Found, etc."
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
            <button type="submit" className="action-submit" disabled={loading}>
              {loading ? 'Processing...' : 'Adjust Stock'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default StockActions;

