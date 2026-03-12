// src/content/platforms/basePlatformDetector.ts

/**
 * Base interface for all platform detectors
 * Each AI platform (ChatGPT, Doubao, Gemini, etc.) will implement this interface
 */
export interface PlatformDetector {
  /**
   * Initialize the detector
   */
  initialize(): void;

  /**
   * Check if current page matches this platform
   */
  matches(): boolean;

  /**
   * Get the platform name
   */
  getPlatformName(): string;

  /**
   * Check if this is a chat page
   */
  isChatPage(): boolean;

  /**
   * Get the current state of the platform UI
   */
  getState(): PlatformState;

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: PlatformState) => void): () => void;

  /**
   * Fill text into the input field
   */
  fillInput(text: string, autoSubmit?: boolean): boolean;

  /**
   * Get the input element (for debugging/testing)
   */
  getInputField(): HTMLElement | null;

  /**
   * Cleanup resources
   */
  cleanup(): void;
}

/**
 * Common state structure for all platforms
 */
export interface PlatformState {
  platform: string;
  isChatPage: boolean;
  hasInputField: boolean;
  inputField?: HTMLElement | null;
  isProcessing: boolean;
  canSubmit: boolean;
  uiVersion?: string;
}

/**
 * Configuration for a platform
 */
export interface PlatformConfig {
  name: string;
  domains: string[];
  inputSelectors: string[];
  submitSelectors: string[];
  processingIndicators: string[];
}

/**
 * Result of finding an input element
 */
export interface InputElementResult {
  element: HTMLElement;
  type: 'contenteditable' | 'textarea' | 'input';
}