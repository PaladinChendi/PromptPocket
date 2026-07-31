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
    DEBUG && console.log('[fillContentEditable] Filling contenteditable, className:', element.className);
    element.focus();

    // Insert text at the current caret position.
    document.execCommand('insertText', false, text);

    // Normalize newline runs on both sides so the check survives ProseMirror's
    // block/whitespace normalization (e.g. \n -> \n\n), which previously made the
    // check always false for newline-bearing text and triggered a duplicate append.
    const norm = (s: string): string =>
      s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{2,}/g, '\n').replace(/\s+$/g, '');
    const finalContent = element.innerText || '';
    // If execCommand already inserted the text, do nothing more. Only append a fallback
    // copy when it genuinely isn't present — this prevents the "inserted twice" bug while
    // keeping insertion at the caret. includes (not endsWith) stays correct whether the
    // caret was at the end or mid-content.
    const alreadyInserted = norm(finalContent).includes(norm(text));

    if (!alreadyInserted) {
      DEBUG && console.log('[fillContentEditable] execCommand failed, using innerText fallback');
      element.innerText = finalContent + text;
    }

    // Notify the framework of the change. A plain bubbling Event('input') carries no
    // data/inputType, so it cannot trigger a second framework insert (the old synthetic
    // InputEvent('insertText', { data }) could re-insert the text, producing a 2nd copy).
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    DEBUG && console.log('[fillContentEditable] Successfully inserted text, innerText:', element.innerText.substring(0, 50));
    return true;
  } catch (error) {
    DEBUG && console.error('[fillContentEditable] Failed:', error);
    return false;
  }
}

/**
 * Fill text into a textarea or input element
 */
export function fillTextElement(element: HTMLTextAreaElement | HTMLInputElement, text: string): boolean {
  try {
    DEBUG && console.log('[fillTextElement] Filling text into element:', element.tagName, 'className:', element.className);
    element.focus();

    const selectionStart = element.selectionStart ?? element.value.length;
    const selectionEnd = element.selectionEnd ?? element.value.length;
    const value = element.value || '';

    // Insert text at current cursor position
    const before = value.substring(0, selectionStart);
    const after = value.substring(selectionEnd);
    const finalText = before + text + after;

    // Use native setter to bypass React's event system
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      (element as HTMLTextAreaElement).constructor.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, finalText);
    } else {
      element.value = finalText;
    }

    // Move cursor after the inserted text
    const newCursorPos = selectionStart + text.length;
    element.setSelectionRange(newCursorPos, newCursorPos);

    // Trigger proper events
    element.dispatchEvent(new Event('focus', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    DEBUG && console.log('[fillTextElement] Successfully appended text, value:', element.value.substring(0, 50));
    return true;
  } catch (error) {
    DEBUG && console.error('[fillTextElement] Failed:', error);
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
    DEBUG && console.log(`[matchesDomain] Checking hostname "${hostname}" against domains:`, domains);
    DEBUG && console.log(`[matchesDomain] Result:`, matches);
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