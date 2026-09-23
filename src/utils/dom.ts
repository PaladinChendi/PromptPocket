// src/utils/dom.ts

/**
 * DOM manipulation utilities for the extension
 */

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
 * Debounce function for performance optimization
 */
// `any` is the standard constraint for "some function" in a generic: narrowing it
// to unknown would reject ordinary callers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
