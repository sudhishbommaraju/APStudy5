/**
 * LaTeX utilities — minimal, safe helpers.
 * CRITICAL: Do NOT strip or restore backslashes.
 * KaTeX receives raw LaTeX strings; backslashes must be preserved exactly.
 */

/**
 * Check if string contains LaTeX math indicators
 */
export function containsMath(text) {
  if (!text || typeof text !== 'string') return false;
  return /\$|\\\w+|\^|_\{/.test(text);
}

/**
 * cleanLaTeX — only decode HTML entities, nothing else.
 * Do NOT touch backslashes or restructure expressions.
 */
export function cleanLaTeX(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Extract math blocks and inline math from text
 * Returns array of { type: 'text'|'block'|'inline', content }
 */
export function extractMath(text) {
  if (!text || typeof text !== 'string') return [{ type: 'text', content: text }];

  const parts = [];
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    const isBlock = raw.startsWith('$$');
    const inner = isBlock ? raw.slice(2, -2).trim() : raw.slice(1, -1).trim();
    parts.push({ type: isBlock ? 'block' : 'inline', content: inner });
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: 'text', content: text }];
}

/**
 * Validate LaTeX expression (basic brace matching)
 */
export function isValidLaTeX(text) {
  if (!text || typeof text !== 'string') return false;
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{' && text[i - 1] !== '\\') count++;
    if (text[i] === '}' && text[i - 1] !== '\\') count--;
    if (count < 0) return false;
  }
  return count === 0;
}

// Legacy exports kept for compatibility
export function restoreBackslashes(text) { return text; }
export function normalizeLaTeX(text) { return text; }
export function wrapMath(text) { return text; }
export function escapeForJSON(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}