import React from 'react';
import AlertsSection from '../../components/report/AlertsSection';
import SuggestedOrdersSection from '../../components/report/SuggestedOrdersSection';
import UsageTrendsSection from '../../components/report/UsageTrendsSection';
import GeneralUsageChart from '../../components/report/GeneralUsageChart';
import LowParUsageChart from '../../components/report/LowParUsageChart';
import ParLevelStatusChart from '../../components/report/ParLevelStatusChart';
import './ReportsPage.css';

const ReportsPage: React.FC = () => {
  return (
    <div className="reports-page">
      <h1>Reports & Alerts</h1>
      <ParLevelStatusChart />
      <AlertsSection />
      <GeneralUsageChart />
      <LowParUsageChart />
      <SuggestedOrdersSection />
      <UsageTrendsSection />
    </div>
  );
};

export default ReportsPage;
