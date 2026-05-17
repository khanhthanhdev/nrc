/**
 * Sanitization utility for registration payloads
 * Prevents XSS and injection attacks by escaping HTML entities in string values
 */

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Dangerous URL schemes that should be blocked
 */
const DANGEROUS_SCHEMES = [
  'javascript:',
  'data:',
  'vbscript:',
];

/**
 * Check if a string contains a dangerous URL scheme
 */
const containsDangerousScheme = (str: string): boolean => {
  const lowerStr = str.toLowerCase().trim();
  return DANGEROUS_SCHEMES.some((scheme) => lowerStr.startsWith(scheme));
};

/**
 * Escape HTML entities in a string to prevent XSS
 * Also blocks dangerous URL schemes like javascript:
 */
export const escapeHtml = (str: string): string => {
  // Block dangerous URL schemes
  if (containsDangerousScheme(str)) {
    return '[BLOCKED: DANGEROUS_SCHEME]';
  }
  
  return str.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] ?? char);
};

/**
 * Recursively sanitize all string values in a JSON object
 */
export const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    // Trim whitespace and escape HTML entities
    return escapeHtml(value.trim());
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    return sanitizePayload(value as Record<string, unknown>);
  }

  // Preserve non-string types (numbers, booleans, null)
  return value;
};

/**
 * Sanitize all string values in a JSON payload
 * Recursively processes nested objects and arrays
 */
export const sanitizePayload = (payload: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, sanitizeValue(value)])
  );
