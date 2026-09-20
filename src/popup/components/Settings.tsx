// src/popup/components/Settings.tsx

import React, { useState } from 'react';
import { ExtensionSettings } from '../../types';

interface SettingsProps {
  settings: ExtensionSettings;
  onUpdate: (settings: Partial<ExtensionSettings>) => Promise<void>;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdate,
  onExport,
  onImport,
  onClear
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = async (key: keyof ExtensionSettings, value: string) => {
    setIsSaving(true);
    try {
      await onUpdate({ [key]: value });
    } catch (error) {
      DEBUG && console.error('Failed to update setting:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* UI Settings */}
      <div className="settings-section">
        <h3 className="settings-section-title">Interface Settings</h3>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">
              Enable keyboard shortcuts
            </div>
            <div className="settings-item-description">
              Ctrl+Shift+P: Open panel, Ctrl+Shift+U: Toggle UI
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.enableKeyboardShortcuts}
              disabled
              readOnly
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Theme</div>
            <div className="settings-item-description">
              Interface theme preference
            </div>
          </div>
          <select
            value={settings.theme}
            onChange={(e) => handleSelect('theme', e.target.value)}
            className="form-select"
            disabled={isSaving}
            style={{ width: '100px', fontSize: '12px' }}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      {/* Data Management */}
      <div className="settings-section">
        <h3 className="settings-section-title">Data Management</h3>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Export prompts</div>
            <div className="settings-item-description">
              Download all prompts and categories as JSON
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={onExport}
            disabled={isSaving}
          >
            Export
          </button>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Import prompts</div>
            <div className="settings-item-description">
              Import prompts and categories from JSON file
            </div>
          </div>
          <div>
            <input
              type="file"
              id="import-file"
              accept=".json"
              onChange={onImport}
              disabled={isSaving}
              style={{ display: 'none' }}
            />
            <label htmlFor="import-file">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => document.getElementById('import-file')?.click()}
                disabled={isSaving}
              >
                Import
              </button>
            </label>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Clear all data</div>
            <div className="settings-item-description">
              Delete all prompts, categories, and settings
            </div>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={onClear}
            disabled={isSaving}
          >
            Clear
          </button>
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <h3 className="settings-section-title">About</h3>
        <div className="sponsor-card">
          <p className="sponsor-text">
            Prompt Pocket is free and open source.
          </p>

          <div className="info-card-title">
            🔒 Privacy-first by design
          </div>
          <p className="sponsor-text">
            Your data stays in your browser.
          </p>
          <p className="sponsor-text">
            No data is sent to our servers.
          </p>

          <p className="sponsor-text">
            If it saves you time, consider supporting its continued development.
          </p>
          <a
            href="https://github.com/sponsors/PaladinChendi"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary sponsor-btn"
          >
            ☕ Buy Me a Coffee
          </a>
          <a
            href="https://github.com/PaladinChendi/PromptPocket"
            target="_blank"
            rel="noopener noreferrer"
            className="sponsor-star"
          >
            ★ Star on GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default Settings;