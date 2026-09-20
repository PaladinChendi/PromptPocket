// src/utils/constants.ts

/**
 * Application constants and configuration
 */

// UI Constants
export const UI = {
  FLOATING_BUTTON_ID: 'prompt-pocket-floating-btn',
  PROMPT_PANEL_ID: 'prompt-pocket-panel',
  INJECTION_CONTAINER_ID: 'prompt-pocket-container',

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
