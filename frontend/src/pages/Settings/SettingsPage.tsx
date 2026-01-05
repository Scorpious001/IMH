import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PreferencesTab from '../../components/settings/PreferencesTab';
import AppearanceTab from '../../components/settings/AppearanceTab';
import ImportItemsTab from '../../components/settings/ImportItemsTab';
import './SettingsPage.css';

type TabType = 'preferences' | 'appearance' | 'import-items';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  // Check both role and is_superuser for admin access
  const isAdmin = user?.role === 'ADMIN' || user?.is_superuser === true;
  const [activeTab, setActiveTab] = useState<TabType>('preferences');

  // Debug logging
  console.log('SettingsPage - User:', user);
  console.log('SettingsPage - User role:', user?.role);
  console.log('SettingsPage - Is superuser:', user?.is_superuser);
  console.log('SettingsPage - Is admin:', isAdmin);

  // Always show Import Items tab - it will show an access message if not admin
  const tabs = [
    { id: 'preferences' as TabType, label: 'Preferences' },
    { id: 'appearance' as TabType, label: 'Appearance' },
    { id: 'import-items' as TabType, label: 'Import Items' },
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
        {activeTab === 'import-items' && <ImportItemsTab />}
      </div>
    </div>
  );
};

export default SettingsPage;
