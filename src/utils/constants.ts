// src/utils/constants.ts

/**
 * Application constants and configuration
 */

// Extension metadata
export const EXTENSION_NAME = 'Prompt Pocket';
export const EXTENSION_VERSION = '1.0.0';

// Storage keys
export const STORAGE_KEYS = {
  STORAGE_DATA: 'storageData',
  LAST_SYNC_TIME: 'lastSyncTime',
  USER_ID: 'userId'
} as const;

// ChatGPT URL patterns
export const CHATGPT_URLS = {
  OPENAI: 'https://chat.openai.com/*',
  CHATGPT: 'https://chatgpt.com/*'
} as const;

export const CHATGPT_DOMAINS = ['chat.openai.com', 'chatgpt.com'];

// UI Constants
export const UI = {
  FLOATING_BUTTON_ID: 'prompt-pocket-floating-btn',
  PROMPT_PANEL_ID: 'prompt-pocket-panel',
  INJECTION_CONTAINER_ID: 'prompt-pocket-container',

  // Positions
  POSITIONS: {
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' }
  } as const,

  // Z-index layers
  Z_INDEX: {
    FLOATING_BUTTON: 9999,
    PROMPT_PANEL: 9998,
    BACKDROP: 9997
  },

  // Animation durations (ms)
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  }
} as const;

// Default prompts for first-time users
export const DEFAULT_PROMPTS = [
  {
    title: 'Code Review Assistant',
    content: 'Please review this code for potential issues, security vulnerabilities, and improvements:\n\n```{language}\n{code}\n```\n\nFocus on:\n1. Code quality and readability\n2. Performance optimizations\n3. Security considerations\n4. Best practices\n5. Potential bugs',
    description: 'Get comprehensive code reviews',
    tags: ['coding', 'review', 'security'],
    category: 'Coding'
  },
  {
    title: 'Blog Post Outline',
    content: 'Create a detailed outline for a blog post about "{topic}". Include:\n\n1. Compelling introduction\n2. Key sections with subpoints\n3. Data/statistics to include\n4. Call-to-action conclusion\n5. SEO keywords\n\nTarget audience: {audience}',
    description: 'Generate blog post structures',
    tags: ['writing', 'blog', 'content'],
    category: 'Writing'
  },
  {
    title: 'Data Analysis Plan',
    content: 'Design a data analysis plan for analyzing "{dataset}" to answer "{research_question}". Include:\n\n1. Data cleaning steps\n2. Statistical methods\n3. Visualization approaches\n4. Potential pitfalls\n5. Validation techniques',
    description: 'Plan data analysis projects',
    tags: ['analysis', 'data', 'research'],
    category: 'Analysis'
  }
] as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  OPEN_PANEL: {
    description: 'Open prompt panel',
    default: 'Ctrl+Shift+P'
  },
  QUICK_INSERT: {
    description: 'Quick insert last used prompt',
    default: 'Ctrl+Shift+L'
  },
  TOGGLE_UI: {
    description: 'Toggle floating UI visibility',
    default: 'Ctrl+Shift+U'
  }
} as const;

// Error messages
export const ERROR_MESSAGES = {
  STORAGE_FAILED: 'Failed to access storage. Please check extension permissions.',
  PROMPT_NOT_FOUND: 'Prompt not found.',
  INVALID_DATA: 'Invalid data format.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  DOM_NOT_READY: 'AI interface not ready yet.',
  PERMISSION_DENIED: 'Permission denied.'
} as const;

// Logging
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
} as const;

// Feature flags (for future extensibility)
export const FEATURE_FLAGS = {
  ENABLE_VARIABLES: true,
  ENABLE_CATEGORIES: true,
  ENABLE_KEYBOARD_SHORTCUTS: true,
  ENABLE_SYNC: false,
  ENABLE_ANALYTICS: false
} as const;