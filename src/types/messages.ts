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
  | 'IMPORT_DATA';

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
  variables?: Record<string, string>;
}
export type ExecutePromptMessage = BaseMessage<'EXECUTE_PROMPT', ExecutePromptPayload>;
export interface ExecutePromptResponse {
  success: boolean;
  filledContent: string;
}

export interface FillPromptPayload {
  content: string;
  autoSubmit?: boolean;
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

export interface ExportDataPayload {
  format: 'json';
}
export type ExportDataMessage = BaseMessage<'EXPORT_DATA', ExportDataPayload>;
export interface ExportDataResponse {
  data: string;
  success: boolean;
}

export interface ImportDataPayload {
  data: string;
  format: 'json';
}
export type ImportDataMessage = BaseMessage<'IMPORT_DATA', ImportDataPayload>;
export interface ImportDataResponse {
  success: boolean;
  importedCount: number;
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
  | ImportDataMessage;

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
  | ImportDataResponse;

// Helper type guards for type narrowing
export function isGetPromptsResponse(response: MessageResponse): response is GetPromptsResponse {
  return 'prompts' in response;
}

export function isGetSettingsResponse(response: MessageResponse): response is GetSettingsResponse {
  return 'settings' in response;
}

export function isGetCategoriesResponse(response: MessageResponse): response is GetCategoriesResponse {
  return 'categories' in response;
}

export function isExportDataResponse(response: MessageResponse): response is ExportDataResponse {
  return 'data' in response && !('filledContent' in response);
}

export function isImportDataResponse(response: MessageResponse): response is ImportDataResponse {
  return 'importedCount' in response;
}