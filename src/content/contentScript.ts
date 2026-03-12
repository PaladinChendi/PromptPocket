// src/content/contentScript.ts

import { PlatformDetector, PlatformState } from './platforms';
import { getPlatformDetector, getPlatformName, getSupportedPlatforms, DetectorFactory } from './platforms/detectorFactory';
import { UIInjector } from './uiInjector';
import { sendMessage, MessageBuilder } from '../utils/messages';

/**
 * Main Content Script for Prompt Pocket
 *
 * This script:
 * 1. Detects supported AI platforms (ChatGPT, Doubao, Gemini, etc.)
 * 2. Monitors DOM for changes
 * 3. Injects floating UI
 * 4. Handles communication with background script
 * 5. Executes prompt insertion
 */

class ContentScript {
  private detector: PlatformDetector | null = null;
  private uiInjector: UIInjector | null = null;
  private isInitialized = false;
  private monitoringInterval: number | null = null;

  /**
   * Initialize content script
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Detect which platform we're on
      this.detectPlatform();

      // Setup message listeners
      this.setupMessageListeners();

      // Start monitoring for platform changes
      this.startMonitoring();

      this.isInitialized = true;
      console.log('[Prompt Pocket] Content script initialized, supported platforms:', getSupportedPlatforms());
    } catch (error) {
      console.error('[Prompt Pocket] Failed to initialize content script:', error);
      throw error;
    }
  }

  /**
   * Detect and initialize the platform detector
   */
  private detectPlatform(): void {
    const newDetector = getPlatformDetector();

    // Clean up old detector if platform changed
    if (this.detector && newDetector && this.detector.getPlatformName() !== newDetector.getPlatformName()) {
      console.log('[Prompt Pocket] Platform changed, cleaning up old detector');
      this.detector.cleanup();
      if (this.uiInjector) {
        this.uiInjector.cleanup();
        this.uiInjector = null;
      }
    }

    this.detector = newDetector;

    if (this.detector) {
      console.log('[Prompt Pocket] Detected platform:', this.detector.getPlatformName());
      this.detector.initialize();

      // Initialize UI injector with the new detector
      if (!this.uiInjector) {
        this.uiInjector = new UIInjector(this.detector);
        this.uiInjector.initialize();
      }
    } else {
      console.log('[Prompt Pocket] No supported platform detected');
      if (this.uiInjector) {
        this.uiInjector.cleanup();
        this.uiInjector = null;
      }
    }
  }

  /**
   * Setup message listeners for communication
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender)
        .then(response => sendResponse(response))
        .catch(error => {
          console.error('[Prompt Pocket] Message handling error:', error);
          sendResponse({ success: false, error: error.message });
        });

      return true; // Indicates async response
    });
  }

  /**
   * Start monitoring platform changes
   */
  private startMonitoring(): void {
    // Check platform periodically in case of navigation
    this.monitoringInterval = setInterval(() => {
      const currentPlatform = getPlatformName();
      const activePlatform = this.detector?.getPlatformName() || null;

      if (currentPlatform !== activePlatform) {
        console.log('[Prompt Pocket] Platform change detected, re-detecting...');
        this.detectPlatform();
      }
    }, 3000);
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(message: any, sender: chrome.runtime.MessageSender) {
    console.log('[Prompt Pocket] Received message:', message.type, message.payload);

    // Check if we have a detector
    if (!this.detector) {
      return {
        success: false,
        error: 'No supported platform detected. Please open a supported AI platform (ChatGPT, Doubao, or Gemini)'
      };
    }

    switch (message.type) {
      case 'PING': {
        console.log('[Prompt Pocket] PING received');
        return {
          success: true,
          message: 'Content script is running',
          platform: this.detector.getPlatformName()
        };
      }

      case 'FILL_PROMPT': {
        const { content, autoSubmit, id } = message.payload;

        console.log('[Prompt Pocket] FILL_PROMPT received:', {
          contentLength: content?.length,
          autoSubmit,
          id,
          platform: this.detector.getPlatformName()
        });

        try {
          const success = this.detector.fillInput(content, autoSubmit);

          console.log('[Prompt Pocket] fillInput result:', success);

          if (success && id) {
            await sendMessage(MessageBuilder.incrementUsage(id));
          }

          return {
            success,
            filledContent: content,
            platform: this.detector.getPlatformName()
          };
        } catch (error) {
          console.error('[Prompt Pocket] Failed to fill prompt:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      case 'EXECUTE_PROMPT': {
        const { id, variables } = message.payload;

        try {
          const response = await sendMessage(MessageBuilder.getPrompts());
          const prompt = (response as { prompts?: Record<string, any> }).prompts?.[id];

          if (!prompt) {
            throw new Error(`Prompt with ID ${id} not found`);
          }

          let content = prompt.content;
          if (variables) {
            for (const [key, value] of Object.entries(variables)) {
              const placeholder = `{{${key}}}`;
              content = content.replace(new RegExp(placeholder, 'g'), value || '');
            }
          }

          const success = this.detector.fillInput(content, prompt.autoSubmit);

          if (success) {
            await sendMessage(MessageBuilder.incrementUsage(id));
          }

          return {
            success,
            filledContent: content,
            platform: this.detector.getPlatformName()
          };
        } catch (error) {
          console.error('[Prompt Pocket] Failed to execute prompt:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      case 'GET_PROMPTS': {
        try {
          const response = await sendMessage(MessageBuilder.getPrompts());
          return { ...response, platform: this.detector.getPlatformName() };
        } catch (error) {
          console.error('[Prompt Pocket] Failed to get prompts:', error);
          return { prompts: {}, success: false };
        }
      }

      case 'GET_SETTINGS': {
        try {
          const response = await sendMessage(MessageBuilder.getSettings());
          return { ...response, platform: this.detector.getPlatformName() };
        } catch (error) {
          console.error('[Prompt Pocket] Failed to get settings:', error);
          return { settings: {}, success: false };
        }
      }

      case 'GET_PLATFORM_INFO': {
        return {
          success: true,
          platform: this.detector.getPlatformName(),
          state: this.detector.getState(),
          supportedPlatforms: getSupportedPlatforms()
        };
      }

      default:
        console.log('[Prompt Pocket] Unknown message type:', message.type);
        return { success: false, error: 'Unknown message type' };
    }
  }

  /**
   * Get current page state
   */
  public getPageState(): PlatformState | null {
    return this.detector ? this.detector.getState() : null;
  }

  /**
   * Check if current page is a supported platform
   */
  public isSupportedPlatform(): boolean {
    return this.detector !== null;
  }

  /**
   * Get the current platform name
   */
  public getPlatformName(): string | null {
    return this.detector ? this.detector.getPlatformName() : null;
  }

  /**
   * Execute a prompt by ID
   */
  public async executePrompt(promptId: string, variables?: Record<string, string>): Promise<boolean> {
    if (!this.detector) return false;

    try {
      const response = await sendMessage(MessageBuilder.executePrompt(promptId, variables));
      return (response as { success: boolean }).success;
    } catch (error) {
      console.error('[Prompt Pocket] Failed to execute prompt:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.detector) {
      this.detector.cleanup();
      this.detector = null;
    }
    if (this.uiInjector) {
      this.uiInjector.cleanup();
      this.uiInjector = null;
    }
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isInitialized = false;
  }
}

// Initialize content script when page loads
const contentScript = new ContentScript();

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    contentScript.initialize().catch(console.error);
  }
});

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    contentScript.initialize().catch(console.error);
  });
} else {
  contentScript.initialize().catch(console.error);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  contentScript.cleanup();
});

// Export for testing if needed
export default contentScript;