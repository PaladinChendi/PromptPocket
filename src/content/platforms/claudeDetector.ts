// src/content/platforms/claudeDetector.ts

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
 * Claude Platform Detector
 *
 * Claude is Anthropic's AI assistant
 * Accessible at: claude.ai
 */
export class ClaudeDetector implements PlatformDetector {
  private config: PlatformConfig = {
    name: 'Claude',
    domains: ['claude.ai'],
    inputSelectors: [
      // Claude uses a ProseMirror rich text editor with contenteditable
      '.ProseMirror[contenteditable="true"]',
      '[contenteditable="true"]',
      '[contenteditable][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="How can I help"]',
      'textarea[placeholder*="Reply to Claude"]',
      'textarea',
    ],
    processingIndicators: [
      // While generating, Claude shows a stop button
      '[aria-label*="Stop"]',
      'button[aria-label*="stop"]',
      '.loading',
      '.loading-spinner',
      '[data-loading="true"]',
      '[aria-busy="true"]',
      '[class*="generating"]',
    ]
  };

  private state: PlatformState = {
    platform: 'Claude',
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
  private monitoringInterval: number | null = null;
  private stateChangeListeners: Array<(state: PlatformState) => void> = [];

  public initialize(): void {
    this.detectInitialState();
    this.startMonitoring();
    DEBUG && console.log('[Claude Detector] Initialized');
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

  public fillInput(text: string): boolean {
    DEBUG && console.log('[Claude Detector] fillInput called, text length:', text.length);

    if (!this.inputElement) {
      DEBUG && console.warn('[Claude Detector] No input element found, re-detecting...');
      this.findInput();
    }

    if (!this.inputElement) {
      DEBUG && console.error('[Claude Detector] Still no input element found!');
      return false;
    }

    try {
      let success = false;

      if (this.inputType === 'contenteditable') {
        DEBUG && console.log('[Claude Detector] Filling contenteditable');
        success = fillContentEditable(this.inputElement, text);
      } else if (this.inputType === 'textarea' || this.inputType === 'input') {
        DEBUG && console.log('[Claude Detector] Filling text element:', this.inputType);
        success = fillTextElement(this.inputElement as HTMLTextAreaElement | HTMLInputElement, text);
      }

      return success;
    } catch (error) {
      DEBUG && console.error('[Claude Detector] fillInput failed:', error);
      return false;
    }
  }

  public cleanup(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
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
        DEBUG && console.log('[Claude Detector] Found input element:', {
          type: this.inputType,
          className: this.inputElement.className
        });
      }
    } else if (this.inputElement) {
      // Selectors came up empty. The composer may be transiently re-rendering. If the
      // cached element is still connected, keep it and avoid a spurious "lost" warning;
      // the next detection cycle will re-confirm it. Only drop it once detached.
      if (this.inputElement.isConnected) {
        DEBUG && console.log('[Claude Detector] Selectors missed, cached input still connected; keeping it');
      } else {
        DEBUG && console.warn('[Claude Detector] Lost input element (detached)');
        this.inputElement = null;
        this.inputType = null;
      }
    }
  }

  private detectUIVersion(): string | undefined {
    // Claude uses a ProseMirror editor
    if (document.querySelector('.ProseMirror')) {
      return 'prosemirror';
    }
    return undefined;
  }

  private checkCanSubmit(): boolean {
    const sendButton = document.querySelector('button[type="submit"], [aria-label*="Send"]');
    if (sendButton) {
      const isDisabled = sendButton.hasAttribute('disabled') ||
                         sendButton.getAttribute('aria-disabled') === 'true';
      return !isDisabled && !this.state.isProcessing;
    }
    return true;
  }

  private startMonitoring(): void {
    this.setupMutationObserver();

    // Interval backup. initialize() can run again on the same instance (the
    // factory caches detectors), so drop any previous timer first rather than
    // stacking a second one.
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
    }
    this.monitoringInterval = setInterval(() => {
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
      platform: 'Claude',
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
