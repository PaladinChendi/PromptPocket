// src/types/messages.ts

import type { PromptTemplate, ExtensionSettings, Category } from './storage';

export type MessageType =
  | 'GET_PROMPTS'
  | 'SAVE_PROMPT'
  | 'DELETE_PROMPT'
  | 'INCREMENT_USAGE'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'EXECUTE_PROMPT'
  | 'FILL_PROMPT'
  | 'GET_CATEGORIES'
  | 'SAVE_CATEGORY'
  | 'DELETE_CATEGORY'
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'CLEAR_DATA';

export interface BaseMessage<T extends MessageType, P = unknown> {
  type: T;
  payload?: P;
  requestId?: string;
}

export type GetPromptsMessage = BaseMessage<'GET_PROMPTS'>;
export interface GetPromptsResponse {
  prompts: Record<string, PromptTemplate>;
  success: boolean;
}

export interface SavePromptPayload {
  prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>;
  id?: string;
}
export type SavePromptMessage = BaseMessage<'SAVE_PROMPT', SavePromptPayload>;
export interface SavePromptResponse {
  id: string;
  success: boolean;
}

export interface DeletePromptPayload {
  id: string;
}
export type DeletePromptMessage = BaseMessage<'DELETE_PROMPT', DeletePromptPayload>;
export interface DeletePromptResponse {
  success: boolean;
}

export interface IncrementUsagePayload {
  id: string;
}
export type IncrementUsageMessage = BaseMessage<'INCREMENT_USAGE', IncrementUsagePayload>;

export type GetSettingsMessage = BaseMessage<'GET_SETTINGS'>;
export interface GetSettingsResponse {
  settings: ExtensionSettings;
  success: boolean;
}

export interface UpdateSettingsPayload {
  settings: Partial<ExtensionSettings>;
}
export type UpdateSettingsMessage = BaseMessage<'UPDATE_SETTINGS', UpdateSettingsPayload>;
export interface UpdateSettingsResponse {
  success: boolean;
}

export interface ExecutePromptPayload {
  id: string;
  /** Values for the prompt's `{{name}}` placeholders. Omitted when the prompt
   *  has none, or when the caller is inserting it unresolved. */
  variables?: Record<string, string>;
}
export type ExecutePromptMessage = BaseMessage<'EXECUTE_PROMPT', ExecutePromptPayload>;
export interface ExecutePromptResponse {
  success: boolean;
  filledContent: string;
}

export interface FillPromptPayload {
  content: string;
  id?: string;
}
export type FillPromptMessage = BaseMessage<'FILL_PROMPT', FillPromptPayload>;
export interface FillPromptResponse extends ExecutePromptResponse {}

export type GetCategoriesMessage = BaseMessage<'GET_CATEGORIES'>;
export interface GetCategoriesResponse {
  categories: Record<string, Category>;
  success: boolean;
}

export interface SaveCategoryPayload {
  category: Omit<Category, 'id' | 'createdAt' | 'promptCount'>;
  id?: string;
}
export type SaveCategoryMessage = BaseMessage<'SAVE_CATEGORY', SaveCategoryPayload>;

export interface DeleteCategoryPayload {
  id: string;
}
export type DeleteCategoryMessage = BaseMessage<'DELETE_CATEGORY', DeleteCategoryPayload>;

export type ExportDataMessage = BaseMessage<'EXPORT_DATA'>;
export interface ExportDataResponse {
  data: string;
  success: boolean;
}

export interface ImportDataPayload {
  data: string;
}
export type ImportDataMessage = BaseMessage<'IMPORT_DATA', ImportDataPayload>;
export interface ImportDataResponse {
  success: boolean;
  importedCount: number;
}

export type ClearDataMessage = BaseMessage<'CLEAR_DATA'>;
export interface ClearDataResponse {
  success: boolean;
}

// Combined type for all messages
export type Message =
  | GetPromptsMessage
  | SavePromptMessage
  | DeletePromptMessage
  | IncrementUsageMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | ExecutePromptMessage
  | FillPromptMessage
  | GetCategoriesMessage
  | SaveCategoryMessage
  | DeleteCategoryMessage
  | ExportDataMessage
  | ImportDataMessage
  | ClearDataMessage;

// Combined type for all responses (union type)
export type MessageResponse =
  | GetPromptsResponse
  | SavePromptResponse
  | DeletePromptResponse
  | GetSettingsResponse
  | UpdateSettingsResponse
  | ExecutePromptResponse
  | GetCategoriesResponse
  | ExportDataResponse
  | ImportDataResponse
  | ClearDataResponse;