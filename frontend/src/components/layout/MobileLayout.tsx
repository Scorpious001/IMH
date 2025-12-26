import React from 'react';
import TopNav from './TopNav';
import './MobileLayout.css';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="mobile-layout">
      <TopNav />
      <main className="layout-content">
        {children}
      </main>
    </div>
  );
};

export default MobileLayout;

