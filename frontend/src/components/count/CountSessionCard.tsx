import React from 'react';
import { CountSession } from '../../types/count.types';
import StatusIndicator from '../shared/StatusIndicator';
import './CountSessionCard.css';

interface CountSessionCardProps {
  session: CountSession;
  onClick?: () => void;
}

const CountSessionCard: React.FC<CountSessionCardProps> = ({ session, onClick }) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const varianceCount = session.lines.filter((line) => line.variance !== 0).length;
  const totalVariance = session.lines.reduce((sum, line) => sum + Math.abs(line.variance), 0);

  return (
    <div className="count-session-card" onClick={onClick}>
      <div className="session-header">
        <div className="session-id">Count #{session.id}</div>
        <StatusIndicator
          status={getStatusColor(session.status)}
          label={session.status}
        />
      </div>
      <div className="session-info">
        <div className="session-location">
          <strong>Location:</strong> {session.location_name}
        </div>
        <div className="session-meta">
          <div className="meta-item">
            <strong>Counted by:</strong> {session.counted_by_name}
          </div>
          <div className="meta-item">
            <strong>Started:</strong> {formatDate(session.started_at)}
          </div>
          {session.completed_at && (
            <div className="meta-item">
              <strong>Completed:</strong> {formatDate(session.completed_at)}
            </div>
          )}
        </div>
        <div className="session-stats">
          <div className="stat-item">
            <span className="stat-label">Lines:</span>
            <span className="stat-value">{session.lines.length}</span>
          </div>
          {varianceCount > 0 && (
            <>
              <div className="stat-item">
                <span className="stat-label">Variances:</span>
                <span className="stat-value variance">{varianceCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Variance:</span>
                <span className="stat-value variance">{totalVariance.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountSessionCard;

