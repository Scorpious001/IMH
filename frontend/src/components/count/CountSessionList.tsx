import React from 'react';
import { CountSession } from '../../types/count.types';
import CountSessionCard from './CountSessionCard';
import './CountSessionList.css';

interface CountSessionListProps {
  sessions: CountSession[];
  onSessionClick: (session: CountSession) => void;
}

const CountSessionList: React.FC<CountSessionListProps> = ({ sessions, onSessionClick }) => {
  if (sessions.length === 0) {
    return (
      <div className="empty-sessions">
        <p>No count sessions found</p>
      </div>
    );
  }

  return (
    <div className="count-session-list">
      {sessions.map((session) => (
        <CountSessionCard
          key={session.id}
          session={session}
          onClick={() => onSessionClick(session)}
        />
      ))}
    </div>
  );
};

export default CountSessionList;

