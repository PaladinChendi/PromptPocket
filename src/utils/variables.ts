// src/utils/variables.ts

/**
 * Template variable support.
 *
 * A prompt may contain `{{name}}` placeholders. Names accept letters (in any
 * script, so Chinese names work), digits, underscore and hyphen; surrounding
 * whitespace inside the braces is ignored, so `{{ topic }}` and `{{topic}}`
 * refer to the same variable.
 */

const VARIABLE_PATTERN = /\{\{\s*([\p{L}\p{N}_-]+)\s*\}\}/gu;

/**
 * List the variable names used in a prompt, de-duplicated and in the order
 * they first appear. That order is what the fill-in form renders, so it
 * follows the reading order of the prompt.
 */
export function extractVariables(content: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];

  // matchAll needs its own regex state; VARIABLE_PATTERN is module-level and
  // global, so iterate a fresh copy rather than sharing lastIndex.
  const pattern = new RegExp(VARIABLE_PATTERN.source, VARIABLE_PATTERN.flags);
  for (const match of content.matchAll(pattern)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }

  return names;
}

/**
 * Whether a prompt needs values before it can be inserted.
 */
export function hasVariables(content: string): boolean {
  return extractVariables(content).length > 0;
}

/**
 * Replace `{{name}}` placeholders with the supplied values.
 *
 * A name present in `values` is substituted, including when its value is an
 * empty string. A name absent from `values` is left as the literal
 * placeholder, so a prompt executed without a fill-in step is inserted
 * unchanged rather than silently losing text.
 */
export function substituteVariables(
  content: string,
  values: Record<string, string>
): string {
  const pattern = new RegExp(VARIABLE_PATTERN.source, VARIABLE_PATTERN.flags);
  return content.replace(pattern, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? values[name] : placeholder
  );
}
