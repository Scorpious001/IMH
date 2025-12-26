import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './AppearanceTab.css';

const AppearanceTab: React.FC = () => {
  const { theme, updateTheme } = useTheme();

  const colorPresets = [
    // High contrast with complementary colors
    { name: 'Ocean Blue', primary: '#0066cc', accent: '#ff6b35' }, // Blue + Orange (complementary)
    { name: 'Forest Green', primary: '#2d8659', accent: '#e63946' }, // Green + Red (complementary)
    { name: 'Royal Purple', primary: '#6a4c93', accent: '#ffb627' }, // Purple + Yellow (complementary)
    { name: 'Crimson Red', primary: '#c1121f', accent: '#06a77d' }, // Red + Teal (complementary)
    { name: 'Amber Orange', primary: '#f77f00', accent: '#003d82' }, // Orange + Blue (complementary)
    { name: 'Teal Cyan', primary: '#118ab2', accent: '#ff6b6b' }, // Teal + Coral (complementary)
    { name: 'Indigo', primary: '#4c1d95', accent: '#f59e0b' }, // Indigo + Amber
    { name: 'Emerald', primary: '#059669', accent: '#dc2626' }, // Emerald + Red
    { name: 'Rose', primary: '#be185d', accent: '#0891b2' }, // Rose + Cyan
    { name: 'Slate', primary: '#475569', accent: '#ea580c' }, // Slate + Orange
    { name: 'Violet', primary: '#7c3aed', accent: '#fbbf24' }, // Violet + Yellow
    { name: 'Turquoise', primary: '#0d9488', accent: '#ef4444' }, // Turquoise + Red
  ];

  const handleColorChange = (type: 'primary' | 'accent', color: string) => {
    if (type === 'primary') {
      updateTheme({ primaryColor: color });
    } else {
      updateTheme({ accentColor: color });
    }
  };

  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    updateTheme({
      primaryColor: preset.primary,
      accentColor: preset.accent,
    });
  };

  return (
    <div className="appearance-tab">
      <div className="settings-section">
        <h3>Color Theme</h3>
        <p className="section-description">
          Customize the primary and accent colors used throughout the application.
        </p>

        <div className="color-picker-group">
          <div className="form-group">
            <label>Primary Color</label>
            <div className="color-input-group">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="color-text-input"
                placeholder="#007bff"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Accent Color</label>
            <div className="color-input-group">
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={theme.accentColor}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="color-text-input"
                placeholder="#28a745"
              />
            </div>
          </div>
        </div>

        <div className="color-presets">
          <label>Color Presets</label>
          <div className="preset-grid">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className="preset-button"
                onClick={() => handlePresetSelect(preset)}
                title={preset.name}
              >
                <div
                  className="preset-primary"
                  style={{ backgroundColor: preset.primary }}
                />
                <div
                  className="preset-accent"
                  style={{ backgroundColor: preset.accent }}
                />
                <span className="preset-name">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Preview</h3>
        <div className="theme-preview">
          <div className="preview-card">
            <div className="preview-header" style={{ backgroundColor: theme.primaryColor }}>
              <span>Header</span>
            </div>
            <div className="preview-content">
              <button
                className="preview-button"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Primary Button
              </button>
              <button
                className="preview-button preview-button-accent"
                style={{ backgroundColor: theme.accentColor }}
              >
                Accent Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceTab;

