import React, { useState } from 'react';
import { Requisition } from '../../types/requisition.types';
import { useAuth } from '../../contexts/AuthContext';
import RequisitionLineItem from './RequisitionLineItem';
import StatusIndicator from '../shared/StatusIndicator';
import './RequisitionDetailView.css';

interface RequisitionDetailViewProps {
  requisition: Requisition;
  onPick?: () => void;
  onComplete?: () => void;
  onApprove?: () => void;
  onDeny?: (reason?: string) => void;
  onClose?: () => void;
}

const RequisitionDetailView: React.FC<RequisitionDetailViewProps> = ({
  requisition,
  onPick,
  onComplete,
  onApprove,
  onDeny,
  onClose,
}) => {
  const { user } = useAuth();
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [denialReason, setDenialReason] = useState('');

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string): 'good' | 'warning' | 'critical' => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return 'good';
      case 'PICKED':
        return 'warning';
      case 'PENDING':
        return 'critical';
      case 'DENIED':
        return 'critical';
      default:
        return 'good';
    }
  };

  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canApprove = isManagerOrAdmin && requisition.status === 'PENDING';
  const canDeny = isManagerOrAdmin && requisition.status === 'PENDING';
  const canPick = requisition.status === 'APPROVED';
  const canComplete = requisition.status === 'PICKED';

  const handleDeny = () => {
    // The denial reason will be handled by the parent component
    // which calls the service with the reason
    setShowDenyForm(false);
    setDenialReason('');
  };

  return (
    <div className="requisition-detail-view">
      <div className="detail-header">
        <h2>Requisition #{requisition.id}</h2>
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
            status={getStatusColor(requisition.status)}
            label={requisition.status}
          />
        </div>

        <div className="detail-section">
          <h3>Route</h3>
          <div className="route-info">
            <div className="route-item">
              <span className="route-label">From:</span>
              <span className="route-value">{requisition.from_location_name}</span>
            </div>
            <div className="route-arrow">→</div>
            <div className="route-item">
              <span className="route-label">To:</span>
              <span className="route-value">{requisition.to_location_name}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Requested by:</span>
              <span className="info-value">{requisition.requested_by_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Created:</span>
              <span className="info-value">{formatDate(requisition.created_at)}</span>
            </div>
            {requisition.needed_by && (
              <div className="info-item">
                <span className="info-label">Needed by:</span>
                <span className="info-value">{formatDate(requisition.needed_by)}</span>
              </div>
            )}
            {requisition.approved_at && (
              <div className="info-item">
                <span className="info-label">Approved by:</span>
                <span className="info-value">
                  {requisition.approved_by_name} on {formatDate(requisition.approved_at)}
                </span>
              </div>
            )}
            {requisition.denied_at && (
              <div className="info-item">
                <span className="info-label">Denied by:</span>
                <span className="info-value">
                  {requisition.denied_by_name} on {formatDate(requisition.denied_at)}
                </span>
              </div>
            )}
            {requisition.completed_at && (
              <div className="info-item">
                <span className="info-label">Completed:</span>
                <span className="info-value">{formatDate(requisition.completed_at)}</span>
              </div>
            )}
          </div>
        </div>

        {requisition.denial_reason && (
          <div className="detail-section">
            <h3>Denial Reason</h3>
            <p className="denial-reason">{requisition.denial_reason}</p>
          </div>
        )}

        {requisition.notes && (
          <div className="detail-section">
            <h3>Notes</h3>
            <p className="notes-text">{requisition.notes}</p>
          </div>
        )}

        <div className="detail-section">
          <h3>Line Items ({requisition.lines.length})</h3>
          <div className="lines-list">
            {requisition.lines.map((line) => (
              <RequisitionLineItem key={line.id} line={line} />
            ))}
          </div>
        </div>

        <div className="detail-actions">
          {canApprove && onApprove && (
            <button className="btn-action btn-approve" onClick={onApprove}>
              Approve
            </button>
          )}
          {canDeny && onDeny && (
            <>
              {!showDenyForm ? (
                <button className="btn-action btn-deny" onClick={() => setShowDenyForm(true)}>
                  Deny
                </button>
              ) : (
                <div className="deny-form">
                  <textarea
                    placeholder="Enter denial reason (optional)"
                    value={denialReason}
                    onChange={(e) => setDenialReason(e.target.value)}
                    rows={3}
                  />
                  <div className="deny-form-actions">
                    <button
                      className="btn-action btn-deny"
                      onClick={() => {
                        if (onDeny) {
                          onDeny(denialReason || undefined);
                        }
                        setShowDenyForm(false);
                        setDenialReason('');
                      }}
                    >
                      Confirm Deny
                    </button>
                    <button
                      className="btn-action btn-cancel"
                      onClick={() => {
                        setShowDenyForm(false);
                        setDenialReason('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {canPick && onPick && (
            <button className="btn-action btn-pick" onClick={onPick}>
              Mark as Picked
            </button>
          )}
          {canComplete && onComplete && (
            <button className="btn-action btn-complete" onClick={onComplete}>
              Complete Requisition
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequisitionDetailView;

