// src/background/background.ts

import { StorageManager } from '../storage/storage';
import { Message, MessageResponse } from '../types';

/**
 * Background service worker for Prompt Pocket
 *
 * Responsibilities:
 * 1. Initialize storage on extension install/update
 * 2. Handle messages between popup and content scripts
 * 3. Manage extension lifecycle
 * 4. Coordinate data storage operations
 */

class BackgroundService {
  private storageManager: StorageManager;
  private isInitialized = false;

  constructor() {
    this.storageManager = StorageManager.getInstance();
  }

  /**
   * Initialize the background service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Setup message handlers FIRST BEFORE storage is ready
      // This ensures early messages are properly handled
      this.setupMessageHandlers();
      this.setupLifecycleHandlers();

      // Then initialize storage
      await this.storageManager.initialize();

      console.log('ChatGPT Prompt Assistant background service initialized');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize background service:', error);
      throw error;
    }
  }

  /**
   * Setup message handlers for communication between components
   */
  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
      // Handle message asynchronously
      this.handleMessage(message, sender)
        .then(response => sendResponse(response))
        .catch(error => {
          console.error('Message handling error:', error);
          sendResponse({ success: false, error: error.message });
        });

      // Return true to indicate async response
      return true;
    });
  }

  /**
   * Setup extension lifecycle handlers
   */
  private setupLifecycleHandlers(): void {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener(async (details) => {
      console.log('Extension installed/updated:', details.reason);

      if (details.reason === 'install') {
        await this.onExtensionInstall();
      } else if (details.reason === 'update') {
        await this.onExtensionUpdate(details.previousVersion);
      }
    });

    // Handle extension startup
    chrome.runtime.onStartup.addListener(() => {
      console.log('Extension started');
    });
  }

  /**
   * Handle extension installation
   */
  private async onExtensionInstall(): Promise<void> {
    // Create default categories
    const defaultCategories = [
      { name: 'Writing', color: '#4CAF50', description: 'Writing and content creation prompts' },
      { name: 'Coding', color: '#2196F3', description: 'Programming and code-related prompts' },
      { name: 'Analysis', color: '#9C27B0', description: 'Data analysis and research prompts' },
      { name: 'Creative', color: '#FF9800', description: 'Creative brainstorming prompts' },
      { name: 'Learning', color: '#00BCD4', description: 'Educational and learning prompts' }
    ];

    for (const category of defaultCategories) {
      await this.storageManager.saveCategory(category);
    }

    // Create welcome prompt
    const welcomePrompt = {
      title: 'Welcome to ChatGPT Prompt Assistant!',
      content: 'This is your first prompt template. Edit it to create useful templates for ChatGPT.',
      description: 'Get started with prompt templates',
      tags: ['welcome', 'tutorial'],
      autoSubmit: false,
      variables: []
    };

    await this.storageManager.savePrompt(welcomePrompt);
  }

  /**
   * Handle extension update
   */
  private async onExtensionUpdate(previousVersion?: string): Promise<void> {
    console.log(`Updated from version ${previousVersion || 'unknown'}`);
    // Any update-specific logic goes here
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(
    message: Message,
    sender: chrome.runtime.MessageSender
  ): Promise<MessageResponse> {
    console.log('Background received message:', message.type, message.payload);

    switch (message.type) {
      case 'GET_PROMPTS': {
        const prompts = await this.storageManager.getPrompts();
        return { prompts, success: true } as MessageResponse;
      }

      case 'SAVE_PROMPT': {
        const { prompt, id } = message.payload!;
        console.log('Saving prompt:', prompt.title);
        const promptId = await this.storageManager.savePrompt(prompt, id);
        return { id: promptId, success: true } as MessageResponse;
      }

      case 'DELETE_PROMPT': {
        const { id } = message.payload!;
        const success = await this.storageManager.deletePrompt(id);
        return { success } as MessageResponse;
      }

      case 'INCREMENT_USAGE': {
        const { id } = message.payload!;
        await this.storageManager.incrementUsage(id);
        return { success: true } as MessageResponse;
      }

      case 'GET_SETTINGS': {
        const settings = await this.storageManager.getSettings();
        return { settings, success: true } as MessageResponse;
      }

      case 'UPDATE_SETTINGS': {
        const { settings } = message.payload!;
        await this.storageManager.updateSettings(settings);
        return { success: true } as MessageResponse;
      }

      case 'EXECUTE_PROMPT': {
        // Forward EXECUTE_PROMPT to the active tab's content script
        const { id, variables } = message.payload!;

        console.log('EXECUTE_PROMPT received:', { id, variables });

        // Get the prompt data to validate it exists
        const prompt = await this.storageManager.getPrompt(id);
        if (!prompt) {
          throw new Error(`Prompt with ID ${id} not found`);
        }

        // Process variables in the prompt content
        let filledContent = prompt.content;
        if (variables) {
          for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            filledContent = filledContent.replace(new RegExp(placeholder, 'g'), value || '');
          }
        }

        console.log('Processed content:', { length: filledContent.length, autoSubmit: prompt.autoSubmit });

        // Forward to content script on active tab with processed content
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0 || tabs[0].id === undefined) {
          throw new Error('No active tab found');
        }

        const activeTab = tabs[0];
        const tabId = activeTab.id!; // Safe to use non-null assertion after the check

        console.log('Active tab:', { id: tabId, url: activeTab.url });

        // Check if tab is a supported AI page
        const isSupportedPage = activeTab.url &&
          (activeTab.url.includes('chat.openai.com') ||
           activeTab.url.includes('chatgpt.com') ||
           activeTab.url.includes('doubao.com') ||
           activeTab.url.includes('gemini.google.com'));

        if (!isSupportedPage) {
          const supportedSites = 'chatgpt.com, doubao.com, or gemini.google.com';
          throw new Error(`This page (${activeTab.url}) is not a supported AI page. Please navigate to ${supportedSites}`);
        }

        try {
          // First, ping the content script to make sure it's running
          try {
            console.log('Pinging content script...');
            const pingResponse = await chrome.tabs.sendMessage(tabId, {
              type: 'PING',
              payload: {}
            });
            console.log('Ping response:', pingResponse);
          } catch (pingError) {
            console.error('Content script ping failed:', pingError);
            throw new Error('Content script is not responding. Please refresh the page and try again.');
          }

          // Send a modified message with the processed content
          const executionMessage = {
            type: 'FILL_PROMPT',
            payload: {
              content: filledContent,
              autoSubmit: prompt.autoSubmit,
              id: id  // Include ID for usage tracking
            }
          };
          console.log('Sending FILL_PROMPT to content script...');
          const response = await chrome.tabs.sendMessage(tabId, executionMessage) as MessageResponse;
          console.log('FILL_PROMPT response:', response);
          return response;
        } catch (error: any) {
          console.error('Failed to send to content script:', error);
          const errorMessage = error?.message || String(error);
          throw new Error(`Failed to execute prompt: ${errorMessage}`);
        }
      }

      case 'GET_CATEGORIES': {
        const categories = await this.storageManager.getCategories();
        return { categories, success: true } as MessageResponse;
      }

      case 'SAVE_CATEGORY': {
        const { category, id } = message.payload!;
        const categoryId = await this.storageManager.saveCategory(category, id);
        return { id: categoryId, success: true } as MessageResponse;
      }

      case 'DELETE_CATEGORY': {
        const { id } = message.payload!;
        const success = await this.storageManager.deleteCategory(id);
        return { success } as MessageResponse;
      }

      case 'EXPORT_DATA': {
        const data = await this.storageManager.exportData();
        return { data, success: true } as MessageResponse;
      }

      case 'IMPORT_DATA': {
        const { data } = message.payload!;
        const result = await this.storageManager.importData(data);
        return { ...result } as MessageResponse;
      }

      default:
        throw new Error(`Unknown message type: ${(message as any).type}`);
    }
  }

  /**
   * Send message to content script on active tab
   */
  public async sendToContentScript(
    message: Message,
    tabId?: number
  ): Promise<MessageResponse | null> {
    try {
      // If no tabId provided, get active tab
      let targetTabId = tabId;
      if (!targetTabId) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) return null;
        targetTabId = tabs[0].id;
      }

      if (targetTabId === undefined) return null;

      const response = await chrome.tabs.sendMessage(targetTabId, message);
      return response as MessageResponse;
    } catch (error) {
      console.error('Failed to send message to content script:', error);
      return null;
    }
  }

  /**
   * Send message to popup
   */
  public async sendToPopup(
    message: Message
  ): Promise<MessageResponse | null> {
    try {
      const response = await chrome.runtime.sendMessage(message);
      return response as MessageResponse;
    } catch (error) {
      // Popup might not be open, which is fine
      return null;
    }
  }
}

// Initialize the service when background script loads
const backgroundService = new BackgroundService();
backgroundService.initialize().catch(console.error);

// Export for testing or other modules
export default backgroundService;