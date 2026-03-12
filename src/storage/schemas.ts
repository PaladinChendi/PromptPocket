// src/storage/schemas.ts

import { StorageData, PromptTemplate, Category, ExtensionSettings } from '../types';

export function validatePromptTemplate(data: unknown): data is PromptTemplate {
  if (!data || typeof data !== 'object') return false;

  const template = data as Partial<PromptTemplate>;
  return (
    typeof template.id === 'string' &&
    typeof template.title === 'string' &&
    typeof template.content === 'string' &&
    Array.isArray(template.tags) &&
    typeof template.createdAt === 'number' &&
    typeof template.updatedAt === 'number' &&
    typeof template.usageCount === 'number'
  );
}

export function validateCategory(data: unknown): data is Category {
  if (!data || typeof data !== 'object') return false;

  const category = data as Partial<Category>;
  return (
    typeof category.id === 'string' &&
    typeof category.name === 'string' &&
    typeof category.createdAt === 'number' &&
    typeof category.promptCount === 'number'
  );
}

export function validateExtensionSettings(data: unknown): data is ExtensionSettings {
  if (!data || typeof data !== 'object') return false;

  const settings = data as Partial<ExtensionSettings>;
  return (
    typeof settings.autoInjectUI === 'boolean' &&
    typeof settings.showFloatingButton === 'boolean' &&
    typeof settings.floatingButtonPosition === 'string' &&
    typeof settings.enableKeyboardShortcuts === 'boolean' &&
    typeof settings.defaultAutoSubmit === 'boolean' &&
    typeof settings.theme === 'string' &&
    typeof settings.promptDisplayLimit === 'number'
  );
}

export function validateStorageData(data: unknown): data is StorageData {
  if (!data || typeof data !== 'object') return false;

  const storageData = data as Partial<StorageData>;

  if (typeof storageData.version !== 'string') return false;
  if (!validateExtensionSettings(storageData.settings)) return false;

  // Validate prompts
  if (!storageData.prompts || typeof storageData.prompts !== 'object') return false;
  for (const prompt of Object.values(storageData.prompts)) {
    if (!validatePromptTemplate(prompt)) return false;
  }

  // Validate categories
  if (!storageData.categories || typeof storageData.categories !== 'object') return false;
  for (const category of Object.values(storageData.categories)) {
    if (!validateCategory(category)) return false;
  }

  return true;
}