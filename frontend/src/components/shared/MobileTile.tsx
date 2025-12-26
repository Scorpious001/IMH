import React from 'react';
import './MobileTile.css';

interface MobileTileProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  icon?: string;
  status?: 'good' | 'warning' | 'critical';
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const MobileTile: React.FC<MobileTileProps> = ({
  title,
  subtitle,
  imageUrl,
  icon,
  status,
  onClick,
  children,
  className = '',
}) => {
  const statusClass = status ? `tile-${status}` : '';

  return (
    <div
      className={`mobile-tile ${statusClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {(imageUrl || icon) && (
        <div className="tile-image">
          {imageUrl ? (
            <img src={imageUrl} alt={title} />
          ) : (
            <div className="tile-icon">{icon}</div>
          )}
        </div>
      )}
      <div className="tile-content">
        <h3 className="tile-title">{title}</h3>
        {subtitle && <p className="tile-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
};

export default MobileTile;

