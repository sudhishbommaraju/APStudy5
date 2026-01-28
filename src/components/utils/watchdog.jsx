/**
 * WATCHDOG TIMER UTILITY
 * Ensures no operation hangs indefinitely
 */

export class WatchdogTimeout extends Error {
  constructor(message, operationName) {
    super(message);
    this.name = 'WatchdogTimeout';
    this.operationName = operationName;
  }
}

/**
 * Execute an async operation with a hard timeout
 * @param {Promise} promise - The operation to execute
 * @param {number} timeoutMs - Maximum time in milliseconds
 * @param {string} operationName - Name for error messages
 * @returns {Promise} - Resolves with result or rejects with timeout
 */
export async function withWatchdog(promise, timeoutMs, operationName = 'Operation') {
  let timeoutHandle;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new WatchdogTimeout(
        `${operationName} exceeded ${timeoutMs}ms timeout`,
        operationName
      ));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle);
    throw error;
  }
}

/**
 * Retry an operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry configuration
 * @returns {Promise} - Result or throws after max attempts
 */
export async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 5000,
    shouldRetry = () => true,
    onRetry = () => {}
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      onRetry(error, attempt, delay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * BOUNDED OPERATION WRAPPER
 * Ensures any operation completes within bounds
 */
export async function boundedOperation(operation, bounds = {}) {
  const {
    timeoutMs = 15000,
    maxRetries = 3,
    operationName = 'Bounded Operation',
    onProgress = () => {}
  } = bounds;

  return withWatchdog(
    withRetry(operation, {
      maxAttempts: maxRetries,
      onRetry: (error, attempt) => {
        onProgress({ 
          phase: 'retrying', 
          attempt, 
          maxAttempts: maxRetries,
          error: error.message 
        });
      }
    }),
    timeoutMs,
    operationName
  );
}