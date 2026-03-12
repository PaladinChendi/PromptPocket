// src/utils/dom.ts

/**
 * DOM manipulation utilities for the extension
 */

/**
 * Safely query selector with optional context
 */
export function $<T extends HTMLElement = HTMLElement>(
  selector: string,
  context: Document | HTMLElement = document
): T | null {
  return context.querySelector(selector) as T | null;
}

/**
 * Safely query all elements
 */
export function $$<T extends HTMLElement = HTMLElement>(
  selector: string,
  context: Document | HTMLElement = document
): NodeListOf<T> {
  return context.querySelectorAll(selector);
}

/**
 * Wait for element to appear in DOM
 */
export function waitForElement<T extends HTMLElement = HTMLElement>(
  selector: string,
  timeout = 10000,
  context: Document | HTMLElement = document
): Promise<T> {
  return new Promise((resolve, reject) => {
    const element = $(selector, context);
    if (element) {
      resolve(element as T);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = $(selector, context);
      if (element) {
        obs.disconnect();
        resolve(element as T);
      }
    });

    observer.observe(context, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Create element with attributes and children
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: {
    id?: string;
    className?: string;
    textContent?: string;
    html?: string;
    attributes?: Record<string, string>;
    styles?: Partial<CSSStyleDeclaration>;
    children?: HTMLElement[];
    onClick?: (event: Event) => void;
  } = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options.id) element.id = options.id;
  if (options.className) element.className = options.className;
  if (options.textContent) element.textContent = options.textContent;
  if (options.html) element.innerHTML = options.html;

  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      element.setAttribute(key, value);
    }
  }

  if (options.styles) {
    Object.assign(element.style, options.styles);
  }

  if (options.children) {
    for (const child of options.children) {
      element.appendChild(child);
    }
  }

  if (options.onClick) {
    element.addEventListener('click', options.onClick);
  }

  return element;
}

/**
 * Inject CSS styles into the page
 */
export function injectStyles(css: string, id?: string): HTMLStyleElement {
  const style = createElement('style', {
    id,
    html: css
  });

  document.head.appendChild(style);
  return style;
}

/**
 * Remove element by ID
 */
export function removeElement(id: string): boolean {
  const element = document.getElementById(id);
  if (element) {
    element.remove();
    return true;
  }
  return false;
}

/**
 * Check if element exists
 */
export function elementExists(id: string): boolean {
  return !!document.getElementById(id);
}

/**
 * Add class to element
 */
export function addClass(element: HTMLElement, className: string): void {
  element.classList.add(className);
}

/**
 * Remove class from element
 */
export function removeClass(element: HTMLElement, className: string): void {
  element.classList.remove(className);
}

/**
 * Toggle class on element
 */
export function toggleClass(element: HTMLElement, className: string): void {
  element.classList.toggle(className);
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Get computed styles for an element
 */
export function getComputedStyles(element: HTMLElement): CSSStyleDeclaration {
  return window.getComputedStyle(element);
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  if (!element) return false;

  const style = getComputedStyles(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetParent !== null
  );
}

/**
 * Scroll element into view with options
 */
export function scrollIntoView(element: HTMLElement, options: ScrollIntoViewOptions = {}): void {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest',
    ...options
  });
}