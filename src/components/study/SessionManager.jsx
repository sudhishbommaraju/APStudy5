/**
 * Session Resume & Data Safety
 * Professional-grade session management
 * Never lose progress, graceful error handling
 */

const SESSION_STORAGE_KEY = 'proofly_active_session';

export class SessionManager {
  /**
   * Save session progress to localStorage
   */
  static saveSession(sessionData) {
    try {
      const data = {
        ...sessionData,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save session:', e);
      return false;
    }
  }

  /**
   * Load saved session
   */
  static loadSession() {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return null;

      const session = JSON.parse(data);
      
      // Check if session is still valid (within 24 hours)
      const lastSaved = new Date(session.lastSaved);
      const now = new Date();
      const hoursSince = (now - lastSaved) / (1000 * 60 * 60);
      
      if (hoursSince > 24) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (e) {
      console.error('Failed to load session:', e);
      return null;
    }
  }

  /**
   * Clear saved session
   */
  static clearSession() {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  }

  /**
   * Auto-save wrapper for session updates
   */
  static withAutoSave(updateFn) {
    return (...args) => {
      const result = updateFn(...args);
      
      // If result is a session state object, save it
      if (result && typeof result === 'object') {
        this.saveSession(result);
      }
      
      return result;
    };
  }

  /**
   * Create recoverable session snapshot
   */
  static createSnapshot(sessionData, questions, answers, currentIndex) {
    return {
      type: sessionData.mode,
      session_id: sessionData.session_id,
      subject_id: sessionData.subject_id,
      unit_ids: sessionData.unit_ids,
      questions: questions.map(q => q.id),
      answers,
      currentIndex,
      timeRemaining: sessionData.timeRemaining,
      startedAt: sessionData.startedAt
    };
  }

  /**
   * Check for resume-able session
   */
  static hasActiveSession() {
    const session = this.loadSession();
    return session !== null;
  }

  /**
   * Safe error handler for async operations
   */
  static async withErrorHandler(operation, fallback = null) {
    try {
      return await operation();
    } catch (error) {
      console.error('Operation failed:', error);
      
      // User-friendly error messages
      const userMessage = this.getUserFriendlyError(error);
      
      return {
        success: false,
        error: userMessage,
        fallback
      };
    }
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  static getUserFriendlyError(error) {
    if (error.message?.includes('network')) {
      return 'Connection issue. Please check your internet and try again.';
    }
    
    if (error.message?.includes('timeout')) {
      return 'Request took too long. Please try again.';
    }
    
    if (error.message?.includes('auth')) {
      return 'Session expired. Please refresh the page.';
    }
    
    return 'Something went wrong. Your progress has been saved.';
  }

  /**
   * Auto-save interval setup
   */
  static startAutoSave(getData, interval = 30000) {
    return setInterval(() => {
      const data = getData();
      if (data) {
        this.saveSession(data);
      }
    }, interval);
  }

  /**
   * Stop auto-save
   */
  static stopAutoSave(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
}

export default SessionManager;