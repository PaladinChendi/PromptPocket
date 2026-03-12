// src/utils/messages.ts

import { Message, MessageResponse } from '../types';

/**
 * Utility functions for message handling and communication
 */

/**
 * Send a message and wait for response
 */
export async function sendMessage(
  message: Message,
  timeout = 5000
): Promise<MessageResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Message timeout: ${message.type}`));
    }, timeout);

    chrome.runtime.sendMessage(message, (response) => {
      clearTimeout(timer);

      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response as MessageResponse);
    });
  });
}

/**
 * Send message to content script on specific tab
 */
export async function sendMessageToTab(
  tabId: number,
  message: Message,
  timeout = 5000
): Promise<MessageResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Tab message timeout: ${message.type}`));
    }, timeout);

    chrome.tabs.sendMessage(tabId, message, (response) => {
      clearTimeout(timer);

      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response as MessageResponse);
    });
  });
}

/**
 * Check if we're on a ChatGPT page
 */
export function isChatGptPage(url?: string): boolean {
  const currentUrl = url || window.location.href;
  return currentUrl.includes('chat.openai.com') || currentUrl.includes('chatgpt.com');
}

/**
 * Generate a unique request ID for tracking message responses
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Message builder helpers for type-safe message creation
 */
export const MessageBuilder = {
  getPrompts: () => ({ type: 'GET_PROMPTS' } as const),

  savePrompt: (prompt: any, id?: string) => ({
    type: 'SAVE_PROMPT',
    payload: { prompt, id }
  } as const),

  deletePrompt: (id: string) => ({
    type: 'DELETE_PROMPT',
    payload: { id }
  } as const),

  incrementUsage: (id: string) => ({
    type: 'INCREMENT_USAGE',
    payload: { id }
  } as const),

  getSettings: () => ({ type: 'GET_SETTINGS' } as const),

  updateSettings: (settings: any) => ({
    type: 'UPDATE_SETTINGS',
    payload: { settings }
  } as const),

  executePrompt: (id: string, variables?: Record<string, string>) => ({
    type: 'EXECUTE_PROMPT',
    payload: { id, variables }
  } as const),

  getCategories: () => ({ type: 'GET_CATEGORIES' } as const),

  saveCategory: (category: any, id?: string) => ({
    type: 'SAVE_CATEGORY',
    payload: { category, id }
  } as const),

  deleteCategory: (id: string) => ({
    type: 'DELETE_CATEGORY',
    payload: { id }
  } as const),

  exportData: (format: 'json' = 'json') => ({
    type: 'EXPORT_DATA',
    payload: { format }
  } as const),

  importData: (data: string, format: 'json' = 'json') => ({
    type: 'IMPORT_DATA',
    payload: { data, format }
  } as const)
};

/**
 * Error response helper
 */
export function createErrorResponse(error: Error | string) {
  return {
    success: false,
    error: error instanceof Error ? error.message : error
  };
}

/**
 * Success response helper
 */
export function createSuccessResponse<T = unknown>(data?: T) {
  return {
    success: true,
    ...(data && { data })
  };
}