import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './PreferencesTab.css';

const PreferencesTab: React.FC = () => {
  const { theme, updateTheme, resetTheme } = useTheme();

  return (
    <div className="preferences-tab">
      <div className="settings-section">
        <h3>Appearance</h3>
        <p className="section-description">
          Adjust the visual appearance of the application.
        </p>

        <div className="preference-group">
          <div className="preference-item">
            <div className="preference-label">
              <label>Dark Mode</label>
              <span className="preference-description">
                Switch between light and dark themes
              </span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="darkMode"
                checked={theme.darkMode}
                onChange={(e) => updateTheme({ darkMode: e.target.checked })}
              />
              <label htmlFor="darkMode" className="toggle-label"></label>
            </div>
          </div>

          <div className="preference-item">
            <div className="preference-label">
              <label>Brightness</label>
              <span className="preference-description">
                Adjust screen brightness ({theme.brightness}%)
              </span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="50"
                max="100"
                value={theme.brightness}
                onChange={(e) => updateTheme({ brightness: parseInt(e.target.value) })}
                className="slider"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Display</h3>
        <p className="section-description">
          Customize how content is displayed.
        </p>

        <div className="preference-group">
          <div className="preference-item">
            <div className="preference-label">
              <label>Font Size</label>
              <span className="preference-description">
                Adjust the base font size
              </span>
            </div>
            <div className="radio-group">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <label key={size} className="radio-label">
                  <input
                    type="radio"
                    name="fontSize"
                    value={size}
                    checked={theme.fontSize === size}
                    onChange={() => updateTheme({ fontSize: size })}
                  />
                  <span className="radio-text">{size.charAt(0).toUpperCase() + size.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="preference-item">
            <div className="preference-label">
              <label>Display Density</label>
              <span className="preference-description">
                Control spacing and padding
              </span>
            </div>
            <div className="radio-group">
              {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
                <label key={density} className="radio-label">
                  <input
                    type="radio"
                    name="displayDensity"
                    value={density}
                    checked={theme.displayDensity === density}
                    onChange={() => updateTheme({ displayDensity: density })}
                  />
                  <span className="radio-text">{density.charAt(0).toUpperCase() + density.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <p className="section-description">
          Configure notification preferences.
        </p>

        <div className="preference-group">
          <div className="preference-item">
            <div className="preference-label">
              <label>Email Notifications</label>
              <span className="preference-description">
                Receive notifications via email
              </span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={theme.notifications.email}
                onChange={(e) =>
                  updateTheme({
                    notifications: { ...theme.notifications, email: e.target.checked },
                  })
                }
              />
              <label htmlFor="emailNotifications" className="toggle-label"></label>
            </div>
          </div>

          <div className="preference-item">
            <div className="preference-label">
              <label>Browser Notifications</label>
              <span className="preference-description">
                Show browser notifications
              </span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="browserNotifications"
                checked={theme.notifications.browser}
                onChange={(e) =>
                  updateTheme({
                    notifications: { ...theme.notifications, browser: e.target.checked },
                  })
                }
              />
              <label htmlFor="browserNotifications" className="toggle-label"></label>
            </div>
          </div>

          <div className="preference-item">
            <div className="preference-label">
              <label>Sound Notifications</label>
              <span className="preference-description">
                Play sounds for notifications
              </span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="soundNotifications"
                checked={theme.notifications.sound}
                onChange={(e) =>
                  updateTheme({
                    notifications: { ...theme.notifications, sound: e.target.checked },
                  })
                }
              />
              <label htmlFor="soundNotifications" className="toggle-label"></label>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>General</h3>
        <p className="section-description">
          General application settings.
        </p>

        <div className="preference-group">
          <div className="preference-item">
            <div className="preference-label">
              <label>Language</label>
              <span className="preference-description">
                Select your preferred language
              </span>
            </div>
            <select
              value={theme.language}
              onChange={(e) => updateTheme({ language: e.target.value })}
              className="select-input"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>

          <div className="preference-item">
            <div className="preference-label">
              <label>Date Format</label>
              <span className="preference-description">
                Choose how dates are displayed
              </span>
            </div>
            <select
              value={theme.dateFormat}
              onChange={(e) => updateTheme({ dateFormat: e.target.value })}
              className="select-input"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={resetTheme}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default PreferencesTab;

