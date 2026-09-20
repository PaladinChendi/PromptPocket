// src/types/index.ts

export * from './storage';
export * from './messages';

// Import types from storage.ts to ensure they're available
import type {
  PromptTemplate,
  Category,
  ExtensionSettings,
  StorageData
} from './storage';

import {
  DEFAULT_STORAGE_DATA,
  DEFAULT_SETTINGS
} from './storage';

import type {
  Message,
  MessageType,
  MessageResponse
} from './messages';

// Re-export everything
export {
  type PromptTemplate,
  type Category,
  type ExtensionSettings,
  type StorageData,
  DEFAULT_SETTINGS,
  DEFAULT_STORAGE_DATA,
  type Message,
  type MessageType,
  type MessageResponse
};
