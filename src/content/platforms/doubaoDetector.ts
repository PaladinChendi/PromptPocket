// src/content/platforms/doubaoDetector.ts

import { PlatformDetector, PlatformState, PlatformConfig } from './basePlatformDetector';
import { debounce } from '../../utils/dom';
import {
  findInputElement,
  fillContentEditable,
  fillTextElement,
  matchesDomain,
  isProcessing
} from './detectorUtils';

/**
 * Doubao (豆瓣) Platform Detector
 *
 * Doubao is ByteDance's AI assistant
 * Accessible at: doubao.com, www.doubao.com, bot.doubao.com
 */
export class DoubaoDetector implements PlatformDetector {
  private config: PlatformConfig = {
    name: 'Doubao',
    domains: ['doubao.com', 'www.doubao.com', 'bot.doubao.com'],
    inputSelectors: [
      // Doubao uses contenteditable div as input
      '[contenteditable="true"]',
      // Try with common class patterns
      '[data-placeholder]',
      'div[role="textbox"]',
      // Try selector patterns that Doubao might use
      'div[placeholder*="问"]',
      'div[placeholder*="有什么"]',
      'div[placeholder*="请输入"]',
      // Fallback to textarea
      'textarea',
      'textarea[placeholder*="问"]',
      'textarea[placeholder*="有什么"]',
      'textarea[placeholder*="请输入"]',
      // Common class names
      '.chat-input',
      '.input-box',
      '#input-box',
      '[data-testid="input"]',
    ],
    processingIndicators: [
      '.loading',
      '.loading-spinner',
      '[class*="loading"]',
      '[data-loading="true"]',
      '[aria-busy="true"]',
      // Doubao specific
      'button[aria-label*="停止"]',
      'button[aria-label*="Stop"]',
    ]
  };

  private state: PlatformState = {
    platform: 'Doubao',
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
    DEBUG && console.log('[Doubao Detector] Initialized');
  }

  public matches(): boolean {
    const hostnameMatch = matchesDomain(this.config.domains);
    return hostnameMatch;
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

  public fillInput(text: string): boolean {
    DEBUG && console.log('[Doubao Detector] fillInput called, text length:', text.length);

    if (!this.inputElement) {
      DEBUG && console.warn('[Doubao Detector] No input element found, re-detecting...');
      this.findInput();
    }

    if (!this.inputElement) {
      DEBUG && console.error('[Doubao Detector] Still no input element found!');
      return false;
    }

    try {
      let success = false;

      if (this.inputType === 'contenteditable') {
        DEBUG && console.log('[Doubao Detector] Filling contenteditable');
        success = fillContentEditable(this.inputElement, text);
      } else if (this.inputType === 'textarea' || this.inputType === 'input') {
        DEBUG && console.log('[Doubao Detector] Filling text element:', this.inputType);
        success = fillTextElement(this.inputElement as HTMLTextAreaElement | HTMLInputElement, text);
      }

      return success;
    } catch (error) {
      DEBUG && console.error('[Doubao Detector] fillInput failed:', error);
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
        DEBUG && console.log('[Doubao Detector] Found input element:', {
          type: this.inputType,
          tagName: this.inputElement.tagName,
          className: this.inputElement.className,
          id: this.inputElement.id
        });
      }
    } else if (this.inputElement) {
      // Only warn if we had an element but lost it
      DEBUG && console.warn('[Doubao Detector] Lost input element');
      this.inputElement = null;
      this.inputType = null;
    }
  }

  private detectUIVersion(): string | undefined {
    // Doubao may have different UI versions, try to detect
    if (document.querySelector('textarea[placeholder*="问豆包"]')) {
      return 'v1';
    }
    return undefined;
  }

  private checkCanSubmit(): boolean {
    // Check send button
    const sendButton = document.querySelector('.send-button, button[type="submit"]');
    if (sendButton) {
      const isDisabled = sendButton.hasAttribute('disabled') ||
                         sendButton.getAttribute('aria-disabled') === 'true';
      return !isDisabled && !this.state.isProcessing;
    }
    return true;
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
      platform: 'Doubao',
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