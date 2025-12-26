import React from 'react';
import { Requisition } from '../../types/requisition.types';
import StatusIndicator from '../shared/StatusIndicator';
import './RequisitionCard.css';

interface RequisitionCardProps {
  requisition: Requisition;
  onClick?: () => void;
}

const RequisitionCard: React.FC<RequisitionCardProps> = ({ requisition, onClick }) => {
  const getStatusColor = (status: string): 'good' | 'warning' | 'critical' => {
    switch (status) {
      case 'COMPLETED':
        return 'good';
      case 'PICKED':
        return 'warning';
      case 'PENDING':
        return 'critical';
      default:
        return 'good';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="requisition-card" onClick={onClick}>
      <div className="requisition-header">
        <div className="requisition-id">Req #{requisition.id}</div>
        <StatusIndicator
          status={getStatusColor(requisition.status)}
          label={requisition.status}
        />
      </div>
      <div className="requisition-info">
        <div className="requisition-route">
          <span className="from-location">{requisition.from_location_name}</span>
          <span className="arrow">→</span>
          <span className="to-location">{requisition.to_location_name}</span>
        </div>
        <div className="requisition-meta">
          <div className="meta-item">
            <strong>Lines:</strong> {requisition.lines.length}
          </div>
          <div className="meta-item">
            <strong>Requested by:</strong> {requisition.requested_by_name}
          </div>
          <div className="meta-item">
            <strong>Created:</strong> {formatDate(requisition.created_at)}
          </div>
          {requisition.needed_by && (
            <div className="meta-item">
              <strong>Needed by:</strong> {formatDate(requisition.needed_by)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequisitionCard;

