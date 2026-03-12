// src/types/storage.ts

export interface PromptTemplate {
  id: string;
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  autoSubmit?: boolean;
  variables?: VariableDefinition[];
}

export interface VariableDefinition {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  type?: 'text' | 'number' | 'select';
  options?: string[];
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  createdAt: number;
  promptCount: number;
}

export interface ExtensionSettings {
  autoInjectUI: boolean;
  showFloatingButton: boolean;
  floatingButtonPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  enableKeyboardShortcuts: boolean;
  defaultAutoSubmit: boolean;
  theme: 'light' | 'dark' | 'system';
  promptDisplayLimit: number;
}

export interface StorageData {
  prompts: Record<string, PromptTemplate>;
  categories: Record<string, Category>;
  settings: ExtensionSettings;
  version: string;
}

// Default storage data
export const DEFAULT_SETTINGS: ExtensionSettings = {
  autoInjectUI: true,
  showFloatingButton: true,
  floatingButtonPosition: 'bottom-right',
  enableKeyboardShortcuts: true,
  defaultAutoSubmit: false,
  theme: 'system',
  promptDisplayLimit: 50
};

export const DEFAULT_STORAGE_DATA: StorageData = {
  prompts: {},
  categories: {},
  settings: DEFAULT_SETTINGS,
  version: '1.0.0'
};