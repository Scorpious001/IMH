import React from 'react';
import AlertsSection from '../../components/report/AlertsSection';
import SuggestedOrdersSection from '../../components/report/SuggestedOrdersSection';
import UsageTrendsSection from '../../components/report/UsageTrendsSection';
import GeneralUsageChart from '../../components/report/GeneralUsageChart';
import LowParUsageChart from '../../components/report/LowParUsageChart';
import ParLevelStatusChart from '../../components/report/ParLevelStatusChart';
import EnvironmentalImpactSection from '../../components/report/EnvironmentalImpactSection';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import './ReportsPage.css';

const ReportsPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="reports-page">
        <h1>Reports & Alerts</h1>
        <ErrorBoundary fallback={<div style={{ padding: '1rem', color: '#dc2626' }}>Error loading Environmental Impact</div>}>
          <EnvironmentalImpactSection />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div style={{ padding: '1rem', color: '#dc2626' }}>Error loading Par Level Status</div>}>
          <ParLevelStatusChart />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div style={{ padding: '1rem', color: '#dc2626' }}>Error loading Alerts</div>}>
          <AlertsSection />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div style={{ padding: '1rem', color: '#dc2626' }}>Error loading General Usage Chart</div>}>
          <GeneralUsageChart />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div style={{ padding: '1rem', color: '#dc2626' }}>Error loading Low Par Trends</div>}>
          <LowParUsageChart />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div style={{ padding: '1rem', color: '#dc2626' }}>Error loading Suggested Orders</div>}>
          <SuggestedOrdersSection />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div style={{ padding: '1rem', color: '#dc2626' }}>Error loading Usage Trends</div>}>
          <UsageTrendsSection />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default ReportsPage;
