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

  executePrompt: (id: string) => ({
    type: 'EXECUTE_PROMPT',
    payload: { id }
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

  exportData: () => ({
    type: 'EXPORT_DATA'
  } as const),

  importData: (data: string) => ({
    type: 'IMPORT_DATA',
    payload: { data }
  } as const),

  clearData: () => ({
    type: 'CLEAR_DATA'
  } as const)
};