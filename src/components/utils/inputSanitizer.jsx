/**
 * Input Sanitization Utilities
 * 
 * NOTE: React and React-Markdown provide automatic XSS protection.
 * These utilities add an extra layer for specific use cases.
 */

/**
 * Sanitize text input by removing potentially dangerous characters
 * Used for: user names, titles, short text fields
 */
export function sanitizeText(input) {
  if (!input) return '';
  
  return String(input)
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Sanitize URL input
 * Ensures URLs are safe to use
 */
export function sanitizeUrl(url) {
  if (!url) return '';
  
  const cleaned = url.trim();
  
  // Block dangerous protocols
  if (cleaned.match(/^(javascript|data|vbscript):/i)) {
    return '';
  }
  
  // Only allow http, https, and mailto
  if (!cleaned.match(/^(https?:\/\/|mailto:)/i)) {
    return `https://${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email) {
  if (!email) return '';
  
  const cleaned = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Sanitize markdown content
 * Note: react-markdown handles this automatically, but we validate length
 */
export function validateMarkdown(content, maxLength = 50000) {
  if (!content) return '';
  
  const cleaned = String(content).trim();
  
  // Enforce length limits
  if (cleaned.length > maxLength) {
    throw new Error(`Content exceeds maximum length of ${maxLength} characters`);
  }
  
  return cleaned;
}

/**
 * Validate number input
 */
export function sanitizeNumber(value, min = -Infinity, max = Infinity) {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new Error('Invalid number');
  }
  
  return Math.min(max, Math.max(min, num));
}

/**
 * Validate enum value
 */
export function validateEnum(value, allowedValues) {
  if (!allowedValues.includes(value)) {
    throw new Error(`Invalid value. Must be one of: ${allowedValues.join(', ')}`);
  }
  
  return value;
}

/**
 * Rate limit helper (client-side)
 * Not a security measure, but improves UX
 */
const rateLimitCache = new Map();

export function clientSideRateLimit(key, maxCalls = 5, windowMs = 60000) {
  const now = Date.now();
  const calls = rateLimitCache.get(key) || [];
  
  // Remove old calls outside the window
  const recentCalls = calls.filter(timestamp => now - timestamp < windowMs);
  
  if (recentCalls.length >= maxCalls) {
    return {
      allowed: false,
      resetIn: windowMs - (now - recentCalls[0])
    };
  }
  
  recentCalls.push(now);
  rateLimitCache.set(key, recentCalls);
  
  return {
    allowed: true,
    remaining: maxCalls - recentCalls.length
  };
}

/**
 * Sanitize filename for uploads
 */
export function sanitizeFilename(filename) {
  if (!filename) return '';
  
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe chars
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .slice(0, 255); // Limit length
}

/**
 * Validate question generation parameters
 */
export function validateQuestionParams(params) {
  const errors = [];
  
  if (!params.selectedSubject) {
    errors.push('Subject is required');
  }
  
  if (!params.selectedUnit) {
    errors.push('Unit is required');
  }
  
  if (params.questionCount) {
    const count = sanitizeNumber(params.questionCount, 1, 60);
    if (count !== params.questionCount) {
      errors.push('Question count must be between 1 and 60');
    }
  }
  
  if (params.difficulty) {
    try {
      validateEnum(params.difficulty, ['easy', 'medium', 'hard', 'mixed']);
    } catch {
      errors.push('Invalid difficulty level');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
  
  return true;
}