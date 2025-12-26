import React from 'react';
import ParLevelForm from './ParLevelForm';
import './ParLevelsTab.css';

const ParLevelsTab: React.FC = () => {
  const handleSubmit = () => {
    // Form handles its own submission
  };

  return (
    <div className="par-levels-tab">
      <div className="tab-header">
        <h2>Par Levels</h2>
        <p className="tab-description">
          Set par levels for items at specific locations. Par level is the minimum level stock should be maintained at (items should stay above this level).
          These levels are used to generate alerts and suggested orders.
        </p>
      </div>

      <ParLevelForm onSubmit={handleSubmit} />
    </div>
  );
};

export default ParLevelsTab;

