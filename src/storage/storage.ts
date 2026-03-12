// src/storage/storage.ts

import { StorageData, DEFAULT_STORAGE_DATA, PromptTemplate, Category, ExtensionSettings } from '../types';
import { migrationManager } from './migrations';

export class StorageManager {
  private static instance: StorageManager;
  private initialized = false;
  private listeners: Array<(data: StorageData) => void> = [];

  private constructor() {}

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Initialize storage with default data if empty
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const data = await this.getStorageData();
    if (!data || !data.version) {
      await this.setStorageData(DEFAULT_STORAGE_DATA);
    }

    // Set up storage change listener
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.storageData) {
        const newData = changes.storageData.newValue as StorageData;
        this.notifyListeners(newData);
      }
    });

    this.initialized = true;
  }

  /**
   * Subscribe to storage changes
   */
  public subscribe(listener: (data: StorageData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(data: StorageData): void {
    this.listeners.forEach(listener => listener(data));
  }

  /**
   * Get all storage data with migration support
   */
  public async getStorageData(): Promise<StorageData> {
    const result = await chrome.storage.local.get('storageData');

    // If no data exists, return defaults
    if (!result.storageData) {
      return DEFAULT_STORAGE_DATA;
    }

    try {
      // Apply migrations if needed
      const migratedData = await migrationManager.migrate(result.storageData);
      return migratedData;
    } catch (error) {
      console.error('Migration failed, returning default data:', error);
      return DEFAULT_STORAGE_DATA;
    }
  }

  /**
   * Set all storage data
   */
  public async setStorageData(data: StorageData): Promise<void> {
    await chrome.storage.local.set({ storageData: data });
  }

  /**
   * Update storage data partially
   */
  public async updateStorageData(updates: Partial<StorageData>): Promise<void> {
    const currentData = await this.getStorageData();
    const newData = { ...currentData, ...updates };
    await this.setStorageData(newData);
  }

  // Prompt management
  public async getPrompts(): Promise<Record<string, PromptTemplate>> {
    const data = await this.getStorageData();
    return data.prompts;
  }

  public async getPrompt(id: string): Promise<PromptTemplate | null> {
    const prompts = await this.getPrompts();
    return prompts[id] || null;
  }

  public async savePrompt(prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>, id?: string): Promise<string> {
    const prompts = await this.getPrompts();
    const promptId = id || this.generateId();
    const now = Date.now();

    const newPrompt: PromptTemplate = {
      ...prompt,
      id: promptId,
      createdAt: id && prompts[id] ? prompts[id].createdAt : now,
      updatedAt: now,
      usageCount: id && prompts[id] ? prompts[id].usageCount : 0
    };

    const newPrompts = { ...prompts, [promptId]: newPrompt };
    await this.updateStorageData({ prompts: newPrompts });

    return promptId;
  }

  public async deletePrompt(id: string): Promise<boolean> {
    const prompts = await this.getPrompts();
    if (!prompts[id]) return false;

    const newPrompts = { ...prompts };
    delete newPrompts[id];
    await this.updateStorageData({ prompts: newPrompts });

    return true;
  }

  public async incrementUsage(id: string): Promise<void> {
    const prompt = await this.getPrompt(id);
    if (!prompt) return;

    const updatedPrompt = {
      ...prompt,
      usageCount: prompt.usageCount + 1,
      updatedAt: Date.now()
    };

    const prompts = await this.getPrompts();
    await this.updateStorageData({
      prompts: { ...prompts, [id]: updatedPrompt }
    });
  }

  // Category management
  public async getCategories(): Promise<Record<string, Category>> {
    const data = await this.getStorageData();
    return data.categories;
  }

  public async getCategory(id: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories[id] || null;
  }

  public async saveCategory(category: Omit<Category, 'id' | 'createdAt' | 'promptCount'>, id?: string): Promise<string> {
    const categories = await this.getCategories();
    const categoryId = id || this.generateId();
    const now = Date.now();

    const newCategory: Category = {
      ...category,
      id: categoryId,
      createdAt: id && categories[id] ? categories[id].createdAt : now,
      promptCount: id && categories[id] ? categories[id].promptCount : 0
    };

    const newCategories = { ...categories, [categoryId]: newCategory };
    await this.updateStorageData({ categories: newCategories });

    return categoryId;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const categories = await this.getCategories();
    if (!categories[id]) return false;

    // Remove category from prompts that use it
    const prompts = await this.getPrompts();
    const updatedPrompts = { ...prompts };
    Object.values(updatedPrompts).forEach(prompt => {
      if (prompt.category === id) {
        updatedPrompts[prompt.id] = { ...prompt, category: undefined };
      }
    });

    const newCategories = { ...categories };
    delete newCategories[id];

    await this.updateStorageData({
      categories: newCategories,
      prompts: updatedPrompts
    });

    return true;
  }

  // Settings management
  public async getSettings(): Promise<ExtensionSettings> {
    const data = await this.getStorageData();
    return data.settings;
  }

  public async updateSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    await this.updateStorageData({ settings: newSettings });
  }

  // Data export/import
  public async exportData(): Promise<string> {
    const data = await this.getStorageData();
    return JSON.stringify(data, null, 2);
  }

  public async importData(jsonData: string): Promise<{ success: boolean; importedCount: number }> {
    try {
      const importedData = JSON.parse(jsonData) as StorageData;

      // Validate imported data structure
      if (!this.validateStorageData(importedData)) {
        throw new Error('Invalid data format');
      }

      await this.setStorageData(importedData);

      const promptCount = Object.keys(importedData.prompts).length;
      const categoryCount = Object.keys(importedData.categories).length;

      return {
        success: true,
        importedCount: promptCount + categoryCount
      };
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, importedCount: 0 };
    }
  }

  // Utility methods
  private generateId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateStorageData(data: unknown): data is StorageData {
    if (!data || typeof data !== 'object') return false;

    const d = data as Partial<StorageData>;
    return (
      typeof d.version === 'string' &&
      typeof d.settings === 'object' &&
      typeof d.prompts === 'object' &&
      typeof d.categories === 'object'
    );
  }

  // Cleanup
  public async clearAllData(): Promise<void> {
    await chrome.storage.local.clear();
    await this.initialize();
  }
}