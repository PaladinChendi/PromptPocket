// src/content/uiInjector.ts

import { UI } from '../utils/constants';
import { createElement, removeElement, elementExists } from '../utils/dom';
import { sendMessage, MessageBuilder } from '../utils/messages';
import { PlatformDetector, PlatformState } from './platforms';
import type { PromptTemplate } from '../types';

/**
 * Floating UI Injection System
 *
 * This module handles the injection and management of the floating UI
 * elements (button and panel) on supported AI platforms.
 */

export class UIInjector {
  private detector: PlatformDetector;
  private container: HTMLElement | null = null;
  private floatingButton: HTMLElement | null = null;
  private promptPanel: HTMLElement | null = null;
  private isPanelOpen = false;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private buttonStartX = 0;
  private buttonStartY = 0;

  constructor(detector: PlatformDetector) {
    this.detector = detector;
  }

  /**
   * Initialize UI injection
   */
  public initialize(): void {
    this.injectStyles();
    this.createContainer();
    this.setupEventListeners();

    // Listen for platform state changes
    this.detector.subscribe((state) => {
      this.onPlatformStateChange(state);
    });

    console.log('[UI Injector] Initialized for platform:', this.detector.getPlatformName());
  }

  /**
   * Inject CSS styles for the UI
   */
  private injectStyles(): void {
    const styles = `
      #${UI.INJECTION_CONTAINER_ID} {
        all: initial !important;
        position: fixed !important;
        z-index: ${UI.Z_INDEX.FLOATING_BUTTON} !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }

      #${UI.FLOATING_BUTTON_ID} {
        position: fixed !important;
        width: 56px !important;
        height: 56px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        user-select: none !important;
        transition: all ${UI.ANIMATION_DURATION.NORMAL}ms ease !important;
        border: none !important;
        outline: none !important;
        z-index: ${UI.Z_INDEX.FLOATING_BUTTON} !important;
      }

      #${UI.FLOATING_BUTTON_ID}:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 6px 30px rgba(0, 0, 0, 0.2), 0 3px 10px rgba(0, 0, 0, 0.15) !important;
      }

      #${UI.FLOATING_BUTTON_ID}:active {
        transform: scale(0.95) !important;
      }

      #${UI.FLOATING_BUTTON_ID}.dragging {
        cursor: grabbing !important;
        opacity: 0.8 !important;
      }

      .floating-button-icon {
        width: 24px !important;
        height: 24px !important;
        fill: white !important;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2)) !important;
      }

      #${UI.PROMPT_PANEL_ID} {
        position: fixed !important;
        width: 400px !important;
        max-height: 600px !important;
        background: white !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        display: none !important;
        flex-direction: column !important;
        z-index: ${UI.Z_INDEX.PROMPT_PANEL} !important;
        overflow: hidden !important;
      }

      #${UI.PROMPT_PANEL_ID}.open {
        display: flex !important;
        animation: slideIn ${UI.ANIMATION_DURATION.NORMAL}ms ease !important;
      }

      .panel-header {
        padding: 20px !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }

      .panel-title {
        font-size: 18px !important;
        font-weight: 600 !important;
        margin: 0 !important;
      }

      .platform-badge {
        font-size: 11px !important;
        background: rgba(255, 255, 255, 0.2) !important;
        padding: 2px 8px !important;
        border-radius: 10px !important;
        margin-left: 8px !important;
      }

      .close-button {
        background: none !important;
        border: none !important;
        color: white !important;
        cursor: pointer !important;
        padding: 4px !important;
        border-radius: 4px !important;
        transition: background ${UI.ANIMATION_DURATION.FAST}ms ease !important;
      }

      .close-button:hover {
        background: rgba(255, 255, 255, 0.1) !important;
      }

      .panel-content {
        flex: 1 !important;
        overflow-y: auto !important;
        padding: 20px !important;
      }

      .prompt-list {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
      }

      .prompt-item {
        padding: 16px !important;
        background: #f8f9fa !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        transition: all ${UI.ANIMATION_DURATION.FAST}ms ease !important;
        border: 1px solid transparent !important;
      }

      .prompt-item:hover {
        background: #e9ecef !important;
        border-color: #dee2e6 !important;
        transform: translateY(-1px) !important;
      }

      .prompt-item-title {
        font-size: 14px !important;
        font-weight: 600 !important;
        margin: 0 0 4px 0 !important;
        color: #212529 !important;
      }

      .prompt-item-description {
        font-size: 12px !important;
        color: #6c757d !important;
        margin: 0 !important;
      }

      .empty-state {
        text-align: center !important;
        padding: 40px 20px !important;
        color: #6c757d !important;
      }

      .panel-backdrop {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.5) !important;
        z-index: ${UI.Z_INDEX.BACKDROP} !important;
        display: none !important;
        animation: fadeIn ${UI.ANIMATION_DURATION.NORMAL}ms ease !important;
      }

      .panel-backdrop.open {
        display: block !important;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;

    createElement('style', {
      id: 'prompt-pocket-styles',
      html: styles
    });
  }

  /**
   * Create container for UI elements
   */
  private createContainer(): void {
    if (elementExists(UI.INJECTION_CONTAINER_ID)) {
      return;
    }

    this.container = createElement('div', {
      id: UI.INJECTION_CONTAINER_ID
    });

    document.body.appendChild(this.container);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (event) => this.handleKeyDown(event));

    // Prevent bubbling
    if (this.container) {
      this.container.addEventListener('click', (event) => {
        event.stopPropagation();
      });

      this.container.addEventListener('keydown', (event) => {
        event.stopPropagation();
      });
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Only handle when focused on platform input
    const inputField = this.detector.getInputField();
    if (!inputField?.contains(document.activeElement)) {
      return;
    }

    // Ctrl+Shift+P: Open panel
    if (event.ctrlKey && event.shiftKey && event.key === 'p') {
      event.preventDefault();
      this.togglePanel();
    }

    // Ctrl+Shift+U: Toggle UI visibility
    if (event.ctrlKey && event.shiftKey && event.key === 'u') {
      event.preventDefault();
      this.toggleUIVisibility();
    }
  }

  /**
   * Handle platform state changes
   */
  private onPlatformStateChange(state: PlatformState): void {
    if (!state.isChatPage) {
      this.removeUI();
      return;
    }

    if (state.hasInputField) {
      this.showFloatingButton();
    } else {
      this.hideFloatingButton();
    }
  }

  /**
   * Show floating button
   */
  private showFloatingButton(): void {
    if (this.floatingButton) {
      return;
    }

    this.floatingButton = createElement('button', {
      id: UI.FLOATING_BUTTON_ID,
      attributes: {
        'aria-label': 'Open prompt assistant',
        'title': 'Prompt Pocket (Ctrl+Shift+P)'
      },
      onClick: () => this.togglePanel()
    });

    // Add icon
    const icon = createElement('div', {
      className: 'floating-button-icon',
      html: `
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
        </svg>
      `
    });

    this.floatingButton.appendChild(icon);

    // Add drag functionality
    this.setupDragHandling();

    // Position button
    this.positionButton();

    // Add to container
    if (this.container) {
      this.container.appendChild(this.floatingButton);
    }
  }

  /**
   * Setup drag handling for floating button
   */
  private setupDragHandling(): void {
    if (!this.floatingButton) return;

    this.floatingButton.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return; // Only left click

      this.isDragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;

      const rect = this.floatingButton!.getBoundingClientRect();
      this.buttonStartX = rect.left;
      this.buttonStartY = rect.top;

      this.floatingButton!.classList.add('dragging');

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!this.isDragging || !this.floatingButton) return;

        const deltaX = moveEvent.clientX - this.dragStartX;
        const deltaY = moveEvent.clientY - this.dragStartY;

        this.floatingButton.style.left = `${this.buttonStartX + deltaX}px`;
        this.floatingButton.style.top = `${this.buttonStartY + deltaY}px`;
        this.floatingButton.style.right = 'auto';
        this.floatingButton.style.bottom = 'auto';
      };

      const handleMouseUp = () => {
        this.isDragging = false;
        this.floatingButton!.classList.remove('dragging');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }

  /**
   * Position floating button based on settings
   */
  private positionButton(): void {
    if (!this.floatingButton) return;

    // TODO: Get position from settings
    const position = UI.POSITIONS['bottom-right'];

    Object.assign(this.floatingButton.style, position);
  }

  /**
   * Hide floating button
   */
  private hideFloatingButton(): void {
    if (this.floatingButton) {
      this.floatingButton.style.display = 'none';
    }
  }

  /**
   * Toggle panel visibility
   */
  private async togglePanel(): Promise<void> {
    if (this.isPanelOpen) {
      this.closePanel();
    } else {
      await this.openPanel();
    }
  }

  /**
   * Open prompt panel
   */
  private async openPanel(): Promise<void> {
    if (this.isPanelOpen) return;

    await this.createPanel();
    this.isPanelOpen = true;

    if (this.promptPanel) {
      this.promptPanel.classList.add('open');
    }

    // Create backdrop
    this.createBackdrop();

    console.log('[UI Injector] Prompt panel opened');
  }

  /**
   * Close prompt panel
   */
  private closePanel(): void {
    if (!this.isPanelOpen) return;

    this.isPanelOpen = false;

    if (this.promptPanel) {
      this.promptPanel.classList.remove('open');
    }

    this.removeBackdrop();

    console.log('[UI Injector] Prompt panel closed');
  }

  /**
   * Create prompt panel
   */
  private async createPanel(): Promise<void> {
    if (this.promptPanel) {
      return;
    }

    this.promptPanel = createElement('div', {
      id: UI.PROMPT_PANEL_ID
    });

    // Header
    const headerTitle = createElement('div', {
      className: 'panel-title',
      children: [
        createElement('h2', {
          textContent: 'Prompt Templates',
          styles: { display: 'inline', margin: '0' }
        }),
        createElement('span', {
          className: 'platform-badge',
          textContent: this.detector.getPlatformName()
        })
      ]
    });

    const header = createElement('div', {
      className: 'panel-header',
      children: [
        headerTitle,
        createElement('button', {
          className: 'close-button',
          html: '×',
          onClick: () => this.closePanel(),
          attributes: {
            'aria-label': 'Close panel'
          }
        })
      ]
    });

    // Content (will be populated dynamically)
    const content = createElement('div', {
      className: 'panel-content'
    });

    this.promptPanel.appendChild(header);
    this.promptPanel.appendChild(content);

    // Position panel near floating button
    if (this.floatingButton) {
      const buttonRect = this.floatingButton.getBoundingClientRect();
      this.promptPanel.style.left = `${buttonRect.left - 420}px`;
      this.promptPanel.style.top = `${buttonRect.top}px`;
    } else {
      // Fallback position
      this.promptPanel.style.right = '20px';
      this.promptPanel.style.bottom = '80px';
    }

    if (this.container) {
      this.container.appendChild(this.promptPanel);
    }

    // Load prompts
    await this.loadPrompts(content);
  }

  /**
   * Load and display prompts in the panel
   */
  private async loadPrompts(content: HTMLElement): Promise<void> {
    try {
      // Show loading state
      content.innerHTML = '';
      const loadingState = createElement('div', {
        className: 'empty-state',
        textContent: 'Loading prompts...'
      });
      content.appendChild(loadingState);

      // Get prompts from background
      const response = await sendMessage(MessageBuilder.getPrompts());
      const prompts = (response as { prompts?: Record<string, PromptTemplate> }).prompts || {};

      // Remove loading state
      content.innerHTML = '';

      // Create prompt list
      const promptList = createElement('div', {
        className: 'prompt-list'
      });

      const promptEntries = Object.entries(prompts);

      if (promptEntries.length === 0) {
        // Show empty state
        const emptyState = createElement('div', {
          className: 'empty-state',
          html: '<div>No prompts yet.<br/><br/>Use the extension popup to create your first prompt template.</div>'
        });
        content.appendChild(emptyState);
      } else {
        // Sort by usage count (desc) and then by title (asc)
        promptEntries.sort(([, a], [, b]) => {
          if (b.usageCount !== a.usageCount) {
            return b.usageCount - a.usageCount;
          }
          return a.title.localeCompare(b.title);
        });

        // Add each prompt to the list
        for (const [id, prompt] of promptEntries) {
          const promptItem = this.createPromptItem(id, prompt);
          promptList.appendChild(promptItem);
        }

        content.appendChild(promptList);
      }
    } catch (error) {
      console.error('[UI Injector] Failed to load prompts:', error);
      content.innerHTML = '';
      const errorState = createElement('div', {
        className: 'empty-state',
        html: '<div>Failed to load prompts.<br/>Please try again.</div>'
      });
      content.appendChild(errorState);
    }
  }

  /**
   * Create a prompt item element
   */
  private createPromptItem(id: string, prompt: PromptTemplate): HTMLElement {
    const item = createElement('div', {
      className: 'prompt-item',
      onClick: () => this.handlePromptClick(id)
    });

    const title = createElement('div', {
      className: 'prompt-item-title',
      textContent: prompt.title
    });

    const description = createElement('div', {
      className: 'prompt-item-description',
      textContent: prompt.description || ''
    });

    item.appendChild(title);
    item.appendChild(description);

    return item;
  }

  /**
   * Handle prompt item click
   */
  private async handlePromptClick(id: string): Promise<void> {
    try {
      const response = await sendMessage(MessageBuilder.executePrompt(id));

      if ((response as { success: boolean }).success) {
        // Close panel after successful execution
        this.closePanel();
      } else {
        alert('Failed to execute prompt. Please try again.');
      }
    } catch (error) {
      console.error('[UI Injector] Failed to execute prompt:', error);
      alert('Failed to execute prompt: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Create backdrop for panel
   */
  private createBackdrop(): void {
    const backdrop = createElement('div', {
      className: 'panel-backdrop open',
      onClick: () => this.closePanel()
    });

    backdrop.id = 'prompt-pocket-backdrop';

    document.body.appendChild(backdrop);
  }

  /**
   * Remove backdrop
   */
  private removeBackdrop(): void {
    removeElement('prompt-pocket-backdrop');
  }

  /**
   * Toggle UI visibility
   */
  private toggleUIVisibility(): void {
    if (!this.container) return;

    const isVisible = this.container.style.display !== 'none';
    this.container.style.display = isVisible ? 'none' : '';

    console.log(`[UI Injector] UI ${isVisible ? 'hidden' : 'shown'}`);
  }

  /**
   * Remove all UI elements
   */
  private removeUI(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.floatingButton = null;
    this.promptPanel = null;
    this.isPanelOpen = false;
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.removeUI();
  }
}