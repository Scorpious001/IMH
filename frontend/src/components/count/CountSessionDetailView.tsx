import React, { useState, useEffect } from 'react';
import { CountSession } from '../../types/count.types';
import { itemsService } from '../../services/itemsService';
import { stockService } from '../../services/stockService';
import CountLineItem from './CountLineItem';
import CountLineForm from './CountLineForm';
import StatusIndicator from '../shared/StatusIndicator';
import './CountSessionDetailView.css';

interface CountSessionDetailViewProps {
  session: CountSession;
  onAddLine: (data: {
    item_id: number;
    counted_qty: number;
    reason_code?: string;
    notes?: string;
  }) => Promise<void>;
  onComplete?: () => void;
  onApprove?: () => void;
  onClose?: () => void;
}

const CountSessionDetailView: React.FC<CountSessionDetailViewProps> = ({
  session,
  onAddLine,
  onComplete,
  onApprove,
  onClose,
}) => {
  const [showAddLine, setShowAddLine] = useState(false);
  const [expectedQtys, setExpectedQtys] = useState<Record<number, number>>({});

  useEffect(() => {
    loadExpectedQtys();
  }, [session.lines]);

  const loadExpectedQtys = async () => {
    const qtys: Record<number, number> = {};
    for (const line of session.lines) {
      if (!qtys[line.item]) {
        try {
          const stockData = await stockService.getAll({
            item_id: line.item,
            location_id: session.location,
          });
          if (stockData.length > 0) {
            qtys[line.item] = stockData[0].on_hand_qty;
          } else {
            qtys[line.item] = 0;
          }
        } catch (error) {
          console.error(`Error loading stock for item ${line.item}:`, error);
          qtys[line.item] = 0;
        }
      }
    }
    setExpectedQtys(qtys);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string): 'good' | 'warning' | 'critical' => {
    switch (status) {
      case 'APPROVED':
        return 'good';
      case 'COMPLETED':
        return 'warning';
      case 'IN_PROGRESS':
        return 'critical';
      default:
        return 'good';
    }
  };

  const canAddLines = session.status === 'IN_PROGRESS';
  const canComplete = session.status === 'IN_PROGRESS' && session.lines.length > 0;
  const canApprove = session.status === 'COMPLETED';

  const totalVariance = session.lines.reduce((sum, line) => sum + Math.abs(line.variance), 0);
  const varianceCount = session.lines.filter((line) => line.variance !== 0).length;

  const handleAddLineSubmit = async (data: {
    item_id: number;
    counted_qty: number;
    reason_code?: string;
    notes?: string;
  }) => {
    await onAddLine(data);
    setShowAddLine(false);
  };

  return (
    <div className="count-session-detail-view">
      <div className="detail-header">
        <h2>Count Session #{session.id}</h2>
        {onClose && (
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h3>Status</h3>
          <StatusIndicator
            status={getStatusColor(session.status)}
            label={session.status}
          />
        </div>

        <div className="detail-section">
          <h3>Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Location:</span>
              <span className="info-value">{session.location_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Counted by:</span>
              <span className="info-value">{session.counted_by_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Started:</span>
              <span className="info-value">{formatDate(session.started_at)}</span>
            </div>
            {session.completed_at && (
              <div className="info-item">
                <span className="info-label">Completed:</span>
                <span className="info-value">{formatDate(session.completed_at)}</span>
              </div>
            )}
            {session.approved_at && session.approved_by_name && (
              <>
                <div className="info-item">
                  <span className="info-label">Approved by:</span>
                  <span className="info-value">{session.approved_by_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Approved at:</span>
                  <span className="info-value">{formatDate(session.approved_at)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {session.notes && (
          <div className="detail-section">
            <h3>Notes</h3>
            <p className="notes-text">{session.notes}</p>
          </div>
        )}

        <div className="detail-section">
          <div className="section-header">
            <h3>Count Lines ({session.lines.length})</h3>
            {canAddLines && (
              <button
                className="btn-add-line"
                onClick={() => setShowAddLine(!showAddLine)}
              >
                {showAddLine ? 'Cancel' : 'Add Line'}
              </button>
            )}
          </div>

          {showAddLine && canAddLines && (
            <CountLineForm
              onSubmit={handleAddLineSubmit}
              onCancel={() => setShowAddLine(false)}
            />
          )}

          {session.lines.length > 0 && (
            <>
              <div className="variance-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Variance:</span>
                  <span className="summary-value">{totalVariance.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Items with Variance:</span>
                  <span className="summary-value">{varianceCount}</span>
                </div>
              </div>

              <div className="lines-list">
                {session.lines.map((line) => (
                  <CountLineItem key={line.id} line={line} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="detail-actions">
          {canComplete && onComplete && (
            <button className="btn-action btn-complete" onClick={onComplete}>
              Complete Count
            </button>
          )}
          {canApprove && onApprove && (
            <button className="btn-action btn-approve" onClick={onApprove}>
              Approve Count
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountSessionDetailView;

