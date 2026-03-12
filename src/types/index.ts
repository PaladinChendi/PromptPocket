// src/types/index.ts

export * from './storage';
export * from './messages';

export interface ChatGptUIState {
  isChatPage: boolean;
  hasInputField: boolean;
  inputField?: HTMLTextAreaElement | null;
  isThinking: boolean;
  canSubmit: boolean;
  uiVersion?: string;
}

export interface FloatingUIState {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedPromptId?: string;
  isDragging: boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: unknown;
  source: string;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// Import types from storage.ts to ensure they're available
import type {
  PromptTemplate,
  VariableDefinition,
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
  type VariableDefinition,
  type Category,
  type ExtensionSettings,
  type StorageData,
  DEFAULT_SETTINGS,
  DEFAULT_STORAGE_DATA,
  type Message,
  type MessageType,
  type MessageResponse
};