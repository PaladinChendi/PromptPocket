// src/content/platforms/chatGPTDetector.ts

import { PlatformDetector, PlatformState, PlatformConfig } from './basePlatformDetector';
import { debounce } from '../../utils/dom';
import {
  findInputElement,
  fillContentEditable,
  fillTextElement,
  clickSubmitButton,
  submitViaEnter,
  matchesDomain,
  isProcessing
} from './detectorUtils';

/**
 * ChatGPT Platform Detector
 *
 * Supports:
 * - chat.openai.com
 * - chatgpt.com
 */
export class ChatGPTDetector implements PlatformDetector {
  private config: PlatformConfig = {
    name: 'ChatGPT',
    domains: ['chat.openai.com', 'chatgpt.com'],
    inputSelectors: [
      '[contenteditable="true"]:not([class*="fallback"])',
      '#prompt-textarea',
      '[data-testid="chat-input"]',
      '.ProseMirror [contenteditable="true"]',
    ],
    submitSelectors: [
      '[data-testid="send-button"]',
      'button[type="submit"]',
    ],
    processingIndicators: [
      '.animate-spin',
      '[aria-busy="true"]',
      '[data-testid="stop-button"]',
    ]
  };

  private state: PlatformState = {
    platform: 'ChatGPT',
    isChatPage: false,
    hasInputField: false,
    inputField: null,
    isProcessing: false,
    canSubmit: false,
    uiVersion: undefined
  };

  private inputElement: HTMLElement | null = null;
  private inputType: 'contenteditable' | 'textarea' | 'input' | null = null;
  private mutationObserver: MutationObserver | null = null;
  private stateChangeListeners: Array<(state: PlatformState) => void> = [];

  public initialize(): void {
    this.detectInitialState();
    this.startMonitoring();
    console.log('[ChatGPT Detector] Initialized');
  }

  public matches(): boolean {
    return matchesDomain(this.config.domains);
  }

  public getPlatformName(): string {
    return this.config.name;
  }

  public isChatPage(): boolean {
    return this.state.isChatPage;
  }

  public getState(): PlatformState {
    return { ...this.state };
  }

  public subscribe(listener: (state: PlatformState) => void): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      const index = this.stateChangeListeners.indexOf(listener);
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  public getInputField(): HTMLElement | null {
    return this.inputElement;
  }

  public fillInput(text: string, autoSubmit = false): boolean {
    console.log('[ChatGPT Detector] fillInput called, text length:', text.length);

    if (!this.inputElement) {
      console.warn('[ChatGPT Detector] No input element found, re-detecting...');
      this.findInput();
    }

    if (!this.inputElement) {
      console.error('[ChatGPT Detector] Still no input element found!');
      return false;
    }

    try {
      let success = false;

      if (this.inputType === 'contenteditable') {
        console.log('[ChatGPT Detector] Filling contenteditable');
        success = fillContentEditable(this.inputElement, text);
      } else if (this.inputType === 'textarea' || this.inputType === 'input') {
        console.log('[ChatGPT Detector] Filling text element:', this.inputType);
        success = fillTextElement(this.inputElement as HTMLTextAreaElement | HTMLInputElement, text);
      }

      if (success && autoSubmit) {
        setTimeout(() => this.submit(), 200);
      }

      return success;
    } catch (error) {
      console.error('[ChatGPT Detector] fillInput failed:', error);
      return false;
    }
  }

  public cleanup(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    this.stateChangeListeners = [];
    this.inputElement = null;
    this.inputType = null;
  }

  private detectInitialState(): void {
    const oldState = { ...this.state };

    this.state.isChatPage = this.matches();

    if (this.state.isChatPage) {
      this.state.uiVersion = this.detectUIVersion();
      this.findInput();
      this.state.hasInputField = !!this.inputElement;
      this.state.inputField = this.inputElement;
      this.state.isProcessing = isProcessing(this.config.processingIndicators);
      this.state.canSubmit = this.checkCanSubmit();
    } else {
      this.resetState();
    }

    if (this.hasStateChanged(oldState, this.state)) {
      this.notifyStateChange();
    }
  }

  private findInput(): void {
    const result = findInputElement(this.config.inputSelectors);
    if (result) {
      // Only log if the element changed
      const elementChanged = this.inputElement !== result.element || this.inputType !== result.type;
      this.inputElement = result.element;
      this.inputType = result.type;
      if (elementChanged) {
        console.log('[ChatGPT Detector] Found input element:', {
          type: this.inputType,
          className: this.inputElement.className
        });
      }
    } else if (this.inputElement) {
      // Only warn if we had an element but lost it
      console.warn('[ChatGPT Detector] Lost input element');
      this.inputElement = null;
      this.inputType = null;
    }
  }

  private detectUIVersion(): string | undefined {
    if (document.querySelector('.ProseMirror')) {
      return 'prosemirror';
    }
    if (document.querySelector('[data-testid="chat-input"]')) {
      return 'v2';
    }
    if (document.querySelector('#prompt-textarea')) {
      return 'v1';
    }
    return undefined;
  }

  private checkCanSubmit(): boolean {
    const sendButton = document.querySelector('[data-testid="send-button"]');
    if (!sendButton) return true;
    const isDisabled = sendButton.hasAttribute('disabled') ||
                       sendButton.getAttribute('aria-disabled') === 'true';
    return !isDisabled && !this.state.isProcessing;
  }

  private submit(): boolean {
    if (clickSubmitButton(this.config.submitSelectors)) {
      console.log('[ChatGPT Detector] Submit via button click');
      return true;
    }

    if (this.inputElement && submitViaEnter(this.inputElement)) {
      console.log('[ChatGPT Detector] Submit via Enter key');
      return true;
    }

    return false;
  }

  private startMonitoring(): void {
    this.setupMutationObserver();

    // Interval backup
    setInterval(() => {
      this.detectInitialState();
    }, 2000);
  }

  private setupMutationObserver(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    this.mutationObserver = new MutationObserver(
      debounce(() => {
        this.detectInitialState();
      }, 500)
    );

    // Observe more selectively to avoid excessive triggers
    // Only watch for relevant DOM changes in the chat area
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      // Remove attributes: true - this causes excessive triggers
      // Remove characterData: true - this causes excessive triggers on text changes
    });
  }

  private resetState(): void {
    this.state = {
      platform: 'ChatGPT',
      isChatPage: false,
      hasInputField: false,
      inputField: null,
      isProcessing: false,
      canSubmit: false,
      uiVersion: undefined
    };
    this.inputElement = null;
    this.inputType = null;
  }

  private hasStateChanged(oldState: PlatformState, newState: PlatformState): boolean {
    return (
      oldState.isChatPage !== newState.isChatPage ||
      oldState.hasInputField !== newState.hasInputField ||
      oldState.inputField !== newState.inputField ||
      oldState.isProcessing !== newState.isProcessing ||
      oldState.canSubmit !== newState.canSubmit ||
      oldState.uiVersion !== newState.uiVersion
    );
  }

  private notifyStateChange(): void {
    const state = this.getState();
    this.stateChangeListeners.forEach(listener => listener(state));
  }
}