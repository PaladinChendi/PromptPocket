// src/content/platforms/detectorUtils.ts

import { InputElementResult } from './basePlatformDetector';

/**
 * Find an input element by selectors
 */
export function findInputElement(selectors: string[]): InputElementResult | null {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (!element) continue;

      const isContentEditable = element.getAttribute('contenteditable') === 'true';
      const tag = element.tagName.toLowerCase();

      if (isContentEditable) {
        return { element: element as HTMLElement, type: 'contenteditable' };
      }
      if (tag === 'textarea') {
        return { element: element as HTMLTextAreaElement, type: 'textarea' };
      }
      if (tag === 'input' && (element as HTMLInputElement).type === 'text') {
        return { element: element as HTMLInputElement, type: 'input' };
      }
    } catch (e) {
      // Invalid selector, skip
    }
  }

  // Fallback: find any contenteditable element that's visible
  const allEditable = document.querySelectorAll('[contenteditable="true"]');
  for (const el of allEditable) {
    const rect = (el as HTMLElement).getBoundingClientRect();
    if (rect.width > 100 && rect.height > 30) {
      // This looks like a main input area
      // Exclude fallback/hidden textareas
      const className = (el as HTMLElement).className || '';
      if (!className.includes('fallback') && !className.includes('hidden')) {
        return { element: el as HTMLElement, type: 'contenteditable' };
      }
    }
  }

  return null;
}

/**
 * Fill text into a contenteditable element
 */
export function fillContentEditable(element: HTMLElement, text: string): boolean {
  try {
    console.log('[fillContentEditable] Filling contenteditable, className:', element.className);
    element.focus();

    // Clear existing content
    element.innerText = '';
    element.focus();

    // Use execCommand to insert text (most compatible)
    const success = document.execCommand('insertText', false, text);

    if (!success) {
      console.log('[fillContentEditable] execCommand failed, using innerText');
      element.innerText = text;
    }

    // Trigger input events
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: false,
      data: text,
      inputType: 'insertText'
    });
    element.dispatchEvent(inputEvent);

    element.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('[fillContentEditable] Successfully filled text, innerText:', element.innerText.substring(0, 50));
    return true;
  } catch (error) {
    console.error('[fillContentEditable] Failed:', error);
    return false;
  }
}

/**
 * Fill text into a textarea or input element
 */
export function fillTextElement(element: HTMLTextAreaElement | HTMLInputElement, text: string): boolean {
  try {
    console.log('[fillTextElement] Filling text into element:', element.tagName, 'className:', element.className);
    element.focus();

    // Use native setter to bypass React's event system
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      (element as HTMLTextAreaElement).constructor.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, text);
    } else {
      element.value = text;
    }

    // Trigger proper events
    element.dispatchEvent(new Event('focus', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('[fillTextElement] Successfully filled text, value:', element.value.substring(0, 50));
    return true;
  } catch (error) {
    console.error('[fillTextElement] Failed:', error);
    return false;
  }
}

/**
 * Check if the page matches any of the given domains
 */
let domainLogged = false;
export function matchesDomain(domains: string[]): boolean {
  const hostname = window.location.hostname.toLowerCase();
  const matches = domains.some(domain => {
    const exactMatch = hostname === domain;
    const subdomainMatch = hostname.endsWith('.' + domain);
    return exactMatch || subdomainMatch;
  });

  // Only log first time to avoid spam
  if (!domainLogged) {
    console.log(`[matchesDomain] Checking hostname "${hostname}" against domains:`, domains);
    console.log(`[matchesDomain] Result:`, matches);
    domainLogged = true;
  }

  return matches;
}

/**
 * Click a submit button by selector
 */
export function clickSubmitButton(selectors: string[]): boolean {
  for (const selector of selectors) {
    try {
      const button = document.querySelector(selector);
      if (button && button instanceof HTMLElement) {
        const isDisabled = button.hasAttribute('disabled') ||
                          button.getAttribute('aria-disabled') === 'true';
        if (!isDisabled) {
          button.click();
          return true;
        }
      }
    } catch (e) {
      // Invalid selector, skip
    }
  }
  return false;
}

/**
 * Try to submit via Enter key
 */
export function submitViaEnter(element: HTMLElement): boolean {
  const enterEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    bubbles: true,
    cancelable: true
  });
  return element.dispatchEvent(enterEvent);
}

/**
 * Check if processing is happening
 */
export function isProcessing(indicators: string[]): boolean {
  return indicators.some(indicator => {
    try {
      return document.querySelector(indicator) !== null;
    } catch {
      return false;
    }
  });
}