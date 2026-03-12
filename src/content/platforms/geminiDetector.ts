// src/content/platforms/geminiDetector.ts

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
 * Gemini Platform Detector
 *
 * Gemini is Google's AI assistant
 * Accessible at: gemini.google.com
 */
export class GeminiDetector implements PlatformDetector {
  private config: PlatformConfig = {
    name: 'Gemini',
    domains: ['gemini.google.com', 'bard.google.com'],
    inputSelectors: [
      // Gemini uses a rich text editor with contenteditable
      '[contenteditable="true"]',
      '.ql-editor[contenteditable="true"]',
      '[placeholder*="Enter a prompt"]',
      '[placeholder*="Enter prompt"]',
      'textarea[placeholder*="Enter"]',
      '[rich-textarea]',
      'div.textarea-content',
      '[data-testid="prompt-textarea"]',
    ],
    submitSelectors: [
      'button[type="submit"]',
      '.send-button',
      'button[class*="send"]',
      'button:has(.material-icon)',
      '[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="提交"]',
    ],
    processingIndicators: [
      '.loading',
      '.loading-spinner',
      '[data-loading="true"]',
      '[aria-busy="true"]',
      '.is-generating',
      '[class*="generating"]',
    ]
  };

  private state: PlatformState = {
    platform: 'Gemini',
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
    console.log('[Gemini Detector] Initialized');
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
    console.log('[Gemini Detector] fillInput called, text length:', text.length);

    if (!this.inputElement) {
      console.warn('[Gemini Detector] No input element found, re-detecting...');
      this.findInput();
    }

    if (!this.inputElement) {
      console.error('[Gemini Detector] Still no input element found!');
      return false;
    }

    try {
      let success = false;

      if (this.inputType === 'contenteditable') {
        console.log('[Gemini Detector] Filling contenteditable');
        success = fillContentEditable(this.inputElement, text);
      } else if (this.inputType === 'textarea' || this.inputType === 'input') {
        console.log('[Gemini Detector] Filling text element:', this.inputType);
        success = fillTextElement(this.inputElement as HTMLTextAreaElement | HTMLInputElement, text);
      }

      if (success && autoSubmit) {
        setTimeout(() => this.submit(), 200);
      }

      return success;
    } catch (error) {
      console.error('[Gemini Detector] fillInput failed:', error);
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
        console.log('[Gemini Detector] Found input element:', {
          type: this.inputType,
          className: this.inputElement.className
        });
      }
    } else if (this.inputElement) {
      // Only warn if we had an element but lost it
      console.warn('[Gemini Detector] Lost input element');
      this.inputElement = null;
      this.inputType = null;
    }
  }

  private detectUIVersion(): string | undefined {
    // Gemini uses Quill.js editor
    if (document.querySelector('.ql-editor')) {
      return 'quill';
    }
    return undefined;
  }

  private checkCanSubmit(): boolean {
    const sendButton = document.querySelector('.send-button, button[type="submit"]');
    if (sendButton) {
      const isDisabled = sendButton.hasAttribute('disabled') ||
                         sendButton.getAttribute('aria-disabled') === 'true';
      return !isDisabled && !this.state.isProcessing;
    }
    return true;
  }

  private submit(): boolean {
    if (clickSubmitButton(this.config.submitSelectors)) {
      console.log('[Gemini Detector] Submit via button click');
      return true;
    }

    if (this.inputElement && submitViaEnter(this.inputElement)) {
      console.log('[Gemini Detector] Submit via Enter key');
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
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private resetState(): void {
    this.state = {
      platform: 'Gemini',
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