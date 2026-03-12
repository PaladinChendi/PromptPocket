// src/popup/components/Settings.tsx

import React, { useState } from 'react';
import { ExtensionSettings } from '../../types';

interface SettingsProps {
  settings: ExtensionSettings;
  onUpdate: (settings: Partial<ExtensionSettings>) => Promise<void>;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdate,
  onExport,
  onImport
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (key: keyof ExtensionSettings, value: boolean) => {
    setIsSaving(true);
    try {
      await onUpdate({ [key]: value });
    } catch (error) {
      console.error('Failed to update setting:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelect = async (key: keyof ExtensionSettings, value: string) => {
    setIsSaving(true);
    try {
      await onUpdate({ [key]: value });
    } catch (error) {
      console.error('Failed to update setting:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNumber = async (key: keyof ExtensionSettings, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setIsSaving(true);
      try {
        await onUpdate({ [key]: numValue });
      } catch (error) {
        console.error('Failed to update setting:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div>
      {/* UI Settings */}
      <div className="settings-section">
        <h3 className="settings-section-title">Interface Settings</h3>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Auto-inject floating button</div>
            <div className="settings-item-description">
              Automatically show the floating button on ChatGPT pages
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.autoInjectUI}
              onChange={(e) => handleToggle('autoInjectUI', e.target.checked)}
              disabled={isSaving}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Floating button position</div>
            <div className="settings-item-description">
              Position of the floating button on ChatGPT pages
            </div>
          </div>
          <select
            value={settings.floatingButtonPosition}
            onChange={(e) => handleSelect('floatingButtonPosition', e.target.value)}
            className="form-select"
            disabled={isSaving}
            style={{ width: '120px', fontSize: '12px' }}
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
          </select>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Enable keyboard shortcuts</div>
            <div className="settings-item-description">
              Ctrl+Shift+P: Open panel, Ctrl+Shift+U: Toggle UI
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.enableKeyboardShortcuts}
              onChange={(e) => handleToggle('enableKeyboardShortcuts', e.target.checked)}
              disabled={isSaving}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Default auto-submit</div>
            <div className="settings-item-description">
              Automatically submit prompts after insertion (can be overridden per prompt)
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.defaultAutoSubmit}
              onChange={(e) => handleToggle('defaultAutoSubmit', e.target.checked)}
              disabled={isSaving}
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

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Prompt display limit</div>
            <div className="settings-item-description">
              Maximum number of prompts to show before pagination
            </div>
          </div>
          <input
            type="number"
            value={settings.promptDisplayLimit}
            onChange={(e) => handleNumber('promptDisplayLimit', e.target.value)}
            className="form-input"
            disabled={isSaving}
            style={{ width: '70px', fontSize: '12px' }}
            min="10"
            max="200"
          />
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
            onClick={() => {
              if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                // TODO: Implement clear data
                alert('Data cleared');
              }
            }}
            disabled={isSaving}
          >
            Clear
          </button>
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <h3 className="settings-section-title">About</h3>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Version</div>
            <div className="settings-item-description">
              1.0.0
            </div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Storage usage</div>
            <div className="settings-item-description">
              All data is stored locally in your browser
            </div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Privacy</div>
            <div className="settings-item-description">
              No data is sent to external servers
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
          <div style={{ fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
            Prompt Pocket is an open-source browser extension.
            <br />
            All data is stored locally on your device.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;