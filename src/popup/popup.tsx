// src/popup/popup.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { PromptTemplate, Category, ExtensionSettings } from '../types';
import { sendMessage, MessageBuilder } from '../utils/messages';
import PromptList from './components/PromptList';
import PromptEditor from './components/PromptEditor';
import CategoryManager from './components/CategoryManager';
import Settings from './components/Settings';
import './styles/popup.css';

type Tab = 'prompts' | 'categories' | 'settings';

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('prompts');
  const [prompts, setPrompts] = useState<Record<string, PromptTemplate>>({});
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load prompts, categories, and settings in parallel
      const [promptsResponse, categoriesResponse, settingsResponse] = await Promise.all([
        sendMessage(MessageBuilder.getPrompts()),
        sendMessage(MessageBuilder.getCategories()),
        sendMessage(MessageBuilder.getSettings())
      ]);

      setPrompts((promptsResponse as { prompts?: Record<string, PromptTemplate> }).prompts || {});
      setCategories((categoriesResponse as { categories?: Record<string, Category> }).categories || {});
      setSettings((settingsResponse as { settings?: ExtensionSettings }).settings ?? null);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async (prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>, id?: string) => {
    try {
      const response = await sendMessage(MessageBuilder.savePrompt(prompt, id));
      console.log('Save prompt response:', response);

      if ((response as { success: boolean }).success) {
        await loadData(); // Refresh data
        setIsEditorOpen(false);
        setEditingPrompt(null);
      } else {
        alert('Failed to save prompt. The server returned an error.');
      }
    } catch (error) {
      console.error('Failed to save prompt:', error);
      alert('Failed to save prompt: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const response = await sendMessage(MessageBuilder.deletePrompt(id));

      if ((response as { success: boolean }).success) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert('Failed to delete prompt');
    }
  };

  const handleExecutePrompt = async (id: string) => {
    try {
      const prompt = prompts[id];
      if (!prompt) return;

      // If prompt has variables, show editor
      if (prompt.variables && prompt.variables.length > 0) {
        setEditingPrompt(prompt);
        setIsEditorOpen(true);
        return;
      }

      // Otherwise execute directly
      const response = await sendMessage(MessageBuilder.executePrompt(id));

      if ((response as { success: boolean }).success) {
        // Close popup after execution
        window.close();
      } else {
        alert('Failed to execute prompt. Make sure you are on a supported AI page.');
      }
    } catch (error) {
      console.error('Failed to execute prompt:', error);
      alert('Failed to execute prompt');
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<ExtensionSettings>) => {
    try {
      await sendMessage(MessageBuilder.updateSettings(newSettings));
      await loadData(); // Refresh settings
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const handleExportData = async () => {
    try {
      const response = await sendMessage(MessageBuilder.exportData());

      // Create and download file
      const blob = new Blob([(response as { data: string }).data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-pocket-prompts-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('This will replace all your current prompts and categories. Continue?')) {
      return;
    }

    try {
      const text = await file.text();
      const response = await sendMessage(MessageBuilder.importData(text));

      if ((response as { success: boolean }).success) {
        alert(`Successfully imported ${(response as { importedCount: number }).importedCount} items`);
        await loadData();
      } else {
        alert('Failed to import data. Please check the file format.');
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      alert('Failed to import data');
    }

    // Reset file input
    event.target.value = '';
  };

  const handleNewPrompt = () => {
    setEditingPrompt(null);
    setIsEditorOpen(true);
  };

  const handleEditPrompt = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    setIsEditorOpen(true);
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="popup-container">
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <div className="empty-state-title">Error</div>
          <div className="empty-state-description">{error}</div>
          <button className="btn btn-primary" onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div>
          <h1 className="popup-title">Prompt Pocket</h1>
          <div className="popup-subtitle">Manage your AI prompts</div>
        </div>
      </header>

      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          Prompts
        </button>
        <button
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <main className="popup-content">
        {activeTab === 'prompts' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', margin: 0 }}>Your Prompts</h2>
              <button className="btn btn-primary btn-sm" onClick={handleNewPrompt}>
                + New Prompt
              </button>
            </div>

            <PromptList
              prompts={prompts}
              categories={categories}
              onExecute={handleExecutePrompt}
              onEdit={handleEditPrompt}
              onDelete={handleDeletePrompt}
            />
          </>
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            prompts={prompts}
            onUpdate={loadData}
          />
        )}

        {activeTab === 'settings' && settings && (
          <Settings
            settings={settings}
            onUpdate={handleUpdateSettings}
            onExport={handleExportData}
            onImport={handleImportData}
          />
        )}
      </main>

      {isEditorOpen && (
        <PromptEditor
          prompt={editingPrompt}
          categories={categories}
          onSave={handleSavePrompt}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingPrompt(null);
          }}
        />
      )}
    </div>
  );
};

// Initialize React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}

export default Popup;