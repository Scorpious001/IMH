import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PreferencesTab from '../../components/settings/PreferencesTab';
import AppearanceTab from '../../components/settings/AppearanceTab';
import ImportItemsTab from '../../components/settings/ImportItemsTab';
import './SettingsPage.css';

type TabType = 'preferences' | 'appearance' | 'import-items';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<TabType>('preferences');

  const tabs = [
    { id: 'preferences' as TabType, label: 'Preferences' },
    { id: 'appearance' as TabType, label: 'Appearance' },
    ...(isAdmin ? [{ id: 'import-items' as TabType, label: 'Import Items' }] : []),
  ];

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="settings-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === 'preferences' && <PreferencesTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'import-items' && isAdmin && <ImportItemsTab />}
      </div>
    </div>
  );
};

export default SettingsPage;
