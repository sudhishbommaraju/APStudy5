/**
 * LaTeX utilities for cleanup, validation, and preprocessing
 */

// Common LaTeX commands that must preserve backslashes
const LATEX_COMMANDS = [
  'frac', 'sin', 'cos', 'tan', 'sqrt', 'text', 'theta', 'alpha', 'beta', 'gamma',
  'delta', 'pi', 'times', 'div', 'pm', 'equiv', 'approx', 'leq', 'geq', 'neq',
  'infty', 'sum', 'int', 'partial', 'deg', 'log', 'ln', 'exp', 'abs', 'vec'
];

/**
 * Restore missing backslashes in LaTeX expressions
 * E.g., "rac{1}{2}" → "\frac{1}{2}"
 */
export function restoreBackslashes(text) {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  
  // For each known command, restore backslash if missing
  for (const cmd of LATEX_COMMANDS) {
    // Match command without backslash at word boundary
    const pattern = new RegExp(`(?<!\\\\)\\b${cmd}\\b`, 'g');
    result = result.replace(pattern, `\\${cmd}`);
  }
  
  return result;
}

/**
 * Check if string contains LaTeX math indicators
 */
export function containsMath(text) {
  if (!text || typeof text !== 'string') return false;
  
  return /[\$\\^_{}]|\\frac|\\sin|\\cos|\\sqrt|\\theta|\\alpha|\\pi|\\times|\\div|\\sum|\\int/.test(text);
}

/**
 * Normalize LaTeX spacing and formatting
 */
export function normalizeLaTeX(text) {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  
  // Remove extra spaces around operators
  result = result.replace(/\s+\\/g, '\\'); // space before backslash
  result = result.replace(/\\(\w+)\s+/g, '\\$1 '); // normalize space after command
  
  // Ensure proper spacing in fractions
  result = result.replace(/\\frac\s*\{\s*/g, '\\frac{');
  result = result.replace(/\}\s*\{\s*/g, '}{');
  
  // Fix double backslashes
  result = result.replace(/\\\\/g, '\\');
  
  return result;
}

/**
 * Wrap math in delimiters if not already wrapped
 * Detects block ($$) vs inline ($) math
 */
export function wrapMath(text) {
  if (!text || typeof text !== 'string') return text;
  
  // If already wrapped, return as-is
  if (text.includes('$$') || (text.includes('$') && !text.includes('$$$'))) {
    return text;
  }
  
  // If contains LaTeX but not wrapped, wrap it
  if (containsMath(text)) {
    // If it looks like a full expression (newlines, multiple parts), use block math
    if (text.includes('\n') || text.length > 60) {
      return `$$ ${text} $$`;
    }
    // Otherwise inline
    return `$ ${text} $`;
  }
  
  return text;
}

/**
 * Deep clean: restore backslashes, normalize, wrap if needed
 */
export function cleanLaTeX(text) {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  
  // Step 1: Restore missing backslashes
  result = restoreBackslashes(result);
  
  // Step 2: Normalize spacing
  result = normalizeLaTeX(result);
  
  // Step 3: Wrap in delimiters if needed
  if (containsMath(result)) {
    result = wrapMath(result);
  }
  
  return result;
}

/**
 * Extract math blocks and inline math from text
 * Returns array of { type: 'text'|'block'|'inline', content }
 */
export function extractMath(text) {
  if (!text || typeof text !== 'string') return [{ type: 'text', content: text }];
  
  const parts = [];
  let remaining = text;
  
  while (remaining) {
    // Check for block math $$...$$
    const blockMatch = remaining.match(/\$\$([\s\S]*?)\$\$/);
    if (blockMatch) {
      const before = remaining.substring(0, blockMatch.index);
      if (before) parts.push({ type: 'text', content: before });
      parts.push({ type: 'block', content: blockMatch[1].trim() });
      remaining = remaining.substring(blockMatch.index + blockMatch[0].length);
      continue;
    }
    
    // Check for inline math $...$
    const inlineMatch = remaining.match(/\$([^\$]+?)\$/);
    if (inlineMatch) {
      const before = remaining.substring(0, inlineMatch.index);
      if (before) parts.push({ type: 'text', content: before });
      parts.push({ type: 'inline', content: inlineMatch[1].trim() });
      remaining = remaining.substring(inlineMatch.index + inlineMatch[0].length);
      continue;
    }
    
    // No more math, add remaining as text
    if (remaining) {
      parts.push({ type: 'text', content: remaining });
    }
    break;
  }
  
  return parts.length ? parts : [{ type: 'text', content: text }];
}

/**
 * Validate LaTeX expression (basic check)
 */
export function isValidLaTeX(text) {
  if (!text || typeof text !== 'string') return false;
  
  // Check for matching braces
  let braceCount = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{' && text[i - 1] !== '\\') braceCount++;
    if (text[i] === '}' && text[i - 1] !== '\\') braceCount--;
    if (braceCount < 0) return false;
  }
  
  return braceCount === 0;
}

/**
 * Escape JSON strings to preserve backslashes
 */
export function escapeForJSON(text) {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/"/g, '\\"')   // Escape quotes
    .replace(/\n/g, '\\n'); // Escape newlines
}